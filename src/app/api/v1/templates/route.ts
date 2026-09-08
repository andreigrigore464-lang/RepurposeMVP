import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

// Default starter templates if user starts fresh
const STARTER_TEMPLATES = [
  {
    name: "Modern Carousel Hook (1:1)",
    templatedTemplateId: "tmpl_hook_square_01",
    previewImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    aspectRatio: "1:1",
    hasBackgroundPlaceholder: true,
    layerMappings: {
      headline_layer: "headline_text",
      body_layer: "body_text",
      background_layer: "background_image",
      logo_layer: "brand_logo",
      counter_layer: "slide_counter",
    },
  },
  {
    name: "LinkedIn Deep-Dive Slide (4:5)",
    templatedTemplateId: "tmpl_content_portrait_02",
    previewImageUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop",
    aspectRatio: "4:5",
    hasBackgroundPlaceholder: true,
    layerMappings: {
      headline_layer: "headline_text",
      body_layer: "body_text",
      background_layer: "background_image",
      logo_layer: "brand_logo",
      counter_layer: "slide_counter",
    },
  },
  {
    name: "Viral Social Card / Quote (16:9)",
    templatedTemplateId: "tmpl_quote_landscape_03",
    previewImageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop",
    aspectRatio: "16:9",
    hasBackgroundPlaceholder: false,
    layerMappings: {
      headline_layer: "headline_text",
      body_layer: "body_text",
      background_layer: "background_image",
      logo_layer: "brand_logo",
      counter_layer: "slide_counter",
    },
  },
];

// GET /api/v1/templates
export async function GET() {
  try {
    const workspace = await getOrCreateDefaultWorkspace();

    let templates = await prisma.brandTemplate.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });

    // Auto-seed starter templates if empty
    if (templates.length === 0) {
      const defaultKit = await prisma.brandKit.findFirst({
        where: { workspaceId: workspace.id },
      });

      for (const starter of STARTER_TEMPLATES) {
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
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
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
          previewImageUrl: previewImageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
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
        previewImageUrl: previewImageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
        aspectRatio,
        hasBackgroundPlaceholder,
        layerMappings,
      },
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
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

    await prisma.brandTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Template deleted" });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
