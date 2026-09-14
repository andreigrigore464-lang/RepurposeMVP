import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDefaultWorkspace, fallbackStore } from "@/lib/workspace";

// GET /api/v1/workflows
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedWorkspaceId = searchParams.get("workspaceId");

    const defaultWorkspace = await getOrCreateDefaultWorkspace();
    const workspaceId = requestedWorkspaceId || defaultWorkspace.id;

    try {
      const workflows = await prisma.workflow.findMany({
        where: { workspaceId },
        include: {
          brandTemplate: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, workflows });
    } catch {
      // Offline fallback
      const workflows = fallbackStore.workflows.filter((w) => w.workspaceId === workspaceId);
      return NextResponse.json({ success: true, workflows });
    }
  } catch (error) {
    console.error("[Workflows GET Error]:", error);
    return NextResponse.json({ success: true, workflows: fallbackStore.workflows });
  }
}

// POST /api/v1/workflows (Create or Update)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const defaultWorkspace = await getOrCreateDefaultWorkspace();
    const workspaceId = body.workspaceId || defaultWorkspace.id;

    const {
      id,
      name,
      isActive = true,
      sourcePlatform = "CUSTOM_URL",
      sourceRssFeedUrl,
      destinationPlatform = "LINKEDIN",
      brandTemplateId,
      outputFormat = "MULTI_SLIDE_CAROUSEL",
      backgroundStrategy = "ARTICLE_IMAGE_FIRST",
      isAutopilot = false,
      filterRules = { min_word_count: 150, keywords_include: [], keywords_exclude: [] },
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Workflow name is required" }, { status: 400 });
    }

    try {
      if (id) {
        const workflow = await prisma.workflow.update({
          where: { id },
          data: {
            name,
            isActive,
            sourcePlatform,
            sourceRssFeedUrl: sourceRssFeedUrl || null,
            destinationPlatform,
            brandTemplateId: brandTemplateId || null,
            outputFormat,
            backgroundStrategy,
            isAutopilot,
            filterRules,
          },
        });
        return NextResponse.json({ success: true, workflow });
      }

      const workflow = await prisma.workflow.create({
        data: {
          workspaceId,
          name,
          isActive,
          sourcePlatform,
          sourceRssFeedUrl: sourceRssFeedUrl || null,
          destinationPlatform,
          brandTemplateId: brandTemplateId || null,
          outputFormat,
          backgroundStrategy,
          isAutopilot,
          filterRules,
        },
      });
      return NextResponse.json({ success: true, workflow }, { status: 201 });
    } catch {
      // Offline fallback
      if (id) {
        const idx = fallbackStore.workflows.findIndex((w) => w.id === id);
        if (idx >= 0) {
          fallbackStore.workflows[idx] = {
            ...fallbackStore.workflows[idx],
            name,
            isActive,
            sourcePlatform,
            sourceRssFeedUrl,
            destinationPlatform,
            brandTemplateId,
            outputFormat,
            backgroundStrategy,
            isAutopilot,
            filterRules,
            updatedAt: new Date().toISOString(),
          };
          return NextResponse.json({ success: true, workflow: fallbackStore.workflows[idx] });
        }
      }

      const newWf = {
        id: `wf-${Date.now()}`,
        workspaceId,
        name,
        isActive,
        sourcePlatform,
        sourceRssFeedUrl: sourceRssFeedUrl || null,
        destinationPlatform,
        brandTemplateId: brandTemplateId || null,
        outputFormat,
        backgroundStrategy,
        isAutopilot,
        filterRules,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      fallbackStore.workflows.unshift(newWf);
      return NextResponse.json({ success: true, workflow: newWf }, { status: 201 });
    }
  } catch (error) {
    console.error("[Workflows POST Error]:", error);
    return NextResponse.json({ error: "Failed to save workflow" }, { status: 500 });
  }
}

// DELETE /api/v1/workflows
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
    }

    try {
      await prisma.workflow.delete({ where: { id } });
    } catch {
      fallbackStore.workflows = fallbackStore.workflows.filter((w) => w.id !== id);
    }

    return NextResponse.json({ success: true, message: "Workflow deleted" });
  } catch (error) {
    console.error("[Workflows DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
  }
}
