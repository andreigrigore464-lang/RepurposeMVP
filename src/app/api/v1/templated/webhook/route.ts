import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDefaultWorkspace, fallbackStore } from "@/lib/workspace";
import { extractLayerMappings } from "@/lib/templated";

// POST /api/v1/templated/webhook
// Receives webhook payloads from Templated.io embedded editor actions
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = body.event || body.type || "template.saved";
    const payload = body.template || body.render || body.data || body;

    console.log(`[Templated Webhook] Received event: ${event}`, payload);

    if (event === "template.saved" || event === "template_saved" || event === "templated:save") {
      const defaultWorkspace = await getOrCreateDefaultWorkspace();
      // Extract tenant external_id if present
      const workspaceId = payload.external_id || payload.metadata?.external_id || defaultWorkspace.id;
      const tmplId = payload.id || payload.template_id || `tmpl_${Date.now()}`;
      const name = payload.name || payload.title || "Webhook Saved Template";
      const previewImageUrl =
        payload.preview_url ||
        payload.thumbnail_url ||
        payload.render_url ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";

      const width = payload.width || 1080;
      const height = payload.height || 1080;
      const aspectRatio = width === height ? "1:1" : width > height ? "16:9" : "4:5";

      // Extract layer names using helper
      const layerMappings = extractLayerMappings(payload.layers || []);

      try {
        const existing = await prisma.brandTemplate.findFirst({
          where: { templatedTemplateId: tmplId },
        });

        if (existing) {
          await prisma.brandTemplate.update({
            where: { id: existing.id },
            data: {
              name,
              previewImageUrl,
              aspectRatio,
              layerMappings,
            },
          });
        } else {
          await prisma.brandTemplate.create({
            data: {
              workspaceId,
              name,
              templatedTemplateId: tmplId,
              previewImageUrl,
              aspectRatio,
              hasBackgroundPlaceholder: true,
              layerMappings,
            },
          });
        }
      } catch {
        // In-memory fallback
        const existingIdx = fallbackStore.templates.findIndex((t) => t.templatedTemplateId === tmplId);
        if (existingIdx >= 0) {
          fallbackStore.templates[existingIdx] = {
            ...fallbackStore.templates[existingIdx],
            name,
            previewImageUrl,
            aspectRatio,
            layerMappings,
            updatedAt: new Date().toISOString(),
          };
        } else {
          fallbackStore.templates.unshift({
            id: `tmpl-webhook-${Date.now()}`,
            workspaceId,
            name,
            templatedTemplateId: tmplId,
            previewImageUrl,
            aspectRatio,
            hasBackgroundPlaceholder: true,
            layerMappings,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("[Templated Webhook Error]:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
