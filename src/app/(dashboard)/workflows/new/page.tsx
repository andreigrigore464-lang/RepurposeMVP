"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GitFork,
  ArrowLeft,
  Rss,
  Globe,
  Layers,
  Sparkles,
  ImageIcon,
  CheckCircle2,
  ShieldAlert,
  Sliders,
  Play,
  ArrowRight,
  Check,
  Info,
  Palette,
  Eye,
  RefreshCw,
  Send,
  Zap,
} from "lucide-react";

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface TemplateOption {
  id: string;
  name: string;
  templatedTemplateId: string;
  previewImageUrl: string;
  aspectRatio: string;
  hasBackgroundPlaceholder?: boolean;
}

export default function NewWorkflowPage() {
  const router = useRouter();

  // Templates from API
  const [userTemplates, setUserTemplates] = useState<TemplateOption[]>([]);
  const [starterTemplates, setStarterTemplates] = useState<TemplateOption[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Workflow Form State
  const [name, setName] = useState("Automated Blog to LinkedIn Carousel");
  const [sourcePlatform, setSourcePlatform] = useState<"BLOG_RSS" | "CUSTOM_URL">("BLOG_RSS");
  const [sourceRssFeedUrl, setSourceRssFeedUrl] = useState("https://techcrunch.com/feed/");
  const [customArticleUrl, setCustomArticleUrl] = useState("https://example.com/scale-content-repurposing");
  const [destinationPlatform, setDestinationPlatform] = useState<"LINKEDIN" | "INSTAGRAM" | "TWITTER_X">("LINKEDIN");
  const [outputFormat, setOutputFormat] = useState<"MULTI_SLIDE_CAROUSEL" | "SINGLE_IMAGE_CARD">("MULTI_SLIDE_CAROUSEL");
  const [brandTemplateId, setBrandTemplateId] = useState<string>("tmpl_hook_square_01");
  const [backgroundStrategy, setBackgroundStrategy] = useState<"ARTICLE_IMAGE_FIRST" | "STOCK_SEARCH_ONLY" | "SOLID_COLOR_ONLY">("ARTICLE_IMAGE_FIRST");
  const [isAutopilot, setIsAutopilot] = useState<boolean>(false);
  const [minWordCount, setMinWordCount] = useState<number>(150);
  const [includeKeywords, setIncludeKeywords] = useState<string>("");
  const [excludeKeywords, setExcludeKeywords] = useState<string>("");

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Active step navigation (1: Source, 2: Destination & Format, 3: Template & Visuals, 4: Publishing & Guard, 5: Review)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Auto-name generation when settings change
  const handleAutoName = () => {
    const src = sourcePlatform === "BLOG_RSS" ? "RSS Feed" : "Article URL";
    const dest =
      destinationPlatform === "LINKEDIN"
        ? "LinkedIn"
        : destinationPlatform === "INSTAGRAM"
        ? "Instagram"
        : "Twitter / X";
    const fmt = outputFormat === "MULTI_SLIDE_CAROUSEL" ? "Carousel Deck" : "Social Card";
    setName(`${src} to ${dest} ${fmt}`);
  };

  // Fetch templates on load
  useEffect(() => {
    let isMounted = true;
    fetch("/api/v1/templates")
      .then((res) => (res.ok ? res.json() : { templates: [], starterTemplates: [] }))
      .then((data) => {
        if (!isMounted) return;
        const uTmpls: TemplateOption[] = data.templates || [];
        const sTmpls: TemplateOption[] = data.starterTemplates || [];
        setUserTemplates(uTmpls);
        setStarterTemplates(sTmpls);

        // Select first available template
        const all = [...uTmpls, ...sTmpls];
        if (all.length > 0 && !brandTemplateId) {
          setBrandTemplateId(all[0].templatedTemplateId);
        }
        setIsLoadingTemplates(false);
      })
      .catch((err) => {
        console.error("Failed to load templates:", err);
        if (isMounted) setIsLoadingTemplates(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const allAvailableTemplates = [
    ...userTemplates,
    ...starterTemplates.filter(
      (st) => !userTemplates.some((ut) => ut.templatedTemplateId === st.templatedTemplateId)
    ),
  ];

  // Information Density Guard evaluation
  const isDensityWarning =
    outputFormat === "MULTI_SLIDE_CAROUSEL" && minWordCount < 100;

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent, runTestImmediately = false) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const filterRules = {
      min_word_count: minWordCount,
      keywords_include: includeKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      keywords_exclude: excludeKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    };

    const payload = {
      name: name.trim() || "Untitled Pipeline",
      sourcePlatform,
      sourceRssFeedUrl: sourcePlatform === "BLOG_RSS" ? sourceRssFeedUrl : customArticleUrl,
      destinationPlatform,
      brandTemplateId,
      outputFormat,
      backgroundStrategy,
      isAutopilot,
      filterRules,
      isActive: true,
    };

    try {
      const res = await fetch("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create workflow");
      }

      const data = await res.json();
      const createdWorkflow = data.workflow;

      if (runTestImmediately && createdWorkflow?.id) {
        // Redirect to workflows list with run trigger
        router.push(`/workflows?runId=${createdWorkflow.id}`);
      } else {
        router.push("/workflows");
      }
    } catch (err) {
      console.error("Workflow creation error:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to create workflow");
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="space-y-1">
          <Link
            href="/workflows"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workflows</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-emerald-500/20">
              <GitFork className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Dynamic Workflow Studio
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Configure continuous ingestion sources, visual templates, and autonomous publishing rules.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAutoName}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="Auto-suggest name from configuration"
          >
            ✨ Auto Name
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={(e) => handleSubmit(e, false)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating Pipeline...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Step Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { step: 1, title: "1. Input Source", desc: "RSS or Article URL" },
          { step: 2, title: "2. Platform & Format", desc: "Density & Layout" },
          { step: 3, title: "3. Template & Style", desc: "Visuals & Strategy" },
          { step: 4, title: "4. Automation & Guard", desc: "Approval & Filters" },
        ].map((s) => (
          <button
            key={s.step}
            type="button"
            onClick={() => setActiveStep(s.step)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeStep === s.step
                ? "bg-zinc-900 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 text-zinc-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold ${
                  activeStep === s.step ? "text-emerald-400" : "text-zinc-300"
                }`}
              >
                {s.title}
              </span>
              {activeStep > s.step && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <span className="text-[11px] text-zinc-500 block mt-0.5">{s.desc}</span>
          </button>
        ))}
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Workflow Name Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <label className="text-xs font-semibold text-zinc-200 block">
            Workflow Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm text-zinc-100 font-medium focus:outline-none focus:border-emerald-500"
            placeholder="e.g. TechCrunch Ingestion to LinkedIn Carousel"
          />
        </div>

        {/* STEP 1: INPUT SOURCE */}
        {activeStep === 1 && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Step 1: Choose Ingestion Source</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Select how new articles and content will be ingested into this repurposing pipeline.
              </p>
            </div>

            {/* Source Platform Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setSourcePlatform("BLOG_RSS")}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  sourcePlatform === "BLOG_RSS"
                    ? "bg-emerald-950/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                    : "bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600 text-zinc-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <Rss className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">Blog / News RSS Feed</h3>
                      <p className="text-[11px] text-zinc-400">Continuous automated ingestion</p>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      sourcePlatform === "BLOG_RSS"
                        ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                        : "border-zinc-600"
                    }`}
                  >
                    {sourcePlatform === "BLOG_RSS" && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                  </div>
                </div>
                <p className="text-xs text-zinc-400">
                  Monitors an RSS/Atom feed periodically and triggers multi-slide repurposing whenever a new post is published.
                </p>
              </div>

              <div
                onClick={() => setSourcePlatform("CUSTOM_URL")}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  sourcePlatform === "CUSTOM_URL"
                    ? "bg-emerald-950/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                    : "bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600 text-zinc-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">Single Article URL</h3>
                      <p className="text-[11px] text-zinc-400">On-demand / One-off repurposing</p>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      sourcePlatform === "CUSTOM_URL"
                        ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                        : "border-zinc-600"
                    }`}
                  >
                    {sourcePlatform === "CUSTOM_URL" && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                  </div>
                </div>
                <p className="text-xs text-zinc-400">
                  Use this template to manually paste any article link and test the pipeline on-demand.
                </p>
              </div>
            </div>

            {/* URL Input based on source */}
            {sourcePlatform === "BLOG_RSS" ? (
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200">
                    RSS Feed URL
                  </label>
                  <span className="text-[11px] text-zinc-500">Supports RSS 2.0 & Atom feeds</span>
                </div>
                <input
                  type="url"
                  required
                  value={sourceRssFeedUrl}
                  onChange={(e) => setSourceRssFeedUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  placeholder="https://techcrunch.com/feed/"
                />
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 flex-wrap pt-1">
                  <span>Quick samples:</span>
                  <button
                    type="button"
                    onClick={() => setSourceRssFeedUrl("https://techcrunch.com/feed/")}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                  >
                    TechCrunch
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceRssFeedUrl("https://hnrss.org/frontpage")}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                  >
                    Hacker News
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceRssFeedUrl("https://feeds.feedburner.com/oreilly/radar/atom")}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                  >
                    O&apos;Reilly Media
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <label className="text-xs font-semibold text-zinc-200 block">
                  Default Target Article URL
                </label>
                <input
                  type="url"
                  required
                  value={customArticleUrl}
                  onChange={(e) => setCustomArticleUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  placeholder="https://example.com/posts/scale-content-repurposing"
                />
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl cursor-pointer"
              >
                <span>Continue to Platform & Format</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OUTPUT PLATFORM & FORMAT (WITH INFORMATION DENSITY GUARD) */}
        {activeStep === 2 && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Step 2: Output Platform & Format</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Choose the social media destination and output layout structure.
              </p>
            </div>

            {/* Destination Platform */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300 block">
                Destination Platform
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: "LINKEDIN",
                    name: "LinkedIn Carousel",
                    icon: LinkedinIcon,
                    desc: "Multi-slide PDF Document Carousel + Copy",
                    color: "text-blue-400",
                    bg: "bg-blue-500/10 border-blue-500/30",
                  },
                  {
                    id: "INSTAGRAM",
                    name: "Instagram Carousel",
                    icon: InstagramIcon,
                    desc: "1:1 / 4:5 Swipeable Image Deck + Caption",
                    color: "text-pink-400",
                    bg: "bg-pink-500/10 border-pink-500/30",
                  },
                  {
                    id: "TWITTER_X",
                    name: "X / Twitter Card",
                    icon: TwitterIcon,
                    desc: "High-impact Quote Card or Thread Breakdown",
                    color: "text-sky-400",
                    bg: "bg-sky-500/10 border-sky-500/30",
                  },
                ].map((p) => {
                  const Icon = p.icon;
                  const isSelected = destinationPlatform === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setDestinationPlatform(p.id as "LINKEDIN" | "INSTAGRAM" | "TWITTER_X")}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? "bg-zinc-800/80 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${p.bg} ${p.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-zinc-200">{p.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-zinc-400">{p.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Output Format */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <label className="text-xs font-semibold text-zinc-300 block">
                Output Presentation Format
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setOutputFormat("MULTI_SLIDE_CAROUSEL")}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                    outputFormat === "MULTI_SLIDE_CAROUSEL"
                      ? "bg-emerald-950/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                      : "bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600 text-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-zinc-200">
                        Multi-Slide Carousel (5–6 Slides)
                      </span>
                    </div>
                    {outputFormat === "MULTI_SLIDE_CAROUSEL" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Generates Hook Slide, 3-4 Insight Takeaways, and a strong Call-To-Action slide + stitches a LinkedIn PDF.
                  </p>
                </div>

                <div
                  onClick={() => setOutputFormat("SINGLE_IMAGE_CARD")}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                    outputFormat === "SINGLE_IMAGE_CARD"
                      ? "bg-emerald-950/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                      : "bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600 text-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-zinc-200">
                        Single Image Card / Quote (1 Slide)
                      </span>
                    </div>
                    {outputFormat === "SINGLE_IMAGE_CARD" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">
                        Compact
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Distills a single high-impact quote, insight, or summary graphic for Twitter, LinkedIn posts, and image shares.
                  </p>
                </div>
              </div>
            </div>

            {/* Information Density Guard Banner */}
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200">
                  Information Density Guard
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Carousels require at least 150 words of rich content to generate compelling takeaways and hook variations. For concise announcements, tweets, or short quotes, Single Image Card format is recommended.
              </p>
              {isDensityWarning && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    Warning: Minimum word count is currently set below 100 words. Multi-slide carousels might lack detail with very short inputs.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl cursor-pointer"
              >
                <span>Continue to Template & Style</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TEMPLATE & BACKGROUND STRATEGY */}
        {activeStep === 3 && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Step 3: Template & Background Image Strategy</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Choose the visual Templated.io canvas layout and background asset resolution rule.
              </p>
            </div>

            {/* Template Selector Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Select Brand / Slide Template
                </label>
                <Link
                  href="/templates"
                  target="_blank"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Manage Templates →
                </Link>
              </div>

              {isLoadingTemplates ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                  Loading saved templates...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {allAvailableTemplates.map((tmpl) => {
                    const isSelected = brandTemplateId === tmpl.templatedTemplateId;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => setBrandTemplateId(tmpl.templatedTemplateId)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? "bg-zinc-800/90 border-emerald-500 ring-2 ring-emerald-500/20"
                            : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={tmpl.previewImageUrl}
                            alt={tmpl.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 text-zinc-200 border border-white/10 backdrop-blur-sm">
                            {tmpl.aspectRatio}
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-lg">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-zinc-200 truncate">
                            {tmpl.name}
                          </h4>
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            {tmpl.templatedTemplateId}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Background Strategy Selector (Task 3.3) */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <label className="text-xs font-semibold text-zinc-300 block">
                Background Image Strategy Selector
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: "ARTICLE_IMAGE_FIRST",
                    name: "Article Image First",
                    desc: "Uses the article's hero image if available, otherwise searches stock via AI keywords.",
                    icon: ImageIcon,
                    badge: "Adaptive",
                  },
                  {
                    id: "STOCK_SEARCH_ONLY",
                    name: "Stock Search Only",
                    desc: "Searches Unsplash using AI keywords extracted from article themes.",
                    icon: Sparkles,
                    badge: "AI Stock",
                  },
                  {
                    id: "SOLID_COLOR_ONLY",
                    name: "Solid Brand Color Only",
                    desc: "Disables background photos, uses clean template theme and brand kit colors.",
                    icon: Palette,
                    badge: "Minimalist",
                  },
                ].map((strat) => {
                  const isSelected = backgroundStrategy === strat.id;
                  const Icon = strat.icon;
                  return (
                    <div
                      key={strat.id}
                      onClick={() => setBackgroundStrategy(strat.id as "ARTICLE_IMAGE_FIRST" | "STOCK_SEARCH_ONLY" | "SOLID_COLOR_ONLY")}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? "bg-zinc-800/80 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-zinc-200">{strat.name}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                          {strat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{strat.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl cursor-pointer"
              >
                <span>Continue to Automation Settings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PUBLISHING MODE & FILTER RULES */}
        {activeStep === 4 && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Step 4: Publishing Mode & Trigger Settings</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Configure safety approval gates, minimum word count filters, and keyword triggers.
              </p>
            </div>

            {/* Publishing Mode Radio (Task 3.4) */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300 block">
                Publishing Mode Gate
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setIsAutopilot(false)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                    !isAutopilot
                      ? "bg-emerald-950/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                      : "bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600 text-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-zinc-200">
                        Send to Approval Inbox (Default)
                      </span>
                    </div>
                    {!isAutopilot && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                        Safe Review
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Generated carousels and captions wait in the Approval Inbox for one-click human review and quick text adjustments before posting.
                  </p>
                </div>

                <div
                  onClick={() => setIsAutopilot(true)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                    isAutopilot
                      ? "bg-amber-950/20 border-amber-500 text-white shadow-md shadow-amber-500/10"
                      : "bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600 text-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-zinc-200">
                        Autopilot (Post Directly)
                      </span>
                    </div>
                    {isAutopilot && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                        Autonomous
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Bypasses human review and automatically stages/publishes drafts to social destinations immediately after generation.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Rules (Min word count & keywords) */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">
                    Minimum Word Count Filter:{" "}
                    <span className="text-emerald-400 font-mono font-bold">{minWordCount} words</span>
                  </label>
                  <span className="text-[11px] text-zinc-500">Filters out stubs & short news flashes</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={minWordCount}
                  onChange={(e) => setMinWordCount(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>50 words</span>
                  <span>150 words (Default)</span>
                  <span>500 words</span>
                  <span>1000 words</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Must Include Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    value={includeKeywords}
                    onChange={(e) => setIncludeKeywords(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. AI, SaaS, Engineering (comma separated)"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Exclude Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    value={excludeKeywords}
                    onChange={(e) => setExcludeKeywords(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. sponsor, politics, crypto (comma separated)"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? "Saving..." : "Create Automation Workflow"}
              </button>
            </div>
          </div>
        )}

        {/* Live Summary Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/20 border border-zinc-800 space-y-3">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Pipeline Configuration Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/40">
              <span className="text-[10px] text-zinc-500 block">Source Platform</span>
              <span className="font-semibold text-zinc-200">
                {sourcePlatform === "BLOG_RSS" ? "RSS Feed" : "Custom URL"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/40">
              <span className="text-[10px] text-zinc-500 block">Destination</span>
              <span className="font-semibold text-zinc-200">{destinationPlatform}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/40">
              <span className="text-[10px] text-zinc-500 block">Format & Strategy</span>
              <span className="font-semibold text-zinc-200">
                {outputFormat === "MULTI_SLIDE_CAROUSEL" ? "Carousel" : "Single Card"} ({backgroundStrategy})
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/40">
              <span className="text-[10px] text-zinc-500 block">Publishing Gate</span>
              <span className="font-semibold text-emerald-400">
                {isAutopilot ? "Autopilot (Direct)" : "Approval Inbox"}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
