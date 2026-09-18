export type SlideType = "HOOK" | "INSIGHT" | "CTA";

export interface CarouselSlide {
  slide_index: number;
  headline: string;
  body: string;
  slide_type: SlideType;
  visual_keyword?: string;
  background_image_url?: string | null;
}

export interface CarouselSummary {
  hookAngle: string;
  postCaption?: string;
  slides: CarouselSlide[];
  visualSearchKeywords: string[];
  suggestedHashtags: string[];
}

export interface SingleCardSummary {
  headline: string;
  body: string;
  postCaption: string;
  hashtags: string[];
  visualSearchKeywords: string[];
}

export interface LLMProvider {
  summarizeForCarousel(articleText: string, title?: string): Promise<CarouselSummary>;
  summarizeForSingleCard(articleText: string, title?: string): Promise<SingleCardSummary>;
}
