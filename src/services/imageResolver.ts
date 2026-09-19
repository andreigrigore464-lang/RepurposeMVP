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

export interface ResolveMultipleImagesOptions {
  count: number;
  strategy: BackgroundImageStrategy;
  articleImages?: string[];
  visualKeywords?: string[];
  aspectRatio?: string;
}

/**
 * Resolves an exact requested count of distinct images based on the chosen strategy:
 * - ARTICLE_IMAGE_FIRST: Uses in-article photos first, then fills any missing slots with Unsplash / curated stock photos.
 * - STOCK_SEARCH_ONLY: Fetches distinct contextual stock photos from Unsplash for every slot.
 */
export async function resolveMultipleImages(
  options: ResolveMultipleImagesOptions
): Promise<string[]> {
  const {
    count,
    strategy,
    articleImages = [],
    visualKeywords = [],
    aspectRatio = "1:1",
  } = options;

  if (count <= 0) return [];

  const orientation =
    aspectRatio === "4:5" || aspectRatio === "9:16"
      ? "portrait"
      : aspectRatio === "16:9"
      ? "landscape"
      : "squarish";

  const resolved: string[] = [];
  const usedUrls = new Set<string>();

  // 1. Article Images First Strategy
  if (strategy === "ARTICLE_IMAGE_FIRST") {
    for (const rawUrl of articleImages) {
      if (!rawUrl || usedUrls.has(rawUrl)) continue;
      try {
        const cropped = await uploadToCloudinary(rawUrl, "repurpose_articles", {
          smartCrop: true,
          aspectRatio,
        });
        resolved.push(cropped);
        usedUrls.add(rawUrl);
      } catch {
        const fallback = applySmartCropTransformation(rawUrl, { aspectRatio });
        resolved.push(fallback);
        usedUrls.add(rawUrl);
      }
      if (resolved.length >= count) break;
    }
  }

  // 2. If more images are needed (or if STOCK_SEARCH_ONLY), fetch from Unsplash
  if (resolved.length < count && strategy !== "SOLID_COLOR_ONLY" && strategy !== "DISABLED") {
    const needed = count - resolved.length;

    // Try fetching batch photos with visual keywords
    const keywordsList = visualKeywords.length > 0 ? visualKeywords : ["modern technology", "abstract minimal", "business growth"];
    
    for (let i = 0; i < needed; i++) {
      const kw = keywordsList[i % keywordsList.length] || keywordsList[0];
      const stockPhotoUrl = await fetchUnsplashPhoto(kw, orientation);
      if (stockPhotoUrl && !usedUrls.has(stockPhotoUrl)) {
        try {
          const cropped = await uploadToCloudinary(stockPhotoUrl, "repurpose_stock", {
            smartCrop: true,
            aspectRatio,
          });
          resolved.push(cropped);
          usedUrls.add(stockPhotoUrl);
        } catch {
          const fallback = applySmartCropTransformation(stockPhotoUrl, { aspectRatio });
          resolved.push(fallback);
          usedUrls.add(stockPhotoUrl);
        }
      }
    }
  }

  // 3. Fallback to Curated Stock Collection if still short
  let curIndex = 0;
  while (resolved.length < count) {
    const fallbackUrl = CURATED_STOCK_COLLECTION[curIndex % CURATED_STOCK_COLLECTION.length];
    const transformed = applySmartCropTransformation(fallbackUrl, { aspectRatio });
    if (!resolved.includes(transformed) || resolved.length >= CURATED_STOCK_COLLECTION.length) {
      resolved.push(transformed);
    }
    curIndex++;
  }

  return resolved.slice(0, count);
}

/**
 * Searches Unsplash API for a high-resolution photo matching keywords and orientation.
 * Gracefully tries specific individual keywords if multi-word queries return 0 results.
 */
async function fetchUnsplashPhoto(query: string, orientation = "squarish"): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || accessKey.startsWith("mock_")) {
    return null;
  }

  const searchTerms = [
    query.trim(),
    query.split(" ").slice(0, 2).join(" ").trim(),
    query.split(" ")[0]?.trim(),
    "minimal abstract background",
  ].filter(Boolean);

  for (const term of searchTerms) {
    try {
      const encodedQuery = encodeURIComponent(term);
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=3&orientation=${orientation}`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
            "Accept-Version": "v1",
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];
      if (results.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(results.length, 3));
        const picked = results[randomIndex]?.urls;
        const pickedUrl = picked?.regular || picked?.full || picked?.small || null;
        if (pickedUrl) return pickedUrl;
      }
    } catch {
      // Continue to next search term
    }
  }

  return null;
}
