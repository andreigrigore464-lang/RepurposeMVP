import { GoogleGenAI } from "@google/genai";
import { LLMProvider, CarouselSummary, SingleCardSummary } from "./types";

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName = "gemini-2.0-flash") {
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
    this.modelName = modelName;

    if (effectiveApiKey && !effectiveApiKey.startsWith("mock_")) {
      try {
        this.client = new GoogleGenAI({ apiKey: effectiveApiKey });
      } catch (err) {
        console.warn("[GeminiProvider] Initialization warning:", err);
      }
    }
  }

  /**
   * Summarizes long-form article text into a 5-6 slide structured carousel format with a dedicated high-converting caption.
   */
  async summarizeForCarousel(articleText: string, title?: string): Promise<CarouselSummary> {
    if (!this.client) {
      console.log("[GeminiProvider] Using heuristic fallback summarizer (Offline/Mock API key)");
      return this.heuristicCarouselSummary(articleText, title);
    }

    const prompt = `You are a top 1% content creator and copywriter on LinkedIn and Twitter.
Transform the following article into a high-converting 5 to 6 slide carousel deck AND write an engaging, human-sounding social media post caption.

Article Title: ${title || "Untitled Article"}
Article Content:
${articleText.slice(0, 12000)}

Requirements:
1. postCaption: Write a compelling LinkedIn post (3–5 paragraphs with clean whitespace, no fluff, a strong scroll-stopping first sentence, 3 bulleted key takeaways, and a call-to-action inviting the reader to swipe the carousel). DO NOT repeat raw photo captions or bylines.
2. hookAngle: A punchy 1-sentence summary of the main angle/hook.
3. slides: Return EXACTLY 5 to 6 slides in logical narrative flow:
   - Slide 1: HOOK (Attention-grabbing headline <= 8 words, punchy subtext <= 25 words).
   - Slides 2 to 4/5: INSIGHT (High-impact key takeaways, max 8 words headline, max 30 words body).
   - Final Slide: CTA (Call-to-action encouraging saving, sharing, or discussing).
4. visualSearchKeywords: 2 to 3 aesthetic, atmospheric keywords (e.g. ["minimalist architecture", "dark abstract neon", "modern workspace"]) suitable for finding high-quality stock photo backgrounds.
5. suggestedHashtags: 3 to 5 relevant industry hashtags (e.g. ["#ContentMarketing", "#Productivity", "#AI"]).

Output MUST strictly be valid JSON matching this schema:
{
  "hookAngle": "string explaining the angle",
  "postCaption": "string with well-formatted post copy including line breaks",
  "slides": [
    {
      "slide_index": 1,
      "headline": "string (max 8 words)",
      "body": "string (max 30 words)",
      "slide_type": "HOOK" | "INSIGHT" | "CTA"
    }
  ],
  "visualSearchKeywords": ["string", "string"],
  "suggestedHashtags": ["#tag1", "#tag2", "#tag3"]
}`;

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });

      const responseText = response.text || "";
      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed: CarouselSummary = JSON.parse(cleaned);

      // Validate slides format
      if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        throw new Error("Invalid slides array received from Gemini");
      }

      // Ensure slide indices and types are normalized
      parsed.slides = parsed.slides.map((s, idx) => ({
        slide_index: idx + 1,
        headline: s.headline || `Key Takeaway #${idx + 1}`,
        body: s.body || "",
        slide_type: idx === 0 ? "HOOK" : idx === parsed.slides.length - 1 ? "CTA" : (s.slide_type || "INSIGHT"),
      }));

      return parsed;
    } catch (error) {
      console.error("[GeminiProvider] generateContent failed, using heuristic fallback:", error);
      return this.heuristicCarouselSummary(articleText, title);
    }
  }

  /**
   * Summarizes an article for a single punchy social quote card and caption.
   */
  async summarizeForSingleCard(articleText: string, title?: string): Promise<SingleCardSummary> {
    if (!this.client) {
      return this.heuristicSingleCardSummary(articleText, title);
    }

    const prompt = `You are an expert social media copywriter.
Distill the core thesis of the following article into a single powerful visual card headline and a viral LinkedIn/Twitter caption.

Article Title: ${title || "Untitled Article"}
Article Content:
${articleText.slice(0, 10000)}

Requirements:
1. headline: High-impact punchy takeaway (max 12 words).
2. body: Supporting excerpt or quote (max 30 words).
3. postCaption: Compelling 3-4 sentence social media caption formatted with line breaks.
4. hashtags: 3 to 5 trending hashtags.
5. visualSearchKeywords: 2 to 3 atmospheric visual background search keywords.

Output MUST strictly be valid JSON:
{
  "headline": "string",
  "body": "string",
  "postCaption": "string",
  "hashtags": ["#tag1", "#tag2"],
  "visualSearchKeywords": ["string", "string"]
}`;

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });

      const responseText = response.text || "";
      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("[GeminiProvider] Single card generation failed, using heuristic fallback:", error);
      return this.heuristicSingleCardSummary(articleText, title);
    }
  }

  /**
   * Intelligent heuristic rule-based summarizer for offline development and testing.
   */
  private heuristicCarouselSummary(articleText: string, title?: string): CarouselSummary {
    const rawParagraphs = articleText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(
        (p) =>
          p.length > 50 &&
          !p.startsWith("#") &&
          !p.toLowerCase().includes("getty images") &&
          !p.toLowerCase().includes("reuters") &&
          !p.toLowerCase().includes("afp") &&
          !p.toLowerCase().includes("photo by") &&
          !p.toLowerCase().includes("hours ago") &&
          !p.toLowerCase().includes("minutes ago")
      );

    const effectiveTitle = title || rawParagraphs[0]?.slice(0, 60) || "Mastering Content Repurposing";
    const hookBody = rawParagraphs[0]?.slice(0, 160) || "Discover how to distill long-form ideas into high-converting visual slide decks in seconds.";

    const slides = [
      {
        slide_index: 1,
        headline: effectiveTitle.slice(0, 50),
        body: hookBody,
        slide_type: "HOOK" as const,
      },
      {
        slide_index: 2,
        headline: "1. The Power of Micro-Content",
        body: (rawParagraphs[1] || "Readers scan before they commit. Breaking complex essays into visual slide bite-sized insights multiplies retention by 4x.").slice(0, 160),
        slide_type: "INSIGHT" as const,
      },
      {
        slide_index: 3,
        headline: "2. Strategic Visual Hierarchy",
        body: (rawParagraphs[2] || "Pair high-contrast headlines with clean typography and subtle background imagery to create a scroll-stopping visual hook.").slice(0, 160),
        slide_type: "INSIGHT" as const,
      },
      {
        slide_index: 4,
        headline: "3. Frictionless Distribution",
        body: (rawParagraphs[3] || "Repurpose once, publish everywhere. Export directly to multi-page LinkedIn PDFs and Instagram carousels with automated brand styling.").slice(0, 160),
        slide_type: "INSIGHT" as const,
      },
      {
        slide_index: 5,
        headline: "Save This For Your Next Post",
        body: "Swipe through whenever you draft new content. Follow for more actionable guides on scaling your organic audience.",
        slide_type: "CTA" as const,
      },
    ];

    const postCaption = `💡 ${effectiveTitle}\n\nMost readers don't have 20 minutes to read long-form articles—they want the core insights fast.\n\nHere are 3 key takeaways distilled into a visual breakdown:\n\n• ${slides[1].headline}: ${slides[1].body.slice(0, 90)}...\n• ${slides[2].headline}: ${slides[2].body.slice(0, 90)}...\n• ${slides[3].headline}: ${slides[3].body.slice(0, 90)}...\n\nSwipe through the carousel presentation below for the full visual breakdown! 👇`;

    return {
      hookAngle: `Key insights on ${effectiveTitle.slice(0, 45)}`,
      postCaption,
      slides,
      visualSearchKeywords: ["modern abstract dark neon", "minimalist architecture workspace", "geometric gradient"],
      suggestedHashtags: ["#ContentMarketing", "#RepurposeAI", "#GrowthStrategy", "#LinkedInTips"],
    };
  }

  private heuristicSingleCardSummary(articleText: string, title?: string): SingleCardSummary {
    const effectiveTitle = title || "The Single Biggest Content Mistake Founders Make";
    return {
      headline: effectiveTitle.slice(0, 60),
      body: "Creating great content is only 20% of the battle. Distribution and visual repurposing drive the other 80%.",
      postCaption: `Most writers spend 10+ hours creating content that only gets seen once.\n\nHere is how top creators repurpose a single article into viral LinkedIn carousels, Twitter cards, and newsletters without rebuilding from scratch.`,
      hashtags: ["#ContentStrategy", "#Repurposing", "#AudienceGrowth"],
      visualSearchKeywords: ["dark gradient abstract", "minimalist clean tech"],
    };
  }
}

// Export singleton instance
export const geminiProvider = new GeminiProvider();
