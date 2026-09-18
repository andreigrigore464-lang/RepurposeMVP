import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDefaultWorkspace, fallbackStore, STARTER_TEMPLATES, isDatabaseAvailable } from "@/lib/workspace";
import {
  listTemplatedTemplates,
  normalizeTemplateConfig,
  isTemplateConfigured,
  dynamicConfigToLegacyMappings,
  autoHeuristicLayerConfig,
  DynamicTemplateConfig,
} from "@/lib/templated";

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
      isConfigured: boolean;
      layerMappings: Record<string, string>;
      dynamicConfig: DynamicTemplateConfig;
      createdAt: string | Date;
      updatedAt?: string | Date;
    }> = [];

    // 1. Fetch from Database / Fallback Store
    const dbOnline = await isDatabaseAvailable();
    if (!dbOnline) {
      templates = fallbackStore.templates
        .filter((t) => t.workspaceId === workspaceId || !t.workspaceId)
        .map((t) => {
          const dynamicConfig = normalizeTemplateConfig(t.dynamicConfig || t.layerMappings);
          const configured = isTemplateConfigured({ isConfigured: t.isConfigured, layerMappings: dynamicConfig });
          return {
            ...t,
            isConfigured: configured,
            dynamicConfig,
            layerMappings: dynamicConfigToLegacyMappings(dynamicConfig),
          };
        });
    } else {
      try {
        const dbTemplates = await prisma.brandTemplate.findMany({
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
        });
        templates = dbTemplates.map((t) => {
          const dynamicConfig = normalizeTemplateConfig(t.layerMappings);
          const configured = isTemplateConfigured(dynamicConfig);
          return {
            ...t,
            isConfigured: configured,
            dynamicConfig,
            layerMappings: dynamicConfigToLegacyMappings(dynamicConfig),
          };
        });
      } catch {
        templates = fallbackStore.templates
          .filter((t) => t.workspaceId === workspaceId)
          .map((t) => {
            const dynamicConfig = normalizeTemplateConfig(t.dynamicConfig || t.layerMappings);
            const configured = isTemplateConfigured(dynamicConfig);
            return {
              ...t,
              isConfigured: configured,
              dynamicConfig,
              layerMappings: dynamicConfigToLegacyMappings(dynamicConfig),
            };
          });
      }
    }

    // 2. Fetch live templates from Templated.io cloud & sync thumbnail previews
    if (process.env.TEMPLATED_API_KEY) {
      try {
        const cloudTemplates = await listTemplatedTemplates();
        const cloudMap = new Map(cloudTemplates.map((c) => [c.id, c]));

        // Update preview images of existing templates
        for (const t of templates) {
          const cloud = cloudMap.get(t.templatedTemplateId);
          if (cloud) {
            if (cloud.preview_url) {
              t.previewImageUrl = cloud.preview_url;
            }
            if (cloud.name && (!t.name || t.name === "Untitled Template" || t.name.startsWith("Templated "))) {
              t.name = cloud.name;
            }
          } else if (t.templatedTemplateId && t.templatedTemplateId.includes("-")) {
            t.previewImageUrl = `https://templated-assets.s3.amazonaws.com/public/thumbnail/${t.templatedTemplateId}.webp`;
          }
        }

        // Add any cloud templates not yet in workspace
        for (const cloud of cloudTemplates) {
          const exists = templates.some((t) => t.templatedTemplateId === cloud.id);
          if (!exists) {
            const width = cloud.width || 1080;
            const height = cloud.height || 1080;
            const aspectRatio = width === height ? "1:1" : width > height ? "16:9" : "4:5";
            const autoDynamic = autoHeuristicLayerConfig(cloud.layers || []);
            const previewImageUrl =
              cloud.preview_url ||
              `https://templated-assets.s3.amazonaws.com/public/thumbnail/${cloud.id}.webp`;

            const newTmpl = {
              id: `tmpl-cloud-${cloud.id}`,
              workspaceId,
              name: cloud.name || "Templated Template",
              templatedTemplateId: cloud.id,
              previewImageUrl,
              aspectRatio,
              hasBackgroundPlaceholder: true,
              isConfigured: false, // Cloud discovered templates start unconfigured until reviewed
              dynamicConfig: {
                ...autoDynamic,
                isConfigured: false,
              },
              layerMappings: dynamicConfigToLegacyMappings(autoDynamic),
              createdAt: cloud.created_at || new Date().toISOString(),
              updatedAt: cloud.updated_at || new Date().toISOString(),
            };
            templates.unshift(newTmpl);
          }
        }
      } catch (err) {
        console.warn("[Templates Cloud Sync Warning]:", err);
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
        const dynamicConfig = starter.dynamicConfig || normalizeTemplateConfig(starter.layerMappings);
        try {
          const created = await prisma.brandTemplate.create({
            data: {
              workspaceId,
              name: starter.name,
              templatedTemplateId: starter.templatedTemplateId,
              previewImageUrl: starter.previewImageUrl,
              aspectRatio: starter.aspectRatio,
              hasBackgroundPlaceholder: starter.hasBackgroundPlaceholder,
              layerMappings: dynamicConfig as unknown as object,
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
            isConfigured: true,
            layerMappings: starter.layerMappings,
            dynamicConfig,
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
      dynamicConfig: incomingDynamicConfig,
      layerMappings: incomingLayerMappings,
      brandKitId,
    } = body;

    if (!name || !templatedTemplateId) {
      return NextResponse.json(
        { error: "Name and Templated.io template ID are required" },
        { status: 400 }
      );
    }

    // Normalize config to version 2 DynamicTemplateConfig
    const normalizedConfig = normalizeTemplateConfig(
      incomingDynamicConfig || incomingLayerMappings
    );

    // Save with explicit isConfigured flag
    const finalConfig: DynamicTemplateConfig = {
      ...normalizedConfig,
      isConfigured: normalizedConfig.fields.some((f) => f.role !== "none" && f.layerKey),
      configuredAt: new Date().toISOString(),
    };

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
            layerMappings: finalConfig as unknown as object,
            brandKitId: defaultKitId,
          },
        });
        return NextResponse.json({
          success: true,
          template: {
            ...template,
            dynamicConfig: finalConfig,
            layerMappings: dynamicConfigToLegacyMappings(finalConfig),
            isConfigured: finalConfig.isConfigured,
          },
        });
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
          layerMappings: finalConfig as unknown as object,
        },
      });

      return NextResponse.json(
        {
          success: true,
          template: {
            ...template,
            dynamicConfig: finalConfig,
            layerMappings: dynamicConfigToLegacyMappings(finalConfig),
            isConfigured: finalConfig.isConfigured,
          },
        },
        { status: 201 }
      );
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
            isConfigured: finalConfig.isConfigured,
            layerMappings: dynamicConfigToLegacyMappings(finalConfig),
            dynamicConfig: finalConfig,
            updatedAt: new Date().toISOString(),
          };
          return NextResponse.json({
            success: true,
            template: fallbackStore.templates[existingIdx],
          });
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
        isConfigured: finalConfig.isConfigured,
        layerMappings: dynamicConfigToLegacyMappings(finalConfig),
        dynamicConfig: finalConfig,
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
