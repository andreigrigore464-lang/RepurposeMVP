import { NextResponse } from "next/server";
import { scrapeArticle } from "@/services/scraper";
import { geminiProvider } from "@/services/ai/geminiProvider";
import { resolveCarouselBackgroundImages, BackgroundImageStrategy } from "@/services/imageResolver";
import { renderCarouselSlides } from "@/services/templated";
import { stitchSlidesToPdf } from "@/services/pdfStitcher";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

// POST /api/v1/test/repurpose-article
export async function POST(req: Request) {
  const startTime = Date.now();
  const timings: Record<string, number> = {};

  try {
    const body = await req.json();
    const {
      articleUrl = "https://example.com/ai-content-repurposing",
      templateId = "tmpl_hook_square_01",
      backgroundStrategy = "ARTICLE_IMAGE_FIRST" as BackgroundImageStrategy,
    } = body;

    const workspace = await getOrCreateDefaultWorkspace();

    // 1. Scrape Article
    const t0 = Date.now();
    const scrapedArticle = await scrapeArticle(articleUrl);
    timings.scrape_ms = Date.now() - t0;

    // 2. AI Summarization with Gemini Flash
    const t1 = Date.now();
    const carouselSummary = await geminiProvider.summarizeForCarousel(
      scrapedArticle.bodyMarkdown || scrapedArticle.plainText,
      scrapedArticle.title
    );
    timings.ai_summarize_ms = Date.now() - t1;

    // 3. Resolve Background Image Strategy (per-slide unique images with article priority & AI smart crop)
    const t2 = Date.now();
    const resolvedBgImages = await resolveCarouselBackgroundImages({
      strategy: backgroundStrategy,
      articleImages: scrapedArticle.images || (scrapedArticle.featuredImageUrl ? [scrapedArticle.featuredImageUrl] : []),
      slides: carouselSummary.slides,
      fallbackKeywords: carouselSummary.visualSearchKeywords,
      aspectRatio: "1:1",
    });
    timings.image_resolve_ms = Date.now() - t2;

    carouselSummary.slides.forEach((slide, idx) => {
      slide.background_image_url = resolvedBgImages[idx] || null;
    });

    // 4. Batch Render Slides with Templated.io
    const t3 = Date.now();
    const renderedSlides = await renderCarouselSlides(templateId, carouselSummary.slides, {
      externalId: workspace.id,
    });
    timings.templated_render_ms = Date.now() - t3;

    // 5. Stitch PDF Document
    const t4 = Date.now();
    const pdfResult = await stitchSlidesToPdf(
      renderedSlides.map((s) => s.rendered_png_url),
      {
        title: scrapedArticle.title,
        author: scrapedArticle.author || "RepurposeAI",
        keywords: carouselSummary.suggestedHashtags,
      }
    );
    timings.pdf_stitch_ms = Date.now() - t4;

    const totalDuration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        article: {
          url: scrapedArticle.url,
          title: scrapedArticle.title,
          author: scrapedArticle.author,
          wordCount: scrapedArticle.wordCount,
          featuredImage: scrapedArticle.featuredImageUrl,
        },
        aiSummary: {
          hookAngle: carouselSummary.hookAngle,
          postCaption: carouselSummary.postCaption,
          hashtags: carouselSummary.suggestedHashtags,
          visualKeywords: carouselSummary.visualSearchKeywords,
        },
        slides: renderedSlides,
        pdf: {
          url: pdfResult.pdfUrl,
          pageCount: pdfResult.pageCount,
          fileSizeBytes: pdfResult.fileSizeBytes,
        },
        timings: {
          ...timings,
          total_duration_ms: totalDuration,
        },
      },
    });
  } catch (error) {
    console.error("[Test Repurpose Article Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Repurposing pipeline failed",
      },
      { status: 500 }
    );
  }
}
