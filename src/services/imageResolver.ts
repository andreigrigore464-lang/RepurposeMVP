import { uploadToCloudinary } from "./cloudinary";

export type BackgroundImageStrategy =
  | "ARTICLE_IMAGE_FIRST"
  | "STOCK_SEARCH_ONLY"
  | "SOLID_COLOR_ONLY"
  | "DISABLED";

export interface ResolveImageOptions {
  strategy: BackgroundImageStrategy;
  articleImageUrl?: string | null;
  visualKeywords?: string[];
  fallbackTheme?: string;
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
 * Resolves the optimal background image URL according to the configured 3-tier strategy.
 */
export async function resolveBackgroundImage(options: ResolveImageOptions): Promise<string | null> {
  const { strategy, articleImageUrl, visualKeywords = [] } = options;

  // 1. Solid Color / Disabled Strategy
  if (strategy === "SOLID_COLOR_ONLY" || strategy === "DISABLED") {
    return null;
  }

  // 2. Article Image First Strategy
  if (strategy === "ARTICLE_IMAGE_FIRST" && articleImageUrl) {
    try {
      // Optimize through Cloudinary CDN
      return await uploadToCloudinary(articleImageUrl, "repurpose_articles");
    } catch (err) {
      console.warn("[ImageResolver] Cloudinary upload for article image failed:", err);
      return articleImageUrl;
    }
  }

  // 3. Stock Search Strategy (or Fallback if article image was missing)
  const query = visualKeywords.length > 0 ? visualKeywords.join(" ") : "minimal abstract gradient";
  const stockPhotoUrl = await fetchUnsplashPhoto(query);

  if (stockPhotoUrl) {
    try {
      return await uploadToCloudinary(stockPhotoUrl, "repurpose_stock");
    } catch {
      return stockPhotoUrl;
    }
  }

  // Fallback to random curated stock background
  const randomIndex = Math.floor(Math.random() * CURATED_STOCK_COLLECTION.length);
  return CURATED_STOCK_COLLECTION[randomIndex];
}

/**
 * Searches Unsplash API for a high-resolution photo matching keywords.
 */
async function fetchUnsplashPhoto(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || accessKey.startsWith("mock_")) {
    return null;
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=1&orientation=squarish`,
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
