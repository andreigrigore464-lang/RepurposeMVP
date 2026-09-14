import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDefaultWorkspace, fallbackStore, STARTER_TEMPLATES, isDatabaseAvailable } from "@/lib/workspace";
import { listTemplatedTemplates, extractLayerMappings } from "@/lib/templated";

// GET /api/v1/templates
// Returns templates for the workspace, optionally syncing with Templated.io cloud
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedWorkspaceId = searchParams.get("workspaceId");
    const shouldSync = searchParams.get("sync") === "true";

    const defaultWorkspace = await getOrCreateDefaultWorkspace();
    const workspaceId = requestedWorkspaceId || defaultWorkspace.id;

    let templates: Array<{
      id: string;
      workspaceId: string;
      brandKitId?: string | null;
      name: string;
      templatedTemplateId: string;
      previewImageUrl: string;
      aspectRatio: string;
      hasBackgroundPlaceholder: boolean;
      layerMappings: Record<string, string>;
      createdAt: string | Date;
      updatedAt?: string | Date;
    }> = [];

    // 1. Fetch from Database / Fallback Store
    const dbOnline = await isDatabaseAvailable();
    if (!dbOnline) {
      templates = fallbackStore.templates.filter((t) => t.workspaceId === workspaceId || !t.workspaceId);
    } else {
      try {
        const dbTemplates = await prisma.brandTemplate.findMany({
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
        });
        templates = dbTemplates.map((t) => ({
          ...t,
          layerMappings: typeof t.layerMappings === "object" && t.layerMappings !== null
            ? (t.layerMappings as Record<string, string>)
            : {},
        }));
      } catch {
        templates = fallbackStore.templates.filter((t) => t.workspaceId === workspaceId);
      }
    }

    // 2. Optionally sync with Templated.io cloud for this workspace external_id
    if (shouldSync && process.env.TEMPLATED_API_KEY) {
      try {
        const cloudTemplates = await listTemplatedTemplates(workspaceId);
        for (const cloudTmpl of cloudTemplates) {
          const exists = templates.some((t) => t.templatedTemplateId === cloudTmpl.id);
          if (!exists) {
            const width = cloudTmpl.width || 1080;
            const height = cloudTmpl.height || 1080;
            const aspectRatio = width === height ? "1:1" : width > height ? "16:9" : "4:5";
            const layerMappings = extractLayerMappings(cloudTmpl.layers || []);
            const previewImageUrl =
              cloudTmpl.preview_url ||
              cloudTmpl.thumbnail_url ||
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";

            try {
              const created = await prisma.brandTemplate.create({
                data: {
                  workspaceId,
                  name: cloudTmpl.name || "Templated Cloud Template",
                  templatedTemplateId: cloudTmpl.id,
                  previewImageUrl,
                  aspectRatio,
                  hasBackgroundPlaceholder: true,
                  layerMappings,
                },
              });
              templates.unshift({
                ...created,
                layerMappings: created.layerMappings as Record<string, string>,
              });
            } catch {
              const memoryTmpl = {
                id: `tmpl-cloud-${Date.now()}-${cloudTmpl.id}`,
                workspaceId,
                name: cloudTmpl.name || "Templated Cloud Template",
                templatedTemplateId: cloudTmpl.id,
                previewImageUrl,
                aspectRatio,
                hasBackgroundPlaceholder: true,
                layerMappings,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              fallbackStore.templates.unshift(memoryTmpl);
              templates.unshift(memoryTmpl);
            }
          }
        }
      } catch (err) {
        console.warn("[Templates Sync Warning]:", err);
      }
    }

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspaceId,
        name: defaultWorkspace.name,
      },
      templates,
      starterTemplates: STARTER_TEMPLATES,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({
      success: true,
      templates: fallbackStore.templates,
      starterTemplates: STARTER_TEMPLATES,
    });
  }
}

