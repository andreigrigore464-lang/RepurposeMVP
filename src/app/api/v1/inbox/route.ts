import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDefaultWorkspace, fallbackStore } from "@/lib/workspace";

// GET /api/v1/inbox
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedWorkspaceId = searchParams.get("workspaceId");

    const defaultWorkspace = await getOrCreateDefaultWorkspace();
    const workspaceId = requestedWorkspaceId || defaultWorkspace.id;

    try {
      const drafts = await prisma.publishDraftItem.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, drafts });
    } catch {
      const drafts = fallbackStore.drafts.filter((d) => d.workspaceId === workspaceId);
      return NextResponse.json({ success: true, drafts });
    }
  } catch (error) {
    console.error("[Inbox GET Error]:", error);
    return NextResponse.json({ success: true, drafts: fallbackStore.drafts });
  }
}

// PATCH /api/v1/inbox (Approve, Update status, or Edit text)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, postTitle, postCaption, postHashtags } = body;

    if (!id) {
      return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
    }

    try {
      const updated = await prisma.publishDraftItem.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(postTitle ? { postTitle } : {}),
          ...(postCaption ? { postCaption } : {}),
          ...(postHashtags ? { postHashtags } : {}),
          ...(status === "APPROVED" || status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
        },
      });
      return NextResponse.json({ success: true, draft: updated });
    } catch {
      const idx = fallbackStore.drafts.findIndex((d) => d.id === id);
      if (idx >= 0) {
        fallbackStore.drafts[idx] = {
          ...fallbackStore.drafts[idx],
          ...(status ? { status } : {}),
          ...(postTitle ? { postTitle } : {}),
          ...(postCaption ? { postCaption } : {}),
          ...(postHashtags ? { postHashtags } : {}),
          updatedAt: new Date().toISOString(),
        };
        return NextResponse.json({ success: true, draft: fallbackStore.drafts[idx] });
      }
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("[Inbox PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }
}

// DELETE /api/v1/inbox
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
    }

    try {
      await prisma.publishDraftItem.delete({ where: { id } });
    } catch {
      fallbackStore.drafts = fallbackStore.drafts.filter((d) => d.id !== id);
    }

    return NextResponse.json({ success: true, message: "Draft deleted" });
  } catch (error) {
    console.error("[Inbox DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
