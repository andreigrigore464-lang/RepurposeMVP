import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

// GET /api/v1/brand-kits
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const workspace = await getOrCreateDefaultWorkspace();

    if (id) {
      const brandKit = await prisma.brandKit.findFirst({
        where: { id, workspaceId: workspace.id },
      });
      if (!brandKit) {
        return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, brandKit });
    }

    // Return the primary/default brand kit for this workspace
    let brandKit = await prisma.brandKit.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "asc" },
    });

    if (!brandKit) {
      brandKit = await prisma.brandKit.create({
        data: {
          workspaceId: workspace.id,
          name: "Default Brand Kit",
          primaryColor: "#0F172A",
          secondaryColor: "#F8FAFC",
          accentColor: "#10B981",
          fontFamily: "Inter",
        },
      });
    }

    return NextResponse.json({ success: true, brandKit });
  } catch (error) {
    console.error("Error fetching brand kit:", error);
    return NextResponse.json(
      { error: "Internal server error fetching brand kit" },
      { status: 500 }
    );
  }
}

// POST /api/v1/brand-kits
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workspace = await getOrCreateDefaultWorkspace();

    const {
      name = "Default Brand Kit",
      logoCloudinaryUrl,
      primaryColor = "#0F172A",
      secondaryColor = "#F8FAFC",
      accentColor = "#10B981",
      fontFamily = "Inter",
    } = body;

    const brandKit = await prisma.brandKit.create({
      data: {
        workspaceId: workspace.id,
        name,
        logoCloudinaryUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
      },
    });

    return NextResponse.json({ success: true, brandKit }, { status: 201 });
  } catch (error) {
    console.error("Error creating brand kit:", error);
    return NextResponse.json(
      { error: "Failed to create brand kit" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/brand-kits
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const workspace = await getOrCreateDefaultWorkspace();

    let targetId = body.id;

    if (!targetId) {
      const defaultKit = await prisma.brandKit.findFirst({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "asc" },
      });
      if (defaultKit) {
        targetId = defaultKit.id;
      }
    }

    if (!targetId) {
      // Create if none exists
      const brandKit = await prisma.brandKit.create({
        data: {
          workspaceId: workspace.id,
          name: body.name || "Default Brand Kit",
          logoCloudinaryUrl: body.logoCloudinaryUrl,
          primaryColor: body.primaryColor || "#0F172A",
          secondaryColor: body.secondaryColor || "#F8FAFC",
          accentColor: body.accentColor || "#10B981",
          fontFamily: body.fontFamily || "Inter",
        },
      });
      return NextResponse.json({ success: true, brandKit });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.logoCloudinaryUrl !== undefined) updateData.logoCloudinaryUrl = body.logoCloudinaryUrl;
    if (body.primaryColor !== undefined) updateData.primaryColor = body.primaryColor;
    if (body.secondaryColor !== undefined) updateData.secondaryColor = body.secondaryColor;
    if (body.accentColor !== undefined) updateData.accentColor = body.accentColor;
    if (body.fontFamily !== undefined) updateData.fontFamily = body.fontFamily;

    const brandKit = await prisma.brandKit.update({
      where: { id: targetId },
      data: updateData,
    });

    return NextResponse.json({ success: true, brandKit });
  } catch (error) {
    console.error("Error updating brand kit:", error);
    return NextResponse.json(
      { error: "Failed to update brand kit" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/brand-kits
export async function PUT(req: Request) {
  return PATCH(req);
}
