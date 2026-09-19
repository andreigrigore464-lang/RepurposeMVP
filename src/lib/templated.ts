/**
 * Templated.io Server-Side API Client & Utilities
 * Manages template synchronization and render requests for multi-tenant workspaces.
 */

export interface TemplatedLayer {
  name?: string;
  layer?: string;
  type?: string;
  text?: string;
  image_url?: string;
  color?: string;
  [key: string]: unknown;
}

export interface TemplatedTemplateResponse {
  id: string;
  name: string;
  width?: number;
  height?: number;
  preview_url?: string;
  thumbnail_url?: string;
  layers?: TemplatedLayer[];
  external_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface RenderRequestOptions {
  templateId: string;
  layers: Record<string, unknown>;
  externalId?: string;
  async?: boolean;
  webhookUrl?: string;
  downloadUrl?: boolean;
}

export interface RenderResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "COMPLETED" | "FAILED";
  render_url?: string;
  url?: string;
  download_url?: string;
  thumbnail_url?: string;
  error?: string;
}

export const MOCK_TEMPLATE_ID = "mock_simulation_template";

/**
 * Checks if a template ID refers to the zero-credit mock simulation template.
 */
export function isMockTemplate(templateId?: string | null): boolean {
  if (!templateId) return false;
  return (
    templateId === MOCK_TEMPLATE_ID ||
    templateId === "mock_template" ||
    templateId.startsWith("mock_")
  );
}

const TEMPLATED_API_BASE = "https://api.templated.io/v1";

/**
 * Returns authorization headers for Templated REST API requests.
 */
function getAuthHeaders(): HeadersInit {
  const apiKey = process.env.TEMPLATED_API_KEY;
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
}

/**
 * Fetch all templates from Templated account, optionally filtered by workspace external_id.
 */
export async function listTemplatedTemplates(externalId?: string): Promise<TemplatedTemplateResponse[]> {
  const apiKey = process.env.TEMPLATED_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const url = new URL(`${TEMPLATED_API_BASE}/templates`);
    if (externalId) {
      url.searchParams.set("external_id", externalId);
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[Templated API] listTemplates returned status ${res.status}: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const rawList = Array.isArray(data) ? data : data.templates || data.value || [];
    return rawList.map((t: Record<string, unknown>) => {
      const id = (t.id || t._id) as string;
      const updatedRaw = (t.updatedAt || t.updated_at || t.modified_at || t.createdAt || t.created_at) as string;
      const timestamp = updatedRaw ? new Date(updatedRaw).getTime() : Date.now();
      const baseThumb = (t.thumbnail || t.preview_url || t.thumbnail_url || (id ? `https://templated-assets.s3.amazonaws.com/public/thumbnail/${id}.webp` : "")) as string;
      const cleanThumb = baseThumb.split("?")[0];
      const thumb = cleanThumb ? `${cleanThumb}?v=${timestamp}` : "";

      return {
        id,
        name: (t.name || "Untitled Template") as string,
        width: Number(t.width) || 1080,
        height: Number(t.height) || 1080,
        preview_url: thumb,
        thumbnail_url: thumb,
        layers: Array.isArray(t.layers) ? t.layers : [],
        external_id: (t.externalId || t.external_id) as string,
        created_at: (t.createdAt || t.created_at) as string,
        updated_at: (t.updatedAt || t.updated_at) as string,
      };
    });
  } catch (error) {
    console.error("[Templated API Error] listTemplatedTemplates:", error);
    return [];
  }
}

/**
 * Get detailed configuration and layer schema for a specific template.
 */
