import { NextResponse } from "next/server";
import { scrapeArticle } from "@/services/scraper";
import { geminiProvider } from "@/services/ai/geminiProvider";
import { resolveBackgroundImage, BackgroundImageStrategy } from "@/services/imageResolver";
import { renderCarouselSlides } from "@/services/templated";
import { stitchSlidesToPdf } from "@/services/pdfStitcher";
import prisma from "@/lib/prisma";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

// POST /api/v1/test/repurpose-article
// End-to-end pipeline test for Article Scraping, AI Summarization, Image Resolution, Rendering & PDF Stitching
export async function POST(req: Request) {
  const startTime = Date.now();
  const timings: Record<string, number> = {};

  try {
    const body = await req.json();
    const {
      articleUrl = "https://example.com/ai-content-repurposing",
      templateId = "tmpl_hook_square_01",
      backgroundStrategy = "ARTICLE_IMAGE_FIRST" as BackgroundImageStrategy,
      brandKitId,
    } = body;

    const workspace = await getOrCreateDefaultWorkspace();

    // 1. Fetch Brand Kit Logo if available
    let brandLogoUrl: string | null = null;
    try {
      const brandKit = brandKitId
        ? await prisma.brandKit.findUnique({ where: { id: brandKitId } })
        : await prisma.brandKit.findFirst({ where: { workspaceId: workspace.id } });
      brandLogoUrl = brandKit?.logoCloudinaryUrl || null;
    } catch {
      // Database offline fallback
    }

    // 2. Scrape Article
    const t0 = Date.now();
    const scrapedArticle = await scrapeArticle(articleUrl);
    timings.scrape_ms = Date.now() - t0;

    // 3. AI Summarization with Gemini Flash
    const t1 = Date.now();
    const carouselSummary = await geminiProvider.summarizeForCarousel(
      scrapedArticle.bodyMarkdown || scrapedArticle.plainText,
      scrapedArticle.title
    );
    timings.ai_summarize_ms = Date.now() - t1;

    // 4. Resolve Background Image Strategy
    const t2 = Date.now();
    const resolvedBgImageUrl = await resolveBackgroundImage({
      strategy: backgroundStrategy,
      articleImageUrl: scrapedArticle.featuredImageUrl,
      visualKeywords: carouselSummary.visualSearchKeywords,
    });
    timings.image_resolve_ms = Date.now() - t2;

    // 5. Batch Render Slides with Templated.io
    const t3 = Date.now();
    const renderedSlides = await renderCarouselSlides(
      templateId,
      carouselSummary.slides,
      {
        brandKitLogoUrl: brandLogoUrl,
        backgroundImageUrl: resolvedBgImageUrl,
        externalId: workspace.id,
      }
    );
    timings.templated_render_ms = Date.now() - t3;

    // 6. Stitch PDF Document
    const t4 = Date.now();
    const slidePngUrls = renderedSlides.map((s) => s.rendered_png_url);
    const pdfResult = await stitchSlidesToPdf(slidePngUrls, {
      title: scrapedArticle.title,
      author: scrapedArticle.author || workspace.name,
      keywords: carouselSummary.suggestedHashtags,
    });
    timings.pdf_stitch_ms = Date.now() - t4;

    const totalDurationMs = Date.now() - startTime;
    timings.total_duration_ms = totalDurationMs;

    return NextResponse.json({
      success: true,
      data: {
        article: {
          url: scrapedArticle.url,
          title: scrapedArticle.title,
          author: scrapedArticle.author,
          wordCount: scrapedArticle.wordCount,
          siteName: scrapedArticle.siteName,
          featuredImageUrl: scrapedArticle.featuredImageUrl,
        },
        aiSummary: carouselSummary,
        background: {
          strategy: backgroundStrategy,
          resolvedImageUrl: resolvedBgImageUrl,
        },
        renderedSlides,
        pdfDocument: {
          pdfUrl: pdfResult.pdfUrl,
          pageCount: pdfResult.pageCount,
          fileSizeBytes: pdfResult.fileSizeBytes,
        },
      },
      timings,
    });
  } catch (error) {
    console.error("[Test Repurpose Article Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Repurpose pipeline failed",
        timings: { ...timings, total_duration_ms: Date.now() - startTime },
      },
      { status: 500 }
    );
  }
}
