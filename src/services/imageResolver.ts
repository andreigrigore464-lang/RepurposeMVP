import { uploadToCloudinary, applySmartCropTransformation } from "./cloudinary";
import { CarouselSlide } from "./ai/types";

export type BackgroundImageStrategy =
  | "ARTICLE_IMAGE_FIRST"
  | "STOCK_SEARCH_ONLY"
  | "SOLID_COLOR_ONLY"
  | "DISABLED";

export interface ResolveImageOptions {
  strategy: BackgroundImageStrategy;
  articleImageUrl?: string | null;
  visualKeywords?: string[];
  aspectRatio?: string;
  fallbackTheme?: string;
}

export interface ResolveCarouselOptions {
  strategy: BackgroundImageStrategy;
  articleImages?: string[];
  slides: CarouselSlide[];
  fallbackKeywords?: string[];
  aspectRatio?: string;
}

const CURATED_STOCK_COLLECTION = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop",
];

/**
 * Resolves a unique, high-quality background image for every slide in a carousel deck.
 * Prioritizes in-article images for the first slides, then uses per-slide AI visual keywords
 * to fetch targeted stock imagery, with automatic Cloudinary AI smart subject cropping.
 */
export async function resolveCarouselBackgroundImages(
  options: ResolveCarouselOptions
): Promise<(string | null)[]> {
  const {
    strategy,
    articleImages = [],
    slides,
    fallbackKeywords = [],
    aspectRatio = "1:1",
  } = options;

  // 1. Solid Color / Disabled Strategy
  if (strategy === "SOLID_COLOR_ONLY" || strategy === "DISABLED") {
    return slides.map(() => null);
  }

  const orientation =
    aspectRatio === "4:5" || aspectRatio === "9:16"
      ? "portrait"
      : aspectRatio === "16:9"
      ? "landscape"
      : "squarish";

  // 2. Concurrently resolve each slide's background image
  const resolutionPromises = slides.map(async (slide, idx) => {
    // Strategy A: Prioritize in-article images (Slide 0 gets featured image, Slide 1 gets 2nd image, etc.)
    if (strategy === "ARTICLE_IMAGE_FIRST" && articleImages[idx]) {
      const rawArticleUrl = articleImages[idx];
      try {
        return await uploadToCloudinary(rawArticleUrl, "repurpose_articles", {
          smartCrop: true,
          aspectRatio,
        });
      } catch (err) {
        console.warn(`[ImageResolver] Cloudinary upload failed for article image #${idx + 1}:`, err);
        return applySmartCropTransformation(rawArticleUrl, { aspectRatio });
      }
    }

    // Strategy B: Slide-specific AI visual keyword search on Unsplash
    const query =
      slide.visual_keyword ||
      fallbackKeywords[idx % (fallbackKeywords.length || 1)] ||
      fallbackKeywords[0] ||
      "minimal modern abstract";

    const stockPhotoUrl = await fetchUnsplashPhoto(query, orientation);
    if (stockPhotoUrl) {
      try {
        return await uploadToCloudinary(stockPhotoUrl, "repurpose_stock", {
          smartCrop: true,
          aspectRatio,
        });
      } catch {
        return applySmartCropTransformation(stockPhotoUrl, { aspectRatio });
      }
    }

    // Strategy C: Curated stock fallback
    const fallbackUrl = CURATED_STOCK_COLLECTION[idx % CURATED_STOCK_COLLECTION.length];
    return applySmartCropTransformation(fallbackUrl, { aspectRatio });
  });

  return await Promise.all(resolutionPromises);
}

/**
 * Resolves the optimal background image URL for single cards or fallback contexts.
 */
export async function resolveBackgroundImage(options: ResolveImageOptions): Promise<string | null> {
  const { strategy, articleImageUrl, visualKeywords = [], aspectRatio = "1:1" } = options;

  if (strategy === "SOLID_COLOR_ONLY" || strategy === "DISABLED") {
    return null;
  }

  const orientation =
    aspectRatio === "4:5" || aspectRatio === "9:16"
      ? "portrait"
      : aspectRatio === "16:9"
      ? "landscape"
      : "squarish";

  if (strategy === "ARTICLE_IMAGE_FIRST" && articleImageUrl) {
    try {
      return await uploadToCloudinary(articleImageUrl, "repurpose_articles", {
        smartCrop: true,
        aspectRatio,
      });
    } catch (err) {
      console.warn("[ImageResolver] Cloudinary upload for article image failed:", err);
      return applySmartCropTransformation(articleImageUrl, { aspectRatio });
    }
  }

  const query = visualKeywords.length > 0 ? visualKeywords.join(" ") : "minimal abstract gradient";
  const stockPhotoUrl = await fetchUnsplashPhoto(query, orientation);

  if (stockPhotoUrl) {
    try {
      return await uploadToCloudinary(stockPhotoUrl, "repurpose_stock", {
        smartCrop: true,
        aspectRatio,
      });
    } catch {
      return applySmartCropTransformation(stockPhotoUrl, { aspectRatio });
    }
  }

  const randomIndex = Math.floor(Math.random() * CURATED_STOCK_COLLECTION.length);
  return applySmartCropTransformation(CURATED_STOCK_COLLECTION[randomIndex], { aspectRatio });
}

/**
 * Searches Unsplash API for a high-resolution photo matching keywords and orientation.
 */
async function fetchUnsplashPhoto(query: string, orientation = "squarish"): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || accessKey.startsWith("mock_")) {
    return null;
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=1&orientation=${orientation}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      console.warn(`[ImageResolver] Unsplash API returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    const firstResult = data.results?.[0];
    if (firstResult && firstResult.urls) {
      return firstResult.urls.regular || firstResult.urls.full || firstResult.urls.small || null;
    }

    return null;
  } catch (error) {
    console.warn("[ImageResolver] Unsplash search failed:", error);
    return null;
  }
}