// POST /api/v1/templates (Create / Update / Seed Starter)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const defaultWorkspace = await getOrCreateDefaultWorkspace();
    const workspaceId = body.workspaceId || defaultWorkspace.id;

    // Action: Seed/Import Starter Template into User Workspace
    if (body.action === "seed_starters" || body.action === "import_starter") {
      const targetStarterId = body.starterId;
      const startersToImport = targetStarterId
        ? STARTER_TEMPLATES.filter((s) => s.id === targetStarterId || s.templatedTemplateId === targetStarterId)
        : STARTER_TEMPLATES;

      const imported = [];
      for (const starter of startersToImport) {
        try {
          const created = await prisma.brandTemplate.create({
            data: {
              workspaceId,
              name: starter.name,
              templatedTemplateId: starter.templatedTemplateId,
              previewImageUrl: starter.previewImageUrl,
              aspectRatio: starter.aspectRatio,
              hasBackgroundPlaceholder: starter.hasBackgroundPlaceholder,
              layerMappings: starter.layerMappings,
            },
          });
          imported.push(created);
        } catch {
          const memoryTmpl = {
            id: `tmpl-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            workspaceId,
            name: starter.name,
            templatedTemplateId: starter.templatedTemplateId,
            previewImageUrl: starter.previewImageUrl,
            aspectRatio: starter.aspectRatio,
            hasBackgroundPlaceholder: starter.hasBackgroundPlaceholder,
            layerMappings: starter.layerMappings,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          fallbackStore.templates.unshift(memoryTmpl);
          imported.push(memoryTmpl);
        }
      }

      return NextResponse.json({ success: true, imported, message: "Starter templates imported successfully" });
    }

    const {
      id,
      name,
      templatedTemplateId,
      previewImageUrl,
      aspectRatio = "1:1",
      hasBackgroundPlaceholder = true,
      layerMappings = {
        headline_layer: "headline_text",
        body_layer: "body_text",
        background_layer: "background_image",
        logo_layer: "brand_logo",
        counter_layer: "slide_counter",
      },
      brandKitId,
    } = body;

    if (!name || !templatedTemplateId) {
      return NextResponse.json(
        { error: "Name and Templated.io template ID are required" },
        { status: 400 }
      );
    }

    try {
      let defaultKitId = brandKitId;
      if (!defaultKitId) {
        const kit = await prisma.brandKit.findFirst({
          where: { workspaceId },
        });
        defaultKitId = kit?.id;
      }

      if (id) {
        // Update existing
        const template = await prisma.brandTemplate.update({
          where: { id },
          data: {
            name,
            templatedTemplateId,
            previewImageUrl:
              previewImageUrl ||
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
            aspectRatio,
            hasBackgroundPlaceholder,
            layerMappings,
            brandKitId: defaultKitId,
          },
        });
        return NextResponse.json({ success: true, template });
      }

      // Create new template
      const template = await prisma.brandTemplate.create({
        data: {
          workspaceId,
          brandKitId: defaultKitId,
          name,
          templatedTemplateId,
          previewImageUrl:
            previewImageUrl ||
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
          aspectRatio,
          hasBackgroundPlaceholder,
          layerMappings,
        },
      });

      return NextResponse.json({ success: true, template }, { status: 201 });
    } catch {
      // Offline fallback
      if (id) {
        const existingIdx = fallbackStore.templates.findIndex((t) => t.id === id);
        if (existingIdx >= 0) {
          fallbackStore.templates[existingIdx] = {
            ...fallbackStore.templates[existingIdx],
            name,
            templatedTemplateId,
            previewImageUrl: previewImageUrl || fallbackStore.templates[existingIdx].previewImageUrl,
            aspectRatio,
            hasBackgroundPlaceholder,
            layerMappings,
            updatedAt: new Date().toISOString(),
          };
          return NextResponse.json({ success: true, template: fallbackStore.templates[existingIdx] });
        }
      }

      const newTmpl = {
        id: `tmpl-local-${Date.now()}`,
        workspaceId,
        name,
        templatedTemplateId,
        previewImageUrl:
          previewImageUrl ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
        aspectRatio,
        hasBackgroundPlaceholder,
        layerMappings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      fallbackStore.templates.unshift(newTmpl);
      return NextResponse.json({ success: true, template: newTmpl }, { status: 201 });
    }
  } catch (error) {
    console.error("Error saving template:", error);
    return NextResponse.json(
      { error: "Failed to save template" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/templates
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    try {
      await prisma.brandTemplate.delete({
        where: { id },
      });
    } catch {
      fallbackStore.templates = fallbackStore.templates.filter((t) => t.id !== id);
    }

    return NextResponse.json({ success: true, message: "Template deleted" });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
