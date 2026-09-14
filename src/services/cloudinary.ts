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

/**
 * Uploads an image URL or buffer to Cloudinary and returns an optimized CDN URL.
 */
export async function uploadToCloudinary(
  source: string | Buffer,
  folder = "repurpose_assets",
  options: { publicId?: string; resourceType?: "image" | "raw" | "auto" } = {}
): Promise<string> {
  if (!isCloudinaryConfigured) {
    // If source is already a string URL, return it directly
    if (typeof source === "string") {
      return source;
    }
    // If buffer in offline mode, return a placeholder CDN image
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop";
  }

  try {
    if (typeof source === "string") {
      const result = await cloudinary.uploader.upload(source, {
        folder,
        public_id: options.publicId,
        resource_type: options.resourceType || "image",
        overwrite: true,
      });
      return result.secure_url;
    } else {
      // Upload buffer via upload_stream
      return new Promise<string>((resolve, reject) => {
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
  } catch (error) {
    console.warn("[Cloudinary] Upload failed, falling back to source:", error);
    if (typeof source === "string") return source;
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop";
  }
}
