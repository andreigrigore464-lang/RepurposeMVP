import { NextResponse } from "next/server";
import { scrapeArticle, fetchRssFeedItems } from "@/services/scraper";
import { geminiProvider } from "@/services/ai/geminiProvider";
import { resolveCarouselBackgroundImages, resolveBackgroundImage, resolveMultipleImages, BackgroundImageStrategy } from "@/services/imageResolver";
import { renderCarouselSlides } from "@/services/templated";
import { isMockTemplate, normalizeTemplateConfig, DynamicTemplateConfig } from "@/lib/templated";
import { stitchSlidesToPdf } from "@/services/pdfStitcher";
import prisma from "@/lib/prisma";
import { Prisma, PlatformType, OutputFormatType, BackgroundImageStrategy as PrismaBgStrategy, ExecutionStatus } from "@prisma/client";
import { getCurrentWorkspace, fallbackStore } from "@/lib/workspace";
import { CarouselSlide } from "@/services/ai/types";

// POST /api/v1/workflows/run
// Executes an end-to-end repurposing pipeline run for a workflow or single URL
export async function POST(req: Request) {
  const startTime = Date.now();
  const timings: Record<string, number> = {};

  try {
    const body = await req.json();
    const {
      workflowId,
    } = body;

    const userSession = await getCurrentWorkspace();
    const workspaceId = userSession.workspace.id;

    // 1. Resolve workflow config if workflowId is provided
    let workflowConfig: {
      name?: string;
      sourcePlatform?: string;
      sourceRssFeedUrl?: string | null;
      destinationPlatform?: string;
      brandTemplateId?: string | null;
      outputFormat?: string;
      backgroundStrategy?: string;
      isAutopilot?: boolean;
      filterRules?: { min_word_count?: number; keywords_include?: string[]; keywords_exclude?: string[] };
    } | null = null;

    if (workflowId) {
      try {
        const dbWf = await prisma.workflow.findUnique({
          where: { id: workflowId },
          include: { brandTemplate: true },
        });
        if (dbWf) {
          workflowConfig = {
            name: dbWf.name,
            sourcePlatform: dbWf.sourcePlatform,
            sourceRssFeedUrl: dbWf.sourceRssFeedUrl,
            destinationPlatform: dbWf.destinationPlatform,
            brandTemplateId: dbWf.brandTemplate?.templatedTemplateId || dbWf.brandTemplateId,
            outputFormat: dbWf.outputFormat,
            backgroundStrategy: dbWf.backgroundStrategy,
            isAutopilot: dbWf.isAutopilot,
            filterRules: (dbWf.filterRules as { min_word_count?: number; keywords_include?: string[]; keywords_exclude?: string[] }) || {},
          };
        }
      } catch {
        const found = fallbackStore.workflows.find((w) => w.id === workflowId);
        if (found) {
          workflowConfig = {
            name: found.name,
            sourcePlatform: found.sourcePlatform,
            sourceRssFeedUrl: found.sourceRssFeedUrl,
            destinationPlatform: found.destinationPlatform,
            brandTemplateId: found.brandTemplateId,
            outputFormat: found.outputFormat,
            backgroundStrategy: found.backgroundStrategy,
            isAutopilot: found.isAutopilot,
            filterRules: (found.filterRules as { min_word_count?: number; keywords_include?: string[]; keywords_exclude?: string[] }) || {},
          };
        }
      }
    }

    // Merge body overrides with workflow defaults
    const templateId =
      body.templateId ||
      workflowConfig?.brandTemplateId ||
      "tmpl_hook_square_01";

    const backgroundStrategy = (body.backgroundStrategy ||
      workflowConfig?.backgroundStrategy ||
      "ARTICLE_IMAGE_FIRST") as BackgroundImageStrategy;

    const outputFormat =
      body.outputFormat ||
      workflowConfig?.outputFormat ||
      "MULTI_SLIDE_CAROUSEL";

    const destinationPlatform =
      body.destinationPlatform ||
      workflowConfig?.destinationPlatform ||
      "LINKEDIN";

    const isAutopilot =
      body.isAutopilot !== undefined
        ? Boolean(body.isAutopilot)
        : workflowConfig?.isAutopilot || false;

    const filterRules = body.filterRules || workflowConfig?.filterRules || { min_word_count: 150 };
    const minWordCount = filterRules.min_word_count ?? 150;

    // Determine target URL (Article or RSS feed)
    let targetUrl = body.articleUrl || workflowConfig?.sourceRssFeedUrl;
    if (!targetUrl && workflowConfig?.sourcePlatform === "BLOG_RSS" && workflowConfig.sourceRssFeedUrl) {
      targetUrl = workflowConfig.sourceRssFeedUrl;
    }

    if (!targetUrl) {
      targetUrl = "https://example.com/scale-content-repurposing";
    }

    // 2. If target is an RSS feed, resolve the newest article link
    const isRss =
      workflowConfig?.sourcePlatform === "BLOG_RSS" ||
      targetUrl.includes("/feed") ||
      targetUrl.endsWith(".rss") ||
      targetUrl.endsWith(".xml");

    let articleToScrapeUrl = targetUrl;
    if (isRss) {
      const tRss = Date.now();
      try {
        const feedItems = await fetchRssFeedItems(targetUrl);
        if (feedItems.length > 0 && feedItems[0].link) {
          articleToScrapeUrl = feedItems[0].link;
        }
      } catch (rssErr) {
        console.warn(`[Workflows Run] RSS resolution failed for ${targetUrl}, using fallback:`, rssErr);
        articleToScrapeUrl = "https://example.com/scale-content-repurposing";
      }
      timings.rss_fetch_ms = Date.now() - tRss;
    }

    // 3. Scrape Article
    const t0 = Date.now();
    const scraped = await scrapeArticle(articleToScrapeUrl);
    timings.scrape_ms = Date.now() - t0;

    // 4. Check Information Density / Word Count Filter Guard
    if (scraped.wordCount < minWordCount && !body.bypassWordCountFilter) {
      return NextResponse.json(
        {
          success: false,
          filtered: true,
          error: `Article word count (${scraped.wordCount} words) is below the workflow minimum threshold (${minWordCount} words).`,
          scrapedSummary: {
            title: scraped.title,
            wordCount: scraped.wordCount,
            url: scraped.url,
          },
          timings: { ...timings, total_duration_ms: Date.now() - startTime },
        },
        { status: 422 }
      );
    }

    // 5. AI Processing with Gemini Flash
    const t1 = Date.now();
    let slidesData: CarouselSlide[] = [];
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
      postCaption =
        carouselSummary.postCaption ||
        `🚀 ${carouselSummary.hookAngle}\n\nSwipe through the carousel presentation below for the full visual breakdown! 👇`;
      postHashtags = carouselSummary.suggestedHashtags;
      visualKeywords = carouselSummary.visualSearchKeywords;
    }
    timings.ai_summarize_ms = Date.now() - t1;

    // 6. Template Configuration & Image Placeholders Inspection
    let templateDynamicConfig: DynamicTemplateConfig | null = null;
    let templateAspectRatio = "1:1";
    try {
      const dbTmpl = await prisma.brandTemplate.findFirst({
        where: {
          OR: [{ templatedTemplateId: templateId }, { id: templateId }],
        },
      });
      if (dbTmpl) {
        templateAspectRatio = dbTmpl.aspectRatio || "1:1";
        if (dbTmpl.layerMappings) {
          templateDynamicConfig = normalizeTemplateConfig(dbTmpl.layerMappings as Record<string, unknown>);
        }
      }
    } catch {
      const fallbackTmpl = fallbackStore.templates.find(
        (t) => t.templatedTemplateId === templateId || t.id === templateId
      );
      if (fallbackTmpl) {
        templateAspectRatio = fallbackTmpl.aspectRatio || "1:1";
        if (fallbackTmpl.layerMappings) {
          templateDynamicConfig = normalizeTemplateConfig(fallbackTmpl.layerMappings as Record<string, unknown>);
        }
      }
    }

    const isMock = isMockTemplate(templateId);

    // Identify configured image placeholders (Hero image, secondary images, brand logo, etc.)
    const configuredImageFields = (templateDynamicConfig?.fields || []).filter(
      (f) =>
        f.type === "image" ||
        f.role === "hero_image" ||
        f.role === "secondary_image" ||
        f.role === "brand_logo"
    );

    // If template defines multiple image placeholders (e.g. 1 hero + 2 secondary = 3 images), resolve at least that many images
    const targetImageCount = Math.max(
      configuredImageFields.length,
      outputFormat === "MULTI_SLIDE_CAROUSEL" ? slidesData.length : 1
    );

    const t2 = Date.now();
    const resolvedImages = await resolveMultipleImages({
      count: targetImageCount,
      strategy: backgroundStrategy,
      articleImages: scraped.images || (scraped.featuredImageUrl ? [scraped.featuredImageUrl] : []),
      visualKeywords,
      aspectRatio: templateAspectRatio,
    });

    // Assign resolved images to slides
    slidesData.forEach((slide, idx) => {
      slide.background_image_url = resolvedImages[idx] || resolvedImages[0] || null;
    });
    timings.image_resolve_ms = Date.now() - t2;

    // 7. Render Slides (Templated.io vs Zero-Credit Simulation Mock Path)
    const t3 = Date.now();
    let renderedSlides: Array<{
      slide_index: number;
      headline: string;
      body: string;
      rendered_png_url: string;
      background_image_url?: string | null;
    }> = [];

    if (isMock) {
      // ZERO-CREDIT MOCK PATH:
      // Completely bypass Templated.io API.
      // If template configured multiple image placeholders (e.g. 1 hero + 2 secondary = 3 images)
      // or if multiple slides/images were generated, output each image as a slide so all are visible one at a time.
      const totalMockSlides = Math.max(slidesData.length, resolvedImages.length);

      renderedSlides = Array.from({ length: totalMockSlides }, (_, idx) => {
        const slideData = slidesData[idx] || slidesData[0] || {
          slide_index: idx + 1,
          headline: `Slide ${idx + 1}`,
          body: "",
        };
        const slideImg =
          resolvedImages[idx] ||
          resolvedImages[0] ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop";

        return {
          slide_index: idx + 1,
          headline: slideData.headline || "",
          body: slideData.body || "",
          rendered_png_url: slideImg,
          background_image_url: slideImg,
        };
      });

      // Format all image placeholders and synthesized text fields into the description
      const imageBreakdown = resolvedImages
        .map((url, i) => {
          const field = configuredImageFields[i];
          const roleLabel = field ? `${field.label} (${field.layerKey || field.role})` : `Image #${i + 1}`;
          return `• ${roleLabel}: ${url}`;
        })
        .join("\n");

      const slideTextBreakdowns = slidesData
        .map((s, idx) => {
          const typeLabel = s.slide_type ? ` [${s.slide_type}]` : "";
          return `📄 Slide ${s.slide_index || idx + 1}${typeLabel}:\n• Headline: ${s.headline || "(None)"}\n• Body: ${s.body || "(None)"}`;
        })
        .join("\n\n");

      postCaption = `🧪 [SIMULATION MODE - 0 CREDITS CONSUMED]\nAll fetched content, resolved images, and AI-synthesized fields are displayed below for verification.\n\n${postCaption}\n\n---\n🖼️ RESOLVED IMAGES (${resolvedImages.length} total):\n${imageBreakdown}\n\n---\n📋 GENERATED SLIDE CONTENT BREAKDOWN:\n\n${slideTextBreakdowns}`;
      timings.templated_render_ms = 0;
    } else {
      renderedSlides = await renderCarouselSlides(templateId, slidesData, {
        externalId: workspaceId,
      });
      timings.templated_render_ms = Date.now() - t3;
    }

    // 9. Stitch PDF (if multi-slide carousel OR if mock template generated multiple images)
    let pdfUrl: string | null = null;
    if (renderedSlides.length > 1) {
      const t4 = Date.now();
      const pdfResult = await stitchSlidesToPdf(
        renderedSlides.map((s) => s.rendered_png_url),
        {
          title: scraped.title,
          author: scraped.author || userSession.workspace.name,
          keywords: postHashtags,
        }
      );
      pdfUrl = pdfResult.pdfUrl;
      timings.pdf_stitch_ms = Date.now() - t4;
    }

    timings.total_duration_ms = Date.now() - startTime;

    // 10. Persist to Database or Fallback Store
    const draftStatus: ExecutionStatus = isAutopilot ? ExecutionStatus.SUCCEEDED : ExecutionStatus.PENDING_APPROVAL;
    const draftId = `draft-${Date.now()}`;
    const draftItem = {
      id: draftId,
      workspaceId,
      executionId: `exec-${Date.now()}`,
      destinationPlatform: destinationPlatform as "LINKEDIN" | "TWITTER_X" | "INSTAGRAM",
      postTitle: scraped.title,
      postCaption,
      postHashtags,
      slidesData: renderedSlides,
      pdfDocumentUrl: pdfUrl,
      status: draftStatus,
      publishedAt: isAutopilot ? new Date().toISOString() : null,
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
          status: draftStatus,
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
          status: draftStatus,
          publishedAt: isAutopilot ? new Date() : null,
        },
      });

      return NextResponse.json({
        success: true,
        workflowId: workflowId || null,
        draft: createdDraft,
        sourceItem: {
          id: sourceItem.id,
          title: sourceItem.title,
          url: sourceItem.externalUrl,
          wordCount: scraped.wordCount,
        },
        timings,
      });
    } catch {
      // Offline fallback
      fallbackStore.drafts.unshift(draftItem);
      return NextResponse.json({
        success: true,
        workflowId: workflowId || null,
        draft: draftItem,
        sourceItem: {
          id: `src-${Date.now()}`,
          title: scraped.title,
          url: scraped.url,
          wordCount: scraped.wordCount,
        },
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
