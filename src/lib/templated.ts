/**
 * Templated.io Server-Side API Client & Utilities
 * Manages template synchronization and render requests for multi-tenant workspaces.
 */

export interface TemplatedLayer {
  name: string;
  type: string;
  text?: string;
  image_url?: string;
  color?: string;
  [key: string]: unknown;
}

export interface TemplatedTemplateResponse {
  id: string;
  name: string;
  width: number;
  height: number;
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
  status: "pending" | "processing" | "completed" | "failed";
  render_url?: string;
  download_url?: string;
  thumbnail_url?: string;
  error?: string;
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
    return Array.isArray(data) ? data : data.templates || [];
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
    const res = await fetch(`${TEMPLATED_API_BASE}/templates/${templateId}`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[Templated API] getTemplate returned status ${res.status}`);
      return null;
    }

    return await res.json();
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
 * Helper to extract standard layer mappings from Templated layer list.
 */
export function extractLayerMappings(layers: TemplatedLayer[] = []): {
  headline_layer: string;
  body_layer: string;
  background_layer: string;
  logo_layer: string;
  counter_layer: string;
} {
  const mappings = {
    headline_layer: "headline_text",
    body_layer: "body_text",
    background_layer: "background_image",
    logo_layer: "brand_logo",
    counter_layer: "slide_counter",
  };

  for (const l of layers) {
    const name = (l.name || "").toLowerCase();
    if (name.includes("head") || name.includes("title") || name.includes("header")) {
      mappings.headline_layer = l.name;
    } else if (name.includes("body") || name.includes("text") || name.includes("content") || name.includes("quote")) {
      mappings.body_layer = l.name;
    } else if (name.includes("bg") || name.includes("background") || name.includes("photo") || name.includes("image")) {
      mappings.background_layer = l.name;
    } else if (name.includes("logo") || name.includes("brand") || name.includes("avatar") || name.includes("icon")) {
      mappings.logo_layer = l.name;
    } else if (name.includes("count") || name.includes("page") || name.includes("number") || name.includes("slide")) {
      mappings.counter_layer = l.name;
    }
  }

  return mappings;
}
