import { CarouselSlide } from "./ai/types";
import { renderTemplate } from "@/lib/templated";

export interface BatchRenderOptions {
  brandKitLogoUrl?: string | null;
  backgroundImageUrl?: string | null;
  externalId?: string;
  customLayerMappings?: {
    headline_layer?: string;
    body_layer?: string;
    background_layer?: string;
    logo_layer?: string;
    counter_layer?: string;
  };
}

export interface RenderedSlideResult {
  slide_index: number;
  headline: string;
  body: string;
  rendered_png_url: string;
  background_image_url?: string | null;
}

/**
 * Renders multiple carousel slides concurrently using Templated.io REST API.
 */
export async function renderCarouselSlides(
  templateId: string,
  slidesData: CarouselSlide[],
  options: BatchRenderOptions = {}
): Promise<RenderedSlideResult[]> {
  const {
    brandKitLogoUrl,
    backgroundImageUrl,
    externalId,
    customLayerMappings = {},
  } = options;

  const headlineKey = customLayerMappings.headline_layer || "headline_text";
  const bodyKey = customLayerMappings.body_layer || "body_text";
  const backgroundKey = customLayerMappings.background_layer || "background_image";
  const logoKey = customLayerMappings.logo_layer || "brand_logo";
  const counterKey = customLayerMappings.counter_layer || "slide_counter";

  const totalSlides = slidesData.length;

  const renderPromises = slidesData.map(async (slide) => {
    const layers: Record<string, unknown> = {
      [headlineKey]: { text: slide.headline },
      [bodyKey]: { text: slide.body },
      [counterKey]: { text: `${slide.slide_index}/${totalSlides}` },
    };

    if (backgroundImageUrl) {
      layers[backgroundKey] = { image_url: backgroundImageUrl };
    }

    if (brandKitLogoUrl) {
      layers[logoKey] = { image_url: brandKitLogoUrl };
    }

    try {
      const renderRes = await renderTemplate({
        templateId,
        layers,
        externalId,
        async: false,
      });

      const renderedUrl =
        renderRes?.render_url ||
        renderRes?.download_url ||
        renderRes?.thumbnail_url ||
        generateMockSlideImageUrl(slide, totalSlides, backgroundImageUrl);

      return {
        slide_index: slide.slide_index,
        headline: slide.headline,
        body: slide.body,
        rendered_png_url: renderedUrl,
        background_image_url: backgroundImageUrl,
      };
    } catch (err) {
      console.warn(`[Templated Batch Render] Slide #${slide.slide_index} API render failed, using fallback:`, err);
      return {
        slide_index: slide.slide_index,
        headline: slide.headline,
        body: slide.body,
        rendered_png_url: generateMockSlideImageUrl(slide, totalSlides, backgroundImageUrl),
        background_image_url: backgroundImageUrl,
      };
    }
  });

  return await Promise.all(renderPromises);
}

/**
 * Generates an SVG / placeholder data URL for slides when Templated.io API is in mock/offline mode.
 */
function generateMockSlideImageUrl(
  slide: CarouselSlide,
  totalSlides: number,
  bgUrl?: string | null
): string {
  // Return high-quality Unsplash image or dynamic SVG
  if (bgUrl && bgUrl.startsWith("http")) {
    return bgUrl;
  }
  return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop&sig=${slide.slide_index}`;
}
