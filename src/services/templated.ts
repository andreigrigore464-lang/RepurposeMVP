import { CarouselSlide } from "./ai/types";
import { renderTemplate, getTemplatedTemplate, extractLayerMappings } from "@/lib/templated";
import prisma from "@/lib/prisma";

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
 * Renders multiple carousel slides or a single social card concurrently using Templated.io REST API.
 * Automatically inspects template metadata and layer schema to bind text and image placeholders dynamically.
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
    customLayerMappings,
  } = options;

  // 1. Auto-resolve layer schema from DB or Templated REST API
  let resolvedMappings = customLayerMappings;
  let hasImagePlaceholder = true;

  if (!resolvedMappings || Object.keys(resolvedMappings).length === 0) {
    try {
      // Check database first
      const dbTmpl = await prisma.brandTemplate.findFirst({
        where: { templatedTemplateId: templateId },
      });

      if (dbTmpl && dbTmpl.layerMappings && typeof dbTmpl.layerMappings === "object") {
        resolvedMappings = dbTmpl.layerMappings as Record<string, string>;
        hasImagePlaceholder = dbTmpl.hasBackgroundPlaceholder;
      } else {
        // Fetch schema dynamically from Templated.io API
        const cloudTmpl = await getTemplatedTemplate(templateId);
        if (cloudTmpl && Array.isArray(cloudTmpl.layers)) {
          resolvedMappings = extractLayerMappings(cloudTmpl.layers);
          hasImagePlaceholder = cloudTmpl.layers.some(
            (l) => (l.type === "image" || l.type === "photo") && !l.name?.toLowerCase().includes("logo")
          );
        }
      }
    } catch {
      // Fallback to standard conventions
      resolvedMappings = {
        headline_layer: "headline_text",
        body_layer: "body_text",
        background_layer: "background_image",
        logo_layer: "brand_logo",
        counter_layer: "slide_counter",
      };
    }
  }

  const headlineKey = resolvedMappings?.headline_layer || "headline_text";
  const bodyKey = resolvedMappings?.body_layer || "body_text";
  const backgroundKey = resolvedMappings?.background_layer || "background_image";
  const logoKey = resolvedMappings?.logo_layer || "brand_logo";
  const counterKey = resolvedMappings?.counter_layer || "slide_counter";

  const totalSlides = slidesData.length;

  const renderPromises = slidesData.map(async (slide) => {
    const layers: Record<string, unknown> = {
      [headlineKey]: { text: slide.headline },
      [bodyKey]: { text: slide.body },
    };

    // Only set slide counter if there are multiple slides
    if (totalSlides > 1) {
      layers[counterKey] = { text: `${slide.slide_index}/${totalSlides}` };
    }

    // Only inject background image if the template supports an image placeholder and an image was provided
    if (hasImagePlaceholder && backgroundImageUrl) {
      layers[backgroundKey] = { image_url: backgroundImageUrl };
    }

    // Inject logo if available
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
        background_image_url: hasImagePlaceholder ? backgroundImageUrl : null,
      };
    } catch (err) {
      console.warn(`[Templated Batch Render] Slide #${slide.slide_index} API render failed, using fallback:`, err);
      return {
        slide_index: slide.slide_index,
        headline: slide.headline,
        body: slide.body,
        rendered_png_url: generateMockSlideImageUrl(slide, totalSlides, backgroundImageUrl),
        background_image_url: hasImagePlaceholder ? backgroundImageUrl : null,
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
  if (bgUrl && bgUrl.startsWith("http")) {
    return bgUrl;
  }
  return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop&sig=${slide.slide_index}`;
}
