import { CarouselSlide } from "./ai/types";
import {
  renderTemplate,
  getTemplatedTemplate,
  TemplatedLayer,
  normalizeTemplateConfig,
  dynamicConfigToLegacyMappings,
} from "@/lib/templated";
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

export interface ResolvedTemplateLayers {
  headlineLayerName: string | null;
  bodyLayerName: string | null;
  bgImageLayerName: string | null;
  logoLayerName: string | null;
  counterLayerName: string | null;
}

/**
 * Fetches the template's layer schema from Templated.io or database and dynamically resolves
 * matching layer names for headline, body, background image, logo, and slide counter.
 */
export async function getTemplateLayers(
  templateId: string,
  customMappings?: BatchRenderOptions["customLayerMappings"]
): Promise<ResolvedTemplateLayers> {
  // 1. If explicit custom mappings provided, map them directly
  if (customMappings && Object.keys(customMappings).length > 0) {
    return {
      headlineLayerName: customMappings.headline_layer || null,
      bodyLayerName: customMappings.body_layer || null,
      bgImageLayerName: customMappings.background_layer || null,
      logoLayerName: customMappings.logo_layer || null,
      counterLayerName: customMappings.counter_layer || null,
    };
  }

  // 2. Check Database for saved template layer mappings
  try {
    const dbTmpl = await prisma.brandTemplate.findFirst({
      where: {
        OR: [
          { templatedTemplateId: templateId },
          { id: templateId },
        ],
      },
    });

    if (dbTmpl && dbTmpl.layerMappings && typeof dbTmpl.layerMappings === "object") {
      const normalized = normalizeTemplateConfig(dbTmpl.layerMappings);
      const legacyMap = dynamicConfigToLegacyMappings(normalized);
      if (
        legacyMap.headline_layer ||
        legacyMap.body_layer ||
        legacyMap.background_layer ||
        legacyMap.logo_layer ||
        legacyMap.counter_layer
      ) {
        return {
          headlineLayerName: legacyMap.headline_layer || null,
          bodyLayerName: legacyMap.body_layer || null,
          bgImageLayerName: legacyMap.background_layer || null,
          logoLayerName: legacyMap.logo_layer || null,
          counterLayerName: legacyMap.counter_layer || null,
        };
      }
    }
  } catch {
    // Continue to cloud fetch
  }

  // 3. Fetch template schema dynamically from Templated.io REST API
  try {
    const cloudTmpl = await getTemplatedTemplate(templateId);
    if (cloudTmpl && Array.isArray(cloudTmpl.layers) && cloudTmpl.layers.length > 0) {
      return resolveLayersFromSchema(cloudTmpl.layers);
    }
  } catch (err) {
    console.warn(`[getTemplateLayers] Could not fetch schema from cloud for template "${templateId}":`, err);
  }

  // 4. Default fallback layer names matching standard starter templates
  return {
    headlineLayerName: "headline_text",
    bodyLayerName: "body_text",
    bgImageLayerName: "background_image",
    logoLayerName: "brand_logo",
    counterLayerName: "slide_counter",
  };
}

/**
 * Inspects Templated.io layer objects and resolves layer names based on types and naming patterns.
 */
