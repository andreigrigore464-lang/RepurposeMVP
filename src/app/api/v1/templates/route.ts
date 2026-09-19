import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentWorkspace, fallbackStore, isDatabaseAvailable } from "@/lib/workspace";
import {
  listTemplatedTemplates,
  normalizeTemplateConfig,
  isTemplateConfigured,
  dynamicConfigToLegacyMappings,
  autoHeuristicLayerConfig,
  renderTemplateDefaultPreview,
  DynamicTemplateConfig,
  MOCK_TEMPLATE_ID,
  isMockTemplate,
} from "@/lib/templated";

// GET /api/v1/templates
// Returns templates for the workspace, syncing and permanently persisting with Templated.io cloud
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedWorkspaceId = searchParams.get("workspaceId");
    const shouldSync = searchParams.get("sync") === "true";

    const userSession = await getCurrentWorkspace();
    const workspaceId = requestedWorkspaceId || userSession.workspace.id;

    const dbOnline = await isDatabaseAvailable();

    // 1. Fetch from Database or Fallback Store
    let rawTemplates: Array<{
      id: string;
      workspaceId: string;
      name: string;
      templatedTemplateId: string;
      previewImageUrl: string;
      aspectRatio: string;
      hasBackgroundPlaceholder: boolean;
      layerMappings: unknown;
      dynamicConfig?: unknown;
      createdAt: string | Date;
      updatedAt?: string | Date;
    }> = [];

    if (dbOnline) {
      try {
        rawTemplates = await prisma.brandTemplate.findMany({
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
        });
      } catch (err) {
        console.warn("[Templates DB Fetch Warning]:", err);
        rawTemplates = fallbackStore.templates.filter(
          (t) => t.workspaceId === workspaceId || !t.workspaceId
        );
      }
    } else {
      rawTemplates = fallbackStore.templates.filter(
        (t) => t.workspaceId === workspaceId || !t.workspaceId
      );
    }

    // Ensure Mock Simulation Template is always available for zero-credit testing
    const hasMock = rawTemplates.some(
      (t) => t.templatedTemplateId === MOCK_TEMPLATE_ID || t.id === MOCK_TEMPLATE_ID
    );
    if (!hasMock) {
      const mockEntry = {
        id: `tmpl-${MOCK_TEMPLATE_ID}`,
        workspaceId,
        name: "Mock Simulation (0 Credits)",
        templatedTemplateId: MOCK_TEMPLATE_ID,
        previewImageUrl: "",
        aspectRatio: "1:1",
        hasBackgroundPlaceholder: true,
        layerMappings: {
          version: 2,
          isConfigured: false,
          fields: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      rawTemplates.unshift(mockEntry);
    }

    // 2. Perform Sync with Templated.io Cloud API if requested OR if workspace has 0 templates
    const shouldPerformCloudSync =
      (shouldSync || rawTemplates.length === 0) && Boolean(process.env.TEMPLATED_API_KEY);

    if (shouldPerformCloudSync) {
      try {
        const cloudTemplates = await listTemplatedTemplates();
        const existingCloudIds = new Set(rawTemplates.map((t) => t.templatedTemplateId));

        // Generate live rendered canvas snapshots in parallel for true pixel-perfect previews
        const liveRenderMap = new Map<string, string>();
        const renderJobs = cloudTemplates.map(async (cloud) => {
          if (!cloud.id) return;
          try {
            const liveUrl = await renderTemplateDefaultPreview(cloud.id);
            if (liveUrl) {
              liveRenderMap.set(cloud.id, liveUrl);
            }
          } catch (e) {
            console.warn(`[Live Render Snapshot Warning for ${cloud.id}]:`, e);
          }
        });
        await Promise.allSettled(renderJobs);

        for (const cloud of cloudTemplates) {
          if (!cloud.id) continue;

          const width = cloud.width || 1080;
          const height = cloud.height || 1080;
          const aspectRatio = width === height ? "1:1" : width > height ? "16:9" : "4:5";
          const autoDynamic = autoHeuristicLayerConfig(cloud.layers || []);
          const previewImageUrl =
            liveRenderMap.get(cloud.id) ||
            cloud.preview_url ||
            `https://templated-assets.s3.amazonaws.com/public/thumbnail/${cloud.id}.webp`;

          if (!existingCloudIds.has(cloud.id)) {
            // Persist new synced template to DB / fallbackStore permanently
            if (dbOnline) {
              try {
                const created = await prisma.brandTemplate.create({
                  data: {
                    workspaceId,
                    name: cloud.name || "Templated Template",
                    templatedTemplateId: cloud.id,
                    previewImageUrl,
                    aspectRatio,
                    hasBackgroundPlaceholder: true,
                    layerMappings: autoDynamic as unknown as object,
                  },
                });
                rawTemplates.unshift(created);
                existingCloudIds.add(cloud.id);
              } catch (dbErr) {
                console.warn("[Templates DB Create Synced Error]:", dbErr);
                const newTmpl = {
                  id: `tmpl-cloud-${cloud.id}`,
                  workspaceId,
                  name: cloud.name || "Templated Template",
                  templatedTemplateId: cloud.id,
                  previewImageUrl,
                  aspectRatio,
                  hasBackgroundPlaceholder: true,
                  layerMappings: autoDynamic as unknown as Record<string, unknown>,
                  dynamicConfig: autoDynamic,
                  createdAt: cloud.created_at || new Date().toISOString(),
                  updatedAt: cloud.updated_at || new Date().toISOString(),
                };
                fallbackStore.templates.unshift(newTmpl);
                rawTemplates.unshift(newTmpl);
                existingCloudIds.add(cloud.id);
              }
            } else {
              const newTmpl = {
                id: `tmpl-cloud-${cloud.id}`,
                workspaceId,
                name: cloud.name || "Templated Template",
                templatedTemplateId: cloud.id,
                previewImageUrl,
                aspectRatio,
                hasBackgroundPlaceholder: true,
                layerMappings: autoDynamic as unknown as Record<string, unknown>,
                dynamicConfig: autoDynamic,
                createdAt: cloud.created_at || new Date().toISOString(),
                updatedAt: cloud.updated_at || new Date().toISOString(),
              };
              const existsInFallback = fallbackStore.templates.some(
                (t) => t.templatedTemplateId === cloud.id
              );
              if (!existsInFallback) {
                fallbackStore.templates.unshift(newTmpl);
              }
              rawTemplates.unshift(newTmpl);
              existingCloudIds.add(cloud.id);
            }
          } else {
            // Update preview image, name, and aspect ratio for existing template
            const existing = rawTemplates.find((t) => t.templatedTemplateId === cloud.id);
            if (existing) {
              existing.previewImageUrl = previewImageUrl;
              existing.aspectRatio = aspectRatio;
              if (cloud.name && (!existing.name || existing.name === "Untitled Template" || existing.name === "Templated Template")) {
                existing.name = cloud.name;
              }
              if (dbOnline) {
                prisma.brandTemplate
                  .update({
                    where: { id: existing.id },
                    data: {
                      previewImageUrl,
                      name: existing.name,
                      aspectRatio,
                    },
                  })
                  .catch(() => {});
              }
              const fallbackIdx = fallbackStore.templates.findIndex((t) => t.templatedTemplateId === cloud.id);
              if (fallbackIdx >= 0) {
                fallbackStore.templates[fallbackIdx].previewImageUrl = previewImageUrl;
                fallbackStore.templates[fallbackIdx].name = existing.name;
                fallbackStore.templates[fallbackIdx].aspectRatio = aspectRatio;
              }
            }
          }
        }
      } catch (err) {
        console.warn("[Templates Cloud Sync Warning]:", err);
      }
    }

    // 3. Format and Normalize response
    const formattedTemplates = rawTemplates.map((t) => {
      const dynamicConfig = normalizeTemplateConfig(
        (t.dynamicConfig || t.layerMappings) as Record<string, unknown>
      );
      const configured = isTemplateConfigured({ layerMappings: dynamicConfig });
      const isMock = isMockTemplate(t.templatedTemplateId) || isMockTemplate(t.id);
      return {
        id: t.id,
        workspaceId: t.workspaceId,
        name: t.name,
        templatedTemplateId: t.templatedTemplateId,
        previewImageUrl: isMock ? "" : t.previewImageUrl,
        aspectRatio: t.aspectRatio || "1:1",
        hasBackgroundPlaceholder: t.hasBackgroundPlaceholder,
        isConfigured: configured,
        isMock,
        layerMappings: dynamicConfig,
        dynamicConfig,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspaceId,
        name: userSession.workspace.name,
      },
      templates: formattedTemplates,
      starterTemplates: [],
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({
      success: true,
      templates: fallbackStore.templates,
      starterTemplates: [],
    });
  }
}

// POST /api/v1/templates (Create / Update / Refresh Preview)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userSession = await getCurrentWorkspace();
    const workspaceId = body.workspaceId || userSession.workspace.id;

    if (body.action === "seed_starters" || body.action === "import_starter") {
      return NextResponse.json({ success: true, imported: [], message: "No starter templates" });
    }

    // Action: Single Template Preview Refresh
    if (body.action === "refresh_preview" && body.templatedTemplateId) {
      if (isMockTemplate(body.templatedTemplateId)) {
        return NextResponse.json({ success: true, previewImageUrl: "" });
      }
      const liveUrl = await renderTemplateDefaultPreview(body.templatedTemplateId);
      if (liveUrl) {
        const dbOnline = await isDatabaseAvailable();
        if (dbOnline) {
          try {
            await prisma.brandTemplate.updateMany({
              where: { templatedTemplateId: body.templatedTemplateId, workspaceId },
              data: { previewImageUrl: liveUrl },
            });
          } catch {}
        }
        const fallbackIdx = fallbackStore.templates.findIndex(
          (t) => t.templatedTemplateId === body.templatedTemplateId
        );
        if (fallbackIdx >= 0) {
          fallbackStore.templates[fallbackIdx].previewImageUrl = liveUrl;
        }
        return NextResponse.json({ success: true, previewImageUrl: liveUrl });
      }
      return NextResponse.json({ success: false, error: "Failed to render preview" }, { status: 500 });
    }

    const {
      id,
      name,
      templatedTemplateId,
      previewImageUrl: incomingPreview,
      aspectRatio = "1:1",
      hasBackgroundPlaceholder = true,
      dynamicConfig: incomingDynamicConfig,
      layerMappings: incomingLayerMappings,
    } = body;

    if (!name || !templatedTemplateId) {
      return NextResponse.json(
        { error: "Name and Templated.io template ID are required" },
        { status: 400 }
      );
    }

    const isMock = isMockTemplate(templatedTemplateId) || isMockTemplate(id);

    // Attempt live render snapshot if previewImageUrl is placeholder or missing
    let previewImageUrl = isMock ? "" : incomingPreview;
    if (!isMock && (!previewImageUrl || previewImageUrl.includes("unsplash.com") || previewImageUrl.includes("s3.amazonaws.com"))) {
      try {
        const liveSnapshot = await renderTemplateDefaultPreview(templatedTemplateId);
        if (liveSnapshot) {
          previewImageUrl = liveSnapshot;
        }
      } catch {}
    }

    if (!isMock && !previewImageUrl) {
      previewImageUrl = `https://templated-assets.s3.amazonaws.com/public/thumbnail/${templatedTemplateId}.webp`;
    }

    // Normalize config to version 2 DynamicTemplateConfig (retaining all arbitrary fields)
    const normalizedConfig = normalizeTemplateConfig(
      incomingDynamicConfig || incomingLayerMappings
    );

    const finalConfig: DynamicTemplateConfig = {
      ...normalizedConfig,
      isConfigured: normalizedConfig.fields.some((f) => f.role !== "none" && f.layerKey),
      configuredAt: new Date().toISOString(),
    };

    const dbOnline = await isDatabaseAvailable();

    if (dbOnline) {
      try {
        if (id) {
          // Update existing
          const template = await prisma.brandTemplate.update({
            where: { id },
            data: {
              name,
              templatedTemplateId,
              previewImageUrl,
              aspectRatio,
              hasBackgroundPlaceholder,
              layerMappings: finalConfig as unknown as object,
            },
          });
          return NextResponse.json({
            success: true,
            template: {
              ...template,
              dynamicConfig: finalConfig,
              layerMappings: finalConfig,
              isConfigured: finalConfig.isConfigured,
            },
          });
        }

        // Create new template
        const template = await prisma.brandTemplate.create({
          data: {
            workspaceId,
            name,
            templatedTemplateId,
            previewImageUrl,
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
              layerMappings: finalConfig,
              isConfigured: finalConfig.isConfigured,
            },
          },
          { status: 201 }
        );
      } catch (err) {
        console.warn("[POST /api/v1/templates DB Error, falling back]:", err);
      }
    }

    // Offline / fallbackStore saving
    if (id || templatedTemplateId) {
      const existingIdx = fallbackStore.templates.findIndex(
        (t) => t.id === id || t.templatedTemplateId === templatedTemplateId
      );
      if (existingIdx >= 0) {
        fallbackStore.templates[existingIdx] = {
          ...fallbackStore.templates[existingIdx],
          name,
          templatedTemplateId,
          previewImageUrl: previewImageUrl || fallbackStore.templates[existingIdx].previewImageUrl,
          aspectRatio,
          hasBackgroundPlaceholder,
          isConfigured: finalConfig.isConfigured,
          layerMappings: finalConfig as unknown as Record<string, unknown>,
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
      id: id || `tmpl-local-${Date.now()}`,
      workspaceId,
      name,
      templatedTemplateId,
      previewImageUrl,
      aspectRatio,
      hasBackgroundPlaceholder,
      isConfigured: finalConfig.isConfigured,
      layerMappings: finalConfig as unknown as Record<string, unknown>,
      dynamicConfig: finalConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fallbackStore.templates.unshift(newTmpl);
    return NextResponse.json({ success: true, template: newTmpl }, { status: 201 });
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

    const dbOnline = await isDatabaseAvailable();
    if (dbOnline) {
      try {
        await prisma.brandTemplate.delete({
          where: { id },
        });
      } catch {
        fallbackStore.templates = fallbackStore.templates.filter((t) => t.id !== id);
      }
    } else {
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
