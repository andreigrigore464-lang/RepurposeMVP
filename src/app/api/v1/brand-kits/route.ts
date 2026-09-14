import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDefaultWorkspace, fallbackStore, isDatabaseAvailable } from "@/lib/workspace";

// GET /api/v1/brand-kits
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const workspace = await getOrCreateDefaultWorkspace();

    const dbOnline = await isDatabaseAvailable();
    if (!dbOnline) {
      const kit = fallbackStore.workspace.brandKits[0];
      return NextResponse.json({ success: true, brandKit: kit, brandKits: fallbackStore.workspace.brandKits });
    }

    try {
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
            accentColor: "#00FF66",
            fontFamily: "Inter",
          },
        });
      }

      return NextResponse.json({ success: true, brandKit });
    } catch {
      // Database offline fallback
      const kit = fallbackStore.workspace.brandKits[0];
      return NextResponse.json({ success: true, brandKit: kit });
    }
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
      accentColor = "#00FF66",
      fontFamily = "Inter",
    } = body;

    try {
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
    } catch {
      const newKit = {
        id: `mock-kit-${Date.now()}`,
        workspaceId: workspace.id,
        name,
        logoCloudinaryUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fallbackStore.workspace.brandKits.push(newKit);
      return NextResponse.json({ success: true, brandKit: newKit }, { status: 201 });
    }
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

    try {
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
        const brandKit = await prisma.brandKit.create({
          data: {
            workspaceId: workspace.id,
            name: body.name || "Default Brand Kit",
            logoCloudinaryUrl: body.logoCloudinaryUrl,
            primaryColor: body.primaryColor || "#0F172A",
            secondaryColor: body.secondaryColor || "#F8FAFC",
            accentColor: body.accentColor || "#00FF66",
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
    } catch {
      // Offline update
      const existing = fallbackStore.workspace.brandKits[0];
      if (body.name !== undefined) existing.name = body.name;
      if (body.logoCloudinaryUrl !== undefined) existing.logoCloudinaryUrl = body.logoCloudinaryUrl;
      if (body.primaryColor !== undefined) existing.primaryColor = body.primaryColor;
      if (body.secondaryColor !== undefined) existing.secondaryColor = body.secondaryColor;
      if (body.accentColor !== undefined) existing.accentColor = body.accentColor;
      if (body.fontFamily !== undefined) existing.fontFamily = body.fontFamily;
      return NextResponse.json({ success: true, brandKit: existing });
    }
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
