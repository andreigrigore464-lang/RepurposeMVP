import { NextResponse } from "next/server";
import { getTemplatedTemplate, autoHeuristicLayerConfig, dynamicConfigToLegacyMappings, isMockTemplate, MOCK_TEMPLATE_ID } from "@/lib/templated";

// GET /api/v1/templates/layers?templateId=...
// Inspects a template from Templated.io and returns parsed layers with rich metadata and auto-configured fields
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json({ error: "templateId query parameter is required" }, { status: 400 });
    }

    if (isMockTemplate(templateId)) {
      const mockLayers = [
        { key: "mock_headline", name: "mock_headline", type: "text" as const, layerType: "text", label: "mock_headline (Text)" },
        { key: "mock_subheading", name: "mock_subheading", type: "text" as const, layerType: "text", label: "mock_subheading (Text)" },
        { key: "mock_body", name: "mock_body", type: "text" as const, layerType: "text", label: "mock_body (Text)" },
        { key: "mock_takeaway", name: "mock_takeaway", type: "text" as const, layerType: "text", label: "mock_takeaway (Text)" },
        { key: "mock_statistic", name: "mock_statistic", type: "text" as const, layerType: "text", label: "mock_statistic (Text)" },
        { key: "mock_quote", name: "mock_quote", type: "text" as const, layerType: "text", label: "mock_quote (Text)" },
        { key: "mock_cta", name: "mock_cta", type: "text" as const, layerType: "text", label: "mock_cta (Text)" },
        { key: "mock_counter", name: "mock_counter", type: "counter" as const, layerType: "counter", label: "mock_counter (Counter)" },
        { key: "mock_hero_image", name: "mock_hero_image", type: "image" as const, layerType: "image", label: "mock_hero_image (Image)" },
        { key: "mock_secondary_image_1", name: "mock_secondary_image_1", type: "image" as const, layerType: "image", label: "mock_secondary_image_1 (Image)" },
        { key: "mock_secondary_image_2", name: "mock_secondary_image_2", type: "image" as const, layerType: "image", label: "mock_secondary_image_2 (Image)" },
        { key: "mock_secondary_image_3", name: "mock_secondary_image_3", type: "image" as const, layerType: "image", label: "mock_secondary_image_3 (Image)" },
        { key: "mock_brand_logo", name: "mock_brand_logo", type: "image" as const, layerType: "image", label: "mock_brand_logo (Image)" },
      ];

      return NextResponse.json({
        success: true,
        templateId: MOCK_TEMPLATE_ID,
        templateName: "Mock Simulation (0 Credits)",
        isMock: true,
        textLayers: mockLayers.filter((l) => l.type === "text" || l.type === "counter"),
        imageLayers: mockLayers.filter((l) => l.type === "image"),
        allLayers: mockLayers,
        autoConfig: {
          version: 2,
          isConfigured: false,
          fields: [], // No pre-configured slides
        },
        suggestedMappings: {},
      });
    }

    const templateData = await getTemplatedTemplate(templateId);
    if (!templateData || !Array.isArray(templateData.layers) || templateData.layers.length === 0) {
      const fallbackLayers = [
        { key: "headline_text", name: "headline_text", type: "text", label: "headline_text (Text)" },
        { key: "body_text", name: "body_text", type: "text", label: "body_text (Text)" },
        { key: "background_image", name: "background_image", type: "image", label: "background_image (Image)" },
        { key: "brand_logo", name: "brand_logo", type: "image", label: "brand_logo (Image)" },
        { key: "slide_counter", name: "slide_counter", type: "counter", label: "slide_counter (Counter)" },
      ];
      return NextResponse.json({
        success: true,
        templateId,
        templateName: templateData?.name || "Template",
        textLayers: fallbackLayers.filter((l) => l.type === "text" || l.type === "counter"),
        imageLayers: fallbackLayers.filter((l) => l.type === "image"),
        allLayers: fallbackLayers,
        autoConfig: {
          version: 2,
          isConfigured: true,
          fields: [
            { id: "f-1", layerKey: "headline_text", type: "text", role: "headline", label: "Headline / Slide Hook", isRequired: true, characterLimit: 80 },
            { id: "f-2", layerKey: "body_text", type: "text", role: "body", label: "Body Copy / Takeaway", isRequired: true, characterLimit: 180 },
            { id: "f-3", layerKey: "background_image", type: "image", role: "hero_image", label: "Hero Background Visual", isRequired: false },
            { id: "f-4", layerKey: "brand_logo", type: "image", role: "brand_logo", label: "Brand Logo / Avatar", isRequired: false },
            { id: "f-5", layerKey: "slide_counter", type: "counter", role: "slide_counter", label: "Slide Counter Index", isRequired: false, characterLimit: 10 },
          ],
        },
        suggestedMappings: {
          headline_layer: "headline_text",
          body_layer: "body_text",
          background_layer: "background_image",
          counter_layer: "slide_counter",
          logo_layer: "brand_logo",
        },
      });
    }

    const rawLayers = templateData.layers;

    // Deduplicate and ensure strictly unique keys for all canvas layers
    const seenKeys = new Set<string>();
    const allLayers: Array<{
      key: string;
      name: string;
      type: "text" | "image" | "shape" | "counter";
      layerType: string;
      label: string;
      sampleText?: string;
      fontSize?: string;
      width?: number;
      height?: number;
      imageUrl?: string | null;
    }> = [];

    const textLayers: typeof allLayers = [];
    const imageLayers: typeof allLayers = [];

    for (let i = 0; i < rawLayers.length; i++) {
      const l = rawLayers[i];
      const rawKey = (l.layer || l.name || (l as { id?: string }).id || `layer-${i + 1}`).toString().trim();
      if (!rawKey) continue;

      let uniqueKey = rawKey;
      let counter = 1;
      while (seenKeys.has(uniqueKey)) {
        counter++;
        uniqueKey = `${rawKey}-${counter}`;
      }
      seenKeys.add(uniqueKey);

      const rawType = (l.type || "").toLowerCase();
      const isImage = rawType === "image" || rawType === "photo" || rawType.includes("image") || l.image_url !== undefined;
      const isText = !isImage && (rawType === "text" || rawType.includes("text") || l.text !== undefined || l.font_size !== undefined);
      const isCounter = isText && (uniqueKey.toLowerCase().includes("count") || uniqueKey.toLowerCase().includes("slide"));

      const type: "text" | "image" | "shape" | "counter" = isImage ? "image" : isCounter ? "counter" : isText ? "text" : "shape";

      const sample = isText && l.text ? String(l.text).slice(0, 35) : undefined;
      const fontSize = l.font_size ? String(l.font_size) : undefined;
      const numWidth = typeof l.width === "number" ? l.width : typeof l.width === "string" ? parseInt(l.width, 10) : undefined;
      const numHeight = typeof l.height === "number" ? l.height : typeof l.height === "string" ? parseInt(l.height, 10) : undefined;
      const dims = isImage && numWidth && numHeight ? ` (${numWidth}x${numHeight})` : "";

      let label = uniqueKey;
      if (sample) {
        label = `${uniqueKey} — "${sample}"${fontSize ? ` (${fontSize})` : ""}`;
      } else if (dims) {
        label = `${uniqueKey}${dims}`;
      } else if (l.name && l.name !== uniqueKey) {
        label = `${uniqueKey} (${l.name})`;
      }

      const layerObj = {
        key: uniqueKey,
        name: l.name || uniqueKey,
        type,
        layerType: type,
        label,
        sampleText: sample,
        fontSize,
        width: Number.isNaN(numWidth) ? undefined : numWidth,
        height: Number.isNaN(numHeight) ? undefined : numHeight,
        imageUrl: typeof l.image_url === "string" ? l.image_url : null,
      };

      allLayers.push(layerObj);
      if (isImage) {
        imageLayers.push(layerObj);
      } else if (isText || isCounter) {
        textLayers.push(layerObj);
      }
    }

    // Compute automatic smart heuristic configuration
    const autoConfig = autoHeuristicLayerConfig(rawLayers);
    const suggestedMappings = dynamicConfigToLegacyMappings(autoConfig);

    return NextResponse.json({
      success: true,
      templateId,
      templateName: templateData.name,
      textLayers,
      imageLayers,
      allLayers,
      autoConfig,
      suggestedMappings,
    });
  } catch (error) {
    console.error("[Templates Layers Inspection Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to inspect template layers" },
      { status: 500 }
    );
  }
}

