import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDefaultWorkspace, fallbackStore } from "@/lib/workspace";

// GET /api/v1/templates
export async function GET() {
  try {
    const workspace = await getOrCreateDefaultWorkspace();

    try {
      let templates = await prisma.brandTemplate.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "desc" },
      });

      // Auto-seed starter templates if empty
      if (templates.length === 0) {
        const defaultKit = await prisma.brandKit.findFirst({
          where: { workspaceId: workspace.id },
        });

        for (const starter of fallbackStore.templates) {
          await prisma.brandTemplate.create({
            data: {
              workspaceId: workspace.id,
              brandKitId: defaultKit?.id,
              name: starter.name,
              templatedTemplateId: starter.templatedTemplateId,
              previewImageUrl: starter.previewImageUrl,
              aspectRatio: starter.aspectRatio,
              hasBackgroundPlaceholder: starter.hasBackgroundPlaceholder,
              layerMappings: starter.layerMappings,
            },
          });
        }

        templates = await prisma.brandTemplate.findMany({
          where: { workspaceId: workspace.id },
          orderBy: { createdAt: "desc" },
        });
      }

      return NextResponse.json({ success: true, templates });
    } catch {
      // Database offline fallback
      return NextResponse.json({ success: true, templates: fallbackStore.templates });
    }
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ success: true, templates: fallbackStore.templates });
  }
}

// POST /api/v1/templates (Callback / Create)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workspace = await getOrCreateDefaultWorkspace();

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
          where: { workspaceId: workspace.id },
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
          workspaceId: workspace.id,
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
        workspaceId: workspace.id,
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
