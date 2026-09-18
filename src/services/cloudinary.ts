import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary if credentials exist
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured =
  Boolean(cloudName && apiKey && apiSecret) &&
  !cloudName?.startsWith("mock_") &&
  !apiKey?.startsWith("mock_");

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export interface SmartCropOptions {
  width?: number;
  height?: number;
  aspectRatio?: string; // "1:1" | "4:5" | "16:9" | "9:16"
}

/**
 * Calculates target dimensions based on aspect ratio or explicit width/height.
 */
export function getDimensionsForAspectRatio(aspectRatio = "1:1", customWidth?: number, customHeight?: number): { width: number; height: number } {
  if (customWidth && customHeight) {
    return { width: customWidth, height: customHeight };
  }
  switch (aspectRatio) {
    case "4:5":
      return { width: 1080, height: 1350 };
    case "16:9":
      return { width: 1920, height: 1080 };
    case "9:16":
      return { width: 1080, height: 1920 };
    case "1:1":
    default:
      return { width: 1080, height: 1080 };
  }
}

/**
 * Injects Cloudinary AI content-aware smart cropping (c_fill, g_auto) into image URLs,
 * ensuring the main subject/face is centered and scaled without awkward distortion.
 */
export function applySmartCropTransformation(imageUrl: string, options: SmartCropOptions = {}): string {
  if (!imageUrl) return imageUrl;

  const { width, height } = getDimensionsForAspectRatio(options.aspectRatio, options.width, options.height);

  // 1. Cloudinary URL Transformation (injects c_fill,g_auto,w,h,q_auto,f_auto)
  if (imageUrl.includes("res.cloudinary.com") && imageUrl.includes("/image/upload/")) {
    const transformationSegment = `c_fill,g_auto,w_${width},h_${height},q_auto,f_auto`;
    // If transformations already present, replace or insert
    if (imageUrl.includes("/image/upload/c_") || imageUrl.includes("/image/upload/w_")) {
      return imageUrl;
    }
    return imageUrl.replace("/image/upload/", `/image/upload/${transformationSegment}/`);
  }

  // 2. Unsplash URL Transformation
  if (imageUrl.includes("images.unsplash.com")) {
    try {
      const parsedUrl = new URL(imageUrl);
      parsedUrl.searchParams.set("w", String(width));
      parsedUrl.searchParams.set("h", String(height));
      parsedUrl.searchParams.set("fit", "crop");
      parsedUrl.searchParams.set("crop", "faces,entropy");
      parsedUrl.searchParams.set("q", "80");
      parsedUrl.searchParams.set("auto", "format");
      return parsedUrl.toString();
    } catch {
      return imageUrl;
    }
  }

  return imageUrl;
}

/**
 * Uploads an image URL or buffer to Cloudinary and returns an optimized CDN URL
 * with optional AI smart subject cropping.
 */
export async function uploadToCloudinary(
  source: string | Buffer,
  folder = "repurpose_assets",
  options: {
    publicId?: string;
    resourceType?: "image" | "raw" | "auto";
    smartCrop?: boolean;
    aspectRatio?: string;
    width?: number;
    height?: number;
  } = {}
): Promise<string> {
  const { smartCrop = true, aspectRatio = "1:1" } = options;

  if (!isCloudinaryConfigured) {
    // If source is already a string URL, apply smart crop and return
    if (typeof source === "string") {
      return applySmartCropTransformation(source, { aspectRatio, width: options.width, height: options.height });
    }
    // If buffer in offline mode, return a placeholder CDN image
    return applySmartCropTransformation(
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
      { aspectRatio }
    );
  }

  try {
    let finalSecureUrl = "";
    if (typeof source === "string") {
      const result = await cloudinary.uploader.upload(source, {
        folder,
        public_id: options.publicId,
        resource_type: options.resourceType || "image",
        overwrite: true,
      });
      finalSecureUrl = result.secure_url;
    } else {
      // Upload buffer via upload_stream
      finalSecureUrl = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: options.publicId,
            resource_type: options.resourceType || "image",
            overwrite: true,
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Cloudinary upload failed"));
            } else {
              resolve(result.secure_url);
            }
          }
        );
        stream.end(source);
      });
    }

    if (smartCrop && options.resourceType !== "raw") {
      return applySmartCropTransformation(finalSecureUrl, {
        aspectRatio,
        width: options.width,
        height: options.height,
      });
    }

    return finalSecureUrl;
  } catch (error) {
    console.warn("[Cloudinary] Upload failed, falling back to source:", error);
    if (typeof source === "string") {
      return applySmartCropTransformation(source, { aspectRatio, width: options.width, height: options.height });
    }
    return applySmartCropTransformation(
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
      { aspectRatio }
    );
  }
}