export async function getTemplatedTemplate(templateId: string): Promise<TemplatedTemplateResponse | null> {
  const apiKey = process.env.TEMPLATED_API_KEY;
  if (!apiKey || !templateId) {
    return null;
  }

  try {
    // 1. Fetch layers from the official /v1/template/{id}/layers endpoint
    const layersRes = await fetch(`${TEMPLATED_API_BASE}/template/${templateId}/layers`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    let layers: TemplatedLayer[] = [];
    if (layersRes.ok) {
      const layersData = await layersRes.json();
      layers = Array.isArray(layersData) ? layersData : layersData.layers || layersData.value || [];
    }

    // 2. Fetch template metadata
    const tmplRes = await fetch(`${TEMPLATED_API_BASE}/template/${templateId}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    if (tmplRes.ok) {
      const tmplData = await tmplRes.json();
      return {
        ...tmplData,
        layers: layers.length > 0 ? layers : tmplData.layers || [],
      };
    }

    if (layers.length > 0) {
      return {
        id: templateId,
        name: "Templated Template",
        width: 1080,
        height: 1080,
        layers,
      };
    }

    return null;
  } catch (error) {
    console.error(`[Templated API Error] getTemplatedTemplate (${templateId}):`, error);
    return null;
  }
}

/**
 * Trigger an automated image/video render via Templated.io REST API.
 */
export async function renderTemplate(options: RenderRequestOptions): Promise<RenderResponse | null> {
  const apiKey = process.env.TEMPLATED_API_KEY;
  if (!apiKey) {
    throw new Error("TEMPLATED_API_KEY environment variable is not configured");
  }

  try {
    const body: Record<string, unknown> = {
      template: options.templateId,
      layers: options.layers,
    };

    if (options.externalId) {
      body.external_id = options.externalId;
    }
    if (options.webhookUrl) {
      body.webhook_url = options.webhookUrl;
    }
    if (options.async !== undefined) {
      body.async = options.async;
    }

    const res = await fetch(`${TEMPLATED_API_BASE}/render`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Templated Render Error] Status ${res.status}:`, errorText);
      throw new Error(`Templated render failed with status ${res.status}: ${errorText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("[Templated API Error] renderTemplate:", error);
    throw error;
  }
}

/**
 * Renders a fresh, live snapshot preview of a template directly from Templated.io's live canvas.
 */
export async function renderTemplateDefaultPreview(templateId: string): Promise<string | null> {
  const apiKey = process.env.TEMPLATED_API_KEY;
  if (!apiKey || !templateId) return null;

  try {
    const res = await renderTemplate({
      templateId,
      layers: {},
      async: false,
    });
    return res?.render_url || res?.url || res?.download_url || null;
  } catch (err) {
    console.warn(`[renderTemplateDefaultPreview Error for ${templateId}]:`, err);
    return null;
  }
}

export type LayerFieldType = "text" | "image" | "counter" | "badge";

export type SemanticRole =
  | "headline"          // Main hook or title
  | "body"              // Explanatory body or paragraph
  | "subheading"        // Supporting subtitle
  | "key_takeaway"      // Bulleted or bold takeaway
  | "statistic_callout" // Numeric highlight (e.g. "+45% YoY", "$1.2M")
  | "quote_author"      // Attribution or author name
  | "cta_button"        // Call to action button text
  | "hero_image"        // Main background or primary visual
  | "secondary_image"   // Diagram, screenshot, or inline graphic
  | "brand_logo"        // Workspace logo or avatar
  | "slide_counter"     // Page indexation (e.g. "01 / 05")
  | "custom"            // Custom user-defined prompt role
  | "none";             // None / Disabled (layer ignored during workflow)

export interface TemplateFieldConfig {
  id: string;                      // Unique ID for the field mapping
  layerKey: string;                // Templated.io canvas layer key (e.g. "text-1", "image-2")
  type: LayerFieldType;            // Text vs Image vs Counter vs Badge
  role: SemanticRole;              // High-level purpose for the LLM
  label: string;                   // Human readable label shown in UI
  promptInstruction?: string;      // Custom guidance (e.g. "Extract a 2-word statistic")
  characterLimit?: number;         // Safe character limit to prevent canvas clipping
  isRequired?: boolean;            // Whether workflow execution fails if empty
}

export interface DynamicTemplateConfig {
  version: 2;
  isConfigured: boolean;
  configuredAt?: string;
  fields: TemplateFieldConfig[];
}

export const SEMANTIC_ROLE_LABELS: Record<SemanticRole, string> = {
  headline: "Headline Hook",
  body: "Body Content",
  subheading: "Subheading",
  key_takeaway: "Key Takeaway",
  statistic_callout: "Statistic / Metric",
  quote_author: "Quote / Author",
  cta_button: "Call to Action",
  hero_image: "Hero Image",
  secondary_image: "Secondary Image",
  brand_logo: "Brand Logo",
  slide_counter: "Slide Counter",
  custom: "Custom Attribute",
  none: "Unassigned",
};

/**
 * Smart Heuristic Layer Auto-Configurator
 * Evaluates font sizes, bounding box geometry, and layer names to auto-populate fields.
 */
export function autoHeuristicLayerConfig(layers: TemplatedLayer[] = []): DynamicTemplateConfig {
  const fields: TemplateFieldConfig[] = [];
  const assignedRoles = new Set<SemanticRole>();

  const getLayerKey = (l: TemplatedLayer) =>
    (l.layer || l.name || (l as { id?: string }).id || "") as string;

  const textLayers = layers.filter((l) => {
    const type = (l.type || "").toLowerCase();
    return type === "text" || type.includes("text") || l.text !== undefined;
  });

  const imageLayers = layers.filter((l) => {
    const type = (l.type || "").toLowerCase();
    return (
      type === "image" ||
      type === "photo" ||
      type.includes("image") ||
      l.image_url !== undefined
    );
  });

  // 1. Process Text Layers
  // Sort text layers by font size descending to identify headline vs body
  const sortedTextLayers = [...textLayers].sort((a, b) => {
    const sizeA = parseFloat(String(a.font_size || "0").replace(/[^0-9.]/g, "")) || 0;
    const sizeB = parseFloat(String(b.font_size || "0").replace(/[^0-9.]/g, "")) || 0;
    return sizeB - sizeA;
  });

  for (let i = 0; i < sortedTextLayers.length; i++) {
    const l = sortedTextLayers[i];
    const key = getLayerKey(l);
    if (!key) continue;

    const lower = key.toLowerCase();
    let role: SemanticRole = "none";
    let isRequired = false;
    let charLimit: number | undefined = undefined;
    let promptInstruction: string | undefined = undefined;

    if (
      (lower.includes("count") || lower.includes("page") || lower.includes("num") || lower.includes("slide")) &&
      !assignedRoles.has("slide_counter")
    ) {
      role = "slide_counter";
      assignedRoles.add(role);
      charLimit = 10;
    } else if (
      (lower.includes("head") || lower.includes("title") || lower.includes("hook") || lower.includes("header")) &&
      !assignedRoles.has("headline")
    ) {
      role = "headline";
      assignedRoles.add(role);
      isRequired = true;
      charLimit = 80;
      promptInstruction = "High-impact opening headline or slide hook";
    } else if (
      (lower.includes("stat") || lower.includes("metric") || lower.includes("number") || lower.includes("percent")) &&
      !assignedRoles.has("statistic_callout")
    ) {
      role = "statistic_callout";
      assignedRoles.add(role);
      charLimit = 20;
      promptInstruction = "Extracted 2-4 word numeric metric or stat";
    } else if (
      (lower.includes("quote") || lower.includes("author") || lower.includes("byline")) &&
      !assignedRoles.has("quote_author")
    ) {
      role = "quote_author";
      assignedRoles.add(role);
      charLimit = 40;
    } else if (
      (lower.includes("body") || lower.includes("desc") || lower.includes("content") || lower.includes("text")) &&
      !assignedRoles.has("body")
    ) {
      role = "body";
      assignedRoles.add(role);
      isRequired = true;
      charLimit = 180;
      promptInstruction = "Concise explanatory paragraph or core takeaway";
    } else if (
      (lower.includes("sub") || lower.includes("subtitle")) &&
      !assignedRoles.has("subheading")
    ) {
      role = "subheading";
      assignedRoles.add(role);
      charLimit = 100;
    } else if (!assignedRoles.has("headline")) {
      // Largest font text defaults to headline
      role = "headline";
      assignedRoles.add(role);
      isRequired = true;
      charLimit = 80;
    } else if (!assignedRoles.has("body")) {
      // Second text layer defaults to body
      role = "body";
      assignedRoles.add(role);
      isRequired = true;
      charLimit = 180;
    } else if (!assignedRoles.has("subheading")) {
      role = "subheading";
      assignedRoles.add(role);
      charLimit = 100;
    } else {
      role = "key_takeaway";
      charLimit = 120;
    }

    const isCounter = role === "slide_counter";
    fields.push({
      id: `field-${key}-${Math.random().toString(36).slice(2, 7)}-t${i}`,
      layerKey: key,
      type: isCounter ? "counter" : "text",
      role,
      label: SEMANTIC_ROLE_LABELS[role] || key,
      promptInstruction,
      characterLimit: charLimit,
      isRequired,
    });
  }

  // 2. Process Image Layers
  // Sort image layers by area (width * height) descending
  const sortedImageLayers = [...imageLayers].sort((a, b) => {
    const areaA = (Number(a.width) || 100) * (Number(a.height) || 100);
    const areaB = (Number(b.width) || 100) * (Number(b.height) || 100);
    return areaB - areaA;
  });

  for (let i = 0; i < sortedImageLayers.length; i++) {
    const l = sortedImageLayers[i];
    const key = getLayerKey(l);
    if (!key) continue;

    const lower = key.toLowerCase();
    let role: SemanticRole = "none";
    let promptInstruction: string | undefined = undefined;

    if (
      (lower.includes("logo") || lower.includes("brand") || lower.includes("avatar") || lower.includes("icon")) &&
      !assignedRoles.has("brand_logo")
    ) {
      role = "brand_logo";
      assignedRoles.add(role);
    } else if (
      (lower.includes("bg") || lower.includes("back") || lower.includes("hero") || lower.includes("photo") || lower.includes("main")) &&
      !assignedRoles.has("hero_image")
    ) {
      role = "hero_image";
      assignedRoles.add(role);
      promptInstruction = "High quality contextual visual or hero background photo";
    } else if (!assignedRoles.has("hero_image")) {
      role = "hero_image";
      assignedRoles.add(role);
      promptInstruction = "Contextual stock photo or featured article image";
    } else {
      role = "secondary_image";
      promptInstruction = "Supporting diagram, visual, or inline graphic";
    }

    fields.push({
      id: `field-${key}-${Math.random().toString(36).slice(2, 7)}-img${i}`,
      layerKey: key,
      type: "image",
      role,
      label: SEMANTIC_ROLE_LABELS[role] || key,
      promptInstruction,
      isRequired: false,
    });
  }

  return {
    version: 2,
    isConfigured: fields.some((f) => f.role !== "none"),
    configuredAt: new Date().toISOString(),
    fields,
  };
}

/**
 * Normalizes legacy Record<string, string> or raw JSON into a typed DynamicTemplateConfig (v2).
 */
export function normalizeTemplateConfig(
  raw: unknown,
  canvasLayers: TemplatedLayer[] = []
): DynamicTemplateConfig {
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = {};
    }
  }

  // If already a version 2 DynamicTemplateConfig
  if (
    raw &&
    typeof raw === "object" &&
    "version" in raw &&
    (raw as { version: unknown }).version === 2 &&
    "fields" in raw &&
    Array.isArray((raw as { fields: unknown }).fields)
  ) {
    const typed = raw as unknown as DynamicTemplateConfig;
    const activeCount = typed.fields.filter((f) => f.role !== "none" && f.layerKey).length;
    return {
      version: 2,
      isConfigured: typed.isConfigured && activeCount > 0,
      configuredAt: typed.configuredAt || (typed.isConfigured ? new Date().toISOString() : undefined),
      fields: typed.fields.map((f) => ({
        ...f,
        label: f.label || SEMANTIC_ROLE_LABELS[f.role] || f.layerKey,
      })),
    };
  }

  // If legacy layerMappings object: { headline_layer, body_layer, background_layer, logo_layer, counter_layer }
  const legacy = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, string>;
  const fields: TemplateFieldConfig[] = [];

  if (legacy.headline_layer) {
    fields.push({
      id: "legacy-field-headline",
      layerKey: legacy.headline_layer,
      type: "text",
      role: "headline",
      label: "Headline / Slide Hook",
      promptInstruction: "High-impact opening headline or hook",
      characterLimit: 80,
      isRequired: true,
    });
  }
  if (legacy.body_layer) {
    fields.push({
      id: "legacy-field-body",
      layerKey: legacy.body_layer,
      type: "text",
      role: "body",
      label: "Body Copy / Takeaway",
      promptInstruction: "Concise explanatory paragraph or core takeaway",
      characterLimit: 180,
      isRequired: true,
    });
  }
  if (legacy.background_layer) {
    fields.push({
      id: "legacy-field-bg",
      layerKey: legacy.background_layer,
      type: "image",
      role: "hero_image",
      label: "Hero Background Visual",
      promptInstruction: "Contextual stock photo or featured article visual",
      isRequired: false,
    });
  }
  if (legacy.logo_layer) {
    fields.push({
      id: "legacy-field-logo",
      layerKey: legacy.logo_layer,
      type: "image",
      role: "brand_logo",
      label: "Brand Logo / Avatar",
      isRequired: false,
    });
  }
  if (legacy.counter_layer) {
    fields.push({
      id: "legacy-field-counter",
      layerKey: legacy.counter_layer,
      type: "counter",
      role: "slide_counter",
      label: "Slide Counter Index",
      characterLimit: 10,
      isRequired: false,
    });
  }

  // If no fields found and canvasLayers are present, auto-configure
  if (fields.length === 0 && canvasLayers.length > 0) {
    return autoHeuristicLayerConfig(canvasLayers);
  }

  const isConfigured = fields.some((f) => f.role !== "none");
  return {
    version: 2,
    isConfigured,
    configuredAt: isConfigured ? new Date().toISOString() : undefined,
    fields,
  };
}

/**
 * Converts DynamicTemplateConfig back to legacy layerMappings for backward compatibility.
 */
export function dynamicConfigToLegacyMappings(
  config?: DynamicTemplateConfig | Record<string, string> | null
): {
  headline_layer: string;
  body_layer: string;
  background_layer: string;
  logo_layer: string;
  counter_layer: string;
} {
  const result = {
    headline_layer: "",
    body_layer: "",
    background_layer: "",
    logo_layer: "",
    counter_layer: "",
  };

  if (!config) return result;

  // Handle version 2 dynamic config
  if ("version" in config && config.version === 2 && Array.isArray(config.fields)) {
    for (const f of config.fields) {
      if (f.role === "none" || !f.layerKey) continue;
      if (f.role === "headline" && !result.headline_layer) result.headline_layer = f.layerKey;
      else if (f.role === "body" && !result.body_layer) result.body_layer = f.layerKey;
      else if (f.role === "hero_image" && !result.background_layer) result.background_layer = f.layerKey;
      else if (f.role === "brand_logo" && !result.logo_layer) result.logo_layer = f.layerKey;
      else if (f.role === "slide_counter" && !result.counter_layer) result.counter_layer = f.layerKey;
    }
    return result;
  }

  // Handle legacy object
  const legacy = config as Record<string, string>;
  return {
    headline_layer: legacy.headline_layer || legacy.title || "",
    body_layer: legacy.body_layer || legacy.body || "",
    background_layer: legacy.background_layer || legacy.background || "",
    logo_layer: legacy.logo_layer || legacy.logo || "",
    counter_layer: legacy.counter_layer || legacy.counter || "",
  };
}

/**
 * Helper to extract standard layer mappings from Templated layer list (Legacy compatibility).
 */
export function extractLayerMappings(layers: TemplatedLayer[] = []): {
  headline_layer: string;
  body_layer: string;
  background_layer: string;
  logo_layer: string;
  counter_layer: string;
} {
  const auto = autoHeuristicLayerConfig(layers);
  return dynamicConfigToLegacyMappings(auto);
}

/**
 * Three-Pillar Validation Rule:
 * A template is marked Configured (Green) if and only if:
 * 1. Explicit Review: isConfigured === true (saved explicitly or starter template default)
 * 2. Active Content Layer: At least 1 active content field (text or image) is mapped (role !== "none" and non-empty layerKey)
 * 3. Canvas Layer Integrity: If canvas layers are provided, active layer keys exist in canvas
 */
export function isTemplateConfigured(
  templateOrConfig?: {
    isConfigured?: boolean;
    dynamicConfig?: DynamicTemplateConfig | Record<string, unknown> | null;
    layerMappings?: DynamicTemplateConfig | Record<string, unknown> | null;
    fields?: TemplateFieldConfig[];
    version?: number;
    templatedTemplateId?: string;
    id?: string;
  } | null,
  canvasLayers?: TemplatedLayer[]
): boolean {
  if (!templateOrConfig || typeof templateOrConfig !== "object") return false;

  const obj = templateOrConfig as Record<string, unknown>;

  // Case 1: Direct DynamicTemplateConfig object (has fields array)
  if (Array.isArray(obj.fields)) {
    const activeFields = (obj.fields as TemplateFieldConfig[]).filter(
      (f) => f && f.role && f.role !== "none" && typeof f.layerKey === "string" && f.layerKey.trim().length > 0
    );
    if (activeFields.length === 0) return false;
    if (obj.isConfigured === false) return false;
    return true;
  }

  // Case 2: Template object containing dynamicConfig or layerMappings
  const rawMappings = obj.dynamicConfig || obj.layerMappings;
  if (!rawMappings) {
    return Boolean(obj.isConfigured);
  }

  const normalized = normalizeTemplateConfig(rawMappings, canvasLayers);

  // Pillar 1: Explicit review / saved state
  if (obj.isConfigured === false) {
    return false;
  }
  if (normalized.isConfigured === false) {
    return false;
  }

  // Pillar 2: Active Content Layer (at least 1 text, image, or counter layer that is not "none")
  const activeFields = normalized.fields.filter(
    (f) => f.role !== "none" && f.layerKey && f.layerKey.trim().length > 0
  );
  if (activeFields.length === 0) {
    return false;
  }

  // Pillar 3: Canvas Layer Integrity (optional if canvasLayers provided)
  if (canvasLayers && canvasLayers.length > 0) {
    const validCanvasKeys = new Set(
      canvasLayers.map((l) => (l.layer || l.name || (l as { id?: string }).id || "").toString())
    );
    const hasValidKey = activeFields.some((f) => validCanvasKeys.has(f.layerKey));
    if (!hasValidKey) {
      return false;
    }
  }

  return true;
}