export function resolveLayersFromSchema(layers: TemplatedLayer[]): ResolvedTemplateLayers {
  const getLayerKey = (l: TemplatedLayer) => (l.layer || l.name || (l as unknown as { id?: string }).id || "") as string;

  const textLayers = layers.filter((l) => {
    const type = (l.type || "").toLowerCase();
    return type === "text" || type.includes("text") || l.text !== undefined;
  });

  const imageLayers = layers.filter((l) => {
    const type = (l.type || "").toLowerCase();
    return type === "image" || type === "photo" || type.includes("image") || l.image_url !== undefined;
  });

  // a) Headline / Title: Find text layer named headline_text, title, headline, heading, or the first text layer
  let headlineLayerName: string | null = null;
  const headlineCandidates = ["headline_text", "headline", "title", "heading", "hook", "header"];
  for (const candidate of headlineCandidates) {
    const match = textLayers.find((l) => {
      const k = getLayerKey(l).toLowerCase();
      return k === candidate || k.includes(candidate);
    });
    if (match) {
      headlineLayerName = getLayerKey(match);
      break;
    }
  }
  // Smart Heuristic: Pick the text layer with the largest font size
  if (!headlineLayerName && textLayers.length > 0) {
    const sortedByFontSize = [...textLayers].sort((a, b) => {
      const sizeA = parseFloat(String(a.font_size || "0").replace(/[^0-9.]/g, "")) || 0;
      const sizeB = parseFloat(String(b.font_size || "0").replace(/[^0-9.]/g, "")) || 0;
      return sizeB - sizeA;
    });
    headlineLayerName = getLayerKey(sortedByFontSize[0]);
  }

  // b) Body / Subtitle: Find text layer named body_text, body, subtitle, text, or second largest text layer
  let bodyLayerName: string | null = null;
  const bodyCandidates = ["body_text", "body", "subtitle", "subheading", "text", "quote", "content", "description"];
  for (const candidate of bodyCandidates) {
    const match = textLayers.find((l) => {
      const k = getLayerKey(l);
      return (
        k !== headlineLayerName &&
        (k.toLowerCase() === candidate || k.toLowerCase().includes(candidate))
      );
    });
    if (match) {
      bodyLayerName = getLayerKey(match);
      break;
    }
  }
  if (!bodyLayerName) {
    const remainingText = textLayers.filter((l) => getLayerKey(l) !== headlineLayerName);
    if (remainingText.length > 0) {
      const sortedRemaining = [...remainingText].sort((a, b) => {
        const sizeA = parseFloat(String(a.font_size || "0").replace(/[^0-9.]/g, "")) || 0;
        const sizeB = parseFloat(String(b.font_size || "0").replace(/[^0-9.]/g, "")) || 0;
        return sizeB - sizeA;
      });
      bodyLayerName = getLayerKey(sortedRemaining[0]);
    }
  }

  // c) Background Image: Find image layer named background_image, background, image, or first image layer
  let bgImageLayerName: string | null = null;
  const bgCandidates = ["background_image", "background", "bg", "image", "photo", "backdrop"];
  for (const candidate of bgCandidates) {
    const match = imageLayers.find((l) => {
      const k = getLayerKey(l).toLowerCase();
      return k === candidate || k.includes(candidate);
    });
    if (match) {
      bgImageLayerName = getLayerKey(match);
      break;
    }
  }
  if (!bgImageLayerName && imageLayers.length > 0) {
    bgImageLayerName = getLayerKey(imageLayers[0]);
  }

  // d) Brand Logo: Find image layer named brand_logo, logo, or second image layer
  let logoLayerName: string | null = null;
  const logoCandidates = ["brand_logo", "logo", "avatar", "icon", "brand"];
  for (const candidate of logoCandidates) {
    const match = imageLayers.find((l) => {
      const k = getLayerKey(l);
      return (
        k !== bgImageLayerName &&
        (k.toLowerCase() === candidate || k.toLowerCase().includes(candidate))
      );
    });
    if (match) {
      logoLayerName = getLayerKey(match);
      break;
    }
  }
  if (!logoLayerName) {
    const remainingImages = imageLayers.filter((l) => getLayerKey(l) !== bgImageLayerName);
    if (remainingImages.length > 0) {
      logoLayerName = getLayerKey(remainingImages[0]);
    }
  }

  // e) Slide Counter: Find text layer named slide_counter, counter, or page_number
  let counterLayerName: string | null = null;
  const counterCandidates = ["slide_counter", "counter", "page_number", "page", "number", "slide_number"];
  for (const candidate of counterCandidates) {
    const match = textLayers.find((l) => {
      const k = getLayerKey(l);
      return (
        k !== headlineLayerName &&
        k !== bodyLayerName &&
        (k.toLowerCase() === candidate || k.toLowerCase().includes(candidate))
      );
    });
    if (match) {
      counterLayerName = getLayerKey(match);
      break;
    }
  }

  return {
    headlineLayerName,
    bodyLayerName,
    bgImageLayerName,
    logoLayerName,
    counterLayerName,
  };
}

/**
 * Renders multiple carousel slides or a single social card concurrently using Templated.io REST API.
 * Injects dynamic AI content into resolved layer keys:
 * - Text layers: { "text": "The dynamic text string" }
 * - Image layers: { "image_url": "https://public-image-url.jpg" }
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

  // 1. Dynamically fetch & resolve layer mapping names
  const {
    headlineLayerName,
    bodyLayerName,
    bgImageLayerName,
    logoLayerName,
    counterLayerName,
  } = await getTemplateLayers(templateId, customLayerMappings);

  const totalSlides = slidesData.length;

  const renderPromises = slidesData.map(async (slide) => {
    // 2. Build the Injected Layers Payload with explicit type keys
    const layersPayload: Record<string, { text?: string; image_url?: string }> = {};

    if (headlineLayerName && slide.headline) {
      layersPayload[headlineLayerName] = { text: slide.headline };
    }
    if (bodyLayerName && slide.body) {
      layersPayload[bodyLayerName] = { text: slide.body };
    }

    const slideBgUrl = slide.background_image_url || backgroundImageUrl;
    if (bgImageLayerName && slideBgUrl) {
      layersPayload[bgImageLayerName] = { image_url: slideBgUrl };
    }
    if (logoLayerName && brandKitLogoUrl) {
      layersPayload[logoLayerName] = { image_url: brandKitLogoUrl };
    }
    if (counterLayerName) {
      layersPayload[counterLayerName] = { text: `${slide.slide_index} / ${totalSlides}` };
    }

    try {
      const renderRes = await renderTemplate({
        templateId,
        layers: layersPayload,
        externalId,
        async: false,
      });

      const renderedUrl =
        renderRes?.render_url ||
        renderRes?.download_url ||
        renderRes?.thumbnail_url ||
        generateMockSlideImageUrl(slide, totalSlides, slideBgUrl);

      return {
        slide_index: slide.slide_index,
        headline: slide.headline,
        body: slide.body,
        rendered_png_url: renderedUrl,
        background_image_url: slideBgUrl || null,
      };
    } catch (err) {
      console.warn(`[Templated Batch Render] Slide #${slide.slide_index} API render failed, using fallback:`, err);
      return {
        slide_index: slide.slide_index,
        headline: slide.headline,
        body: slide.body,
        rendered_png_url: generateMockSlideImageUrl(slide, totalSlides, slideBgUrl),
        background_image_url: slideBgUrl || null,
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
