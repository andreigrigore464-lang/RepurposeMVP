import { NextResponse } from "next/server";
import { scrapeArticle } from "@/services/scraper";
import { geminiProvider } from "@/services/ai/geminiProvider";
import { resolveBackgroundImage, BackgroundImageStrategy } from "@/services/imageResolver";
import { renderCarouselSlides } from "@/services/templated";
import { stitchSlidesToPdf } from "@/services/pdfStitcher";
import prisma from "@/lib/prisma";
import { Prisma, PlatformType } from "@prisma/client";
import { getOrCreateDefaultWorkspace, fallbackStore } from "@/lib/workspace";

// POST /api/v1/workflows/run
// Executes an end-to-end repurposing run on an article URL, persists source, execution & draft
export async function POST(req: Request) {
  const startTime = Date.now();
  const timings: Record<string, number> = {};

  try {
    const body = await req.json();
    const {
      workflowId,
      articleUrl,
      templateId = "tmpl_hook_square_01",
      backgroundStrategy = "ARTICLE_IMAGE_FIRST" as BackgroundImageStrategy,
      outputFormat = "MULTI_SLIDE_CAROUSEL",
      destinationPlatform = "LINKEDIN",
      brandKitId,
    } = body;

    if (!articleUrl) {
      return NextResponse.json({ error: "Article URL is required to run workflow" }, { status: 400 });
    }

    const defaultWorkspace = await getOrCreateDefaultWorkspace();
    const workspaceId = defaultWorkspace.id;

    // 1. Fetch Brand Kit Logo if available
    let brandLogoUrl: string | null = null;
    try {
      const brandKit = brandKitId
        ? await prisma.brandKit.findUnique({ where: { id: brandKitId } })
        : await prisma.brandKit.findFirst({ where: { workspaceId } });
      brandLogoUrl = brandKit?.logoCloudinaryUrl || null;
    } catch {
      // offline
    }

    // 2. Scrape Article
    const t0 = Date.now();
    const scraped = await scrapeArticle(articleUrl);
    timings.scrape_ms = Date.now() - t0;

    // 3. AI Processing with Gemini Flash
    const t1 = Date.now();
    let slidesData: Array<{
      slide_index: number;
      headline: string;
      body: string;
      slide_type: "HOOK" | "INSIGHT" | "CTA";
    }> = [];
    let postCaption = "";
    let postHashtags: string[] = [];
    let visualKeywords: string[] = [];

    if (outputFormat === "SINGLE_IMAGE_CARD") {
      const cardSummary = await geminiProvider.summarizeForSingleCard(
        scraped.bodyMarkdown || scraped.plainText,
        scraped.title
      );
      slidesData = [
        {
          slide_index: 1,
          headline: cardSummary.headline,
          body: cardSummary.body,
          slide_type: "HOOK",
        },
      ];
      postCaption = cardSummary.postCaption;
      postHashtags = cardSummary.hashtags;
      visualKeywords = cardSummary.visualSearchKeywords;
    } else {
      const carouselSummary = await geminiProvider.summarizeForCarousel(
        scraped.bodyMarkdown || scraped.plainText,
        scraped.title
      );
      slidesData = carouselSummary.slides;
      postCaption = `🚀 ${carouselSummary.hookAngle}\n\n${carouselSummary.slides
        .slice(0, 3)
        .map((s) => `• ${s.headline}: ${s.body.slice(0, 80)}...`)
        .join("\n")}\n\nSwipe through the carousel presentation below for the full breakdown! 👇`;
      postHashtags = carouselSummary.suggestedHashtags;
      visualKeywords = carouselSummary.visualSearchKeywords;
    }
    timings.ai_summarize_ms = Date.now() - t1;

    // 4. Resolve Background Image
    const t2 = Date.now();
    const resolvedBgUrl = await resolveBackgroundImage({
      strategy: backgroundStrategy,
      articleImageUrl: scraped.featuredImageUrl,
      visualKeywords,
    });
    timings.image_resolve_ms = Date.now() - t2;

    // 5. Batch Render Slides with Templated.io
    const t3 = Date.now();
    const renderedSlides = await renderCarouselSlides(templateId, slidesData, {
      brandKitLogoUrl: brandLogoUrl,
      backgroundImageUrl: resolvedBgUrl,
      externalId: workspaceId,
    });
    timings.templated_render_ms = Date.now() - t3;

    // 6. Stitch PDF (if multi-slide carousel)
    let pdfUrl: string | null = null;
    if (outputFormat === "MULTI_SLIDE_CAROUSEL" && renderedSlides.length > 1) {
      const t4 = Date.now();
      const pdfResult = await stitchSlidesToPdf(
        renderedSlides.map((s) => s.rendered_png_url),
        {
          title: scraped.title,
          author: scraped.author || defaultWorkspace.name,
          keywords: postHashtags,
        }
      );
      pdfUrl = pdfResult.pdfUrl;
      timings.pdf_stitch_ms = Date.now() - t4;
    }

    timings.total_duration_ms = Date.now() - startTime;

    // 7. Persist to Database or Fallback Store
    const draftId = `draft-${Date.now()}`;
    const draftItem = {
      id: draftId,
      workspaceId,
      workflowId: workflowId || null,
      destinationPlatform: destinationPlatform as "LINKEDIN" | "TWITTER_X" | "INSTAGRAM",
      postTitle: scraped.title,
      postCaption,
      postHashtags,
      slidesData: renderedSlides,
      pdfDocumentUrl: pdfUrl,
      status: "PENDING_APPROVAL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Source Item
      const sourceItem = await prisma.sourceItem.create({
        data: {
          workspaceId,
          workflowId: workflowId || null,
          externalUrl: scraped.url,
          title: scraped.title,
          bodyMarkdown: scraped.bodyMarkdown,
          authorName: scraped.author,
          featuredImageUrl: scraped.featuredImageUrl,
          publishedAt: scraped.publishedAt ? new Date(scraped.publishedAt) : new Date(),
        },
      });

      // 2. Execution Record
      const execution = await prisma.workflowExecution.create({
        data: {
          workspaceId,
          workflowId: workflowId || null,
          sourceItemId: sourceItem.id,
          status: "PENDING_APPROVAL",
        },
      });

      // 3. Publish Draft Item
      const createdDraft = await prisma.publishDraftItem.create({
        data: {
          workspaceId,
          executionId: execution.id,
          destinationPlatform: (destinationPlatform as PlatformType) || PlatformType.LINKEDIN,
          postTitle: scraped.title,
          postCaption,
          postHashtags,
          slidesData: renderedSlides as unknown as Prisma.InputJsonValue,
          pdfDocumentUrl: pdfUrl,
          status: "PENDING_APPROVAL",
        },
      });

      return NextResponse.json({
        success: true,
        draft: createdDraft,
        timings,
      });
    } catch {
      // Offline fallback
      fallbackStore.drafts.unshift(draftItem);
      return NextResponse.json({
        success: true,
        draft: draftItem,
        timings,
      });
    }
  } catch (error) {
    console.error("[Workflow Run Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Workflow execution failed",
        timings: { ...timings, total_duration_ms: Date.now() - startTime },
      },
      { status: 500 }
    );
  }
}
