"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Rss,
  Globe,
  Layers,
  Sparkles,
  ImageIcon,
  CheckCircle2,
  ShieldAlert,
  Sliders,
  ArrowRight,
  Check,
  Info,
  Palette,
  Eye,
  RefreshCw,
  Send,
  Zap,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import { isTemplateConfigured, DynamicTemplateConfig, isMockTemplate } from "@/lib/templated";

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
  layerMappings?: DynamicTemplateConfig | Record<string, unknown> | null;
  dynamicConfig?: DynamicTemplateConfig;
  isConfigured?: boolean;
}

export default function NewWorkflowPage() {
  const router = useRouter();

  const [userTemplates, setUserTemplates] = useState<TemplateOption[]>([]);
  const [starterTemplates, setStarterTemplates] = useState<TemplateOption[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

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

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [unconfiguredTemplatePrompt, setUnconfiguredTemplatePrompt] = useState<TemplateOption | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);

  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem("repurpose_workflow_draft");
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.name) setName(d.name);
        if (d.sourcePlatform) setSourcePlatform(d.sourcePlatform);
        if (d.sourceRssFeedUrl) setSourceRssFeedUrl(d.sourceRssFeedUrl);
        if (d.customArticleUrl) setCustomArticleUrl(d.customArticleUrl);
        if (d.destinationPlatform) setDestinationPlatform(d.destinationPlatform);
        if (d.outputFormat) setOutputFormat(d.outputFormat);
        if (d.brandTemplateId) setBrandTemplateId(d.brandTemplateId);
        if (d.backgroundStrategy) setBackgroundStrategy(d.backgroundStrategy);
        if (typeof d.isAutopilot === "boolean") setIsAutopilot(d.isAutopilot);
        if (d.minWordCount) setMinWordCount(d.minWordCount);
        if (d.includeKeywords) setIncludeKeywords(d.includeKeywords);
        if (d.excludeKeywords) setExcludeKeywords(d.excludeKeywords);
        if (d.activeStep) setActiveStep(d.activeStep);
      }
    } catch (e) {
      console.warn("Could not restore workflow draft", e);
    }
  }, []);

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

        const all = [
          ...uTmpls,
          ...sTmpls.filter((st) => !uTmpls.some((ut) => ut.templatedTemplateId === st.templatedTemplateId)),
        ];

        if (all.length > 0 && (!brandTemplateId || !all.some((t) => t.templatedTemplateId === brandTemplateId))) {
          const firstConfigured = all.find((t) => isTemplateConfigured(t)) || all[0];
          setBrandTemplateId(firstConfigured.templatedTemplateId);
        }
        setIsLoadingTemplates(false);
      })
      .catch((err) => {
        console.error("Failed to load templates:", err);
        if (!isMounted) setIsLoadingTemplates(false);
      });

    return () => {
      isMounted = false;
    };
  }, [brandTemplateId]);

  const allAvailableTemplates = [
    ...userTemplates,
    ...starterTemplates.filter(
      (st) => !userTemplates.some((ut) => ut.templatedTemplateId === st.templatedTemplateId)
    ),
  ];

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

  const handleRouteToConfigureTemplate = (tmpl: TemplateOption) => {
    const draft = {
      name,
      sourcePlatform,
      sourceRssFeedUrl,
      customArticleUrl,
      destinationPlatform,
      outputFormat,
      brandTemplateId: tmpl.templatedTemplateId,
      backgroundStrategy,
      isAutopilot,
      minWordCount,
      includeKeywords,
      excludeKeywords,
      activeStep: 3,
    };
    try {
      sessionStorage.setItem("repurpose_workflow_draft", JSON.stringify(draft));
    } catch (e) {
      console.warn("Could not save workflow draft", e);
    }
    router.push(`/templates?configure=${encodeURIComponent(tmpl.templatedTemplateId)}&returnTo=/workflows/new`);
  };

  const handleSelectTemplate = (tmpl: TemplateOption) => {
    if (!isTemplateConfigured(tmpl)) {
      setUnconfiguredTemplatePrompt(tmpl);
      return;
    }
    setBrandTemplateId(tmpl.templatedTemplateId);
  };

  const handleContinueFromStep3 = () => {
    const current = allAvailableTemplates.find((t) => t.templatedTemplateId === brandTemplateId);
    if (current && !isTemplateConfigured(current)) {
      setUnconfiguredTemplatePrompt(current);
      return;
    }
    setActiveStep(4);
  };

  const isDensityWarning =
    outputFormat === "MULTI_SLIDE_CAROUSEL" && minWordCount < 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const currentTmpl = allAvailableTemplates.find((t) => t.templatedTemplateId === brandTemplateId);
    if (currentTmpl && !isTemplateConfigured(currentTmpl)) {
      setIsSaving(false);
      setUnconfiguredTemplatePrompt(currentTmpl);
      return;
    }

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
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create workflow");
      }

      try {
        sessionStorage.removeItem("repurpose_workflow_draft");
      } catch {
        // ignore
      }

      router.push("/workflows");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create workflow pipeline";
      setSaveError(msg);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Unconfigured Template Prompt Modal */}
      {unconfiguredTemplatePrompt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <Layers className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">
                Template Requires Layer Configuration
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-200">{unconfiguredTemplatePrompt.name}</span> does not have active layer mappings yet. Automated workflows require mapped Headline and Body layers to render slide visuals.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Progress Lost</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Your workflow draft will be safely saved in memory. You will be redirected right back after mapping layers in the Template Studio.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleRouteToConfigureTemplate(unconfiguredTemplatePrompt)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-full shadow-lg shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Configure Template Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setUnconfiguredTemplatePrompt(null)}
                className="w-full py-2 px-4 glass-pill hover:bg-white/10 text-slate-300 font-medium text-xs rounded-full transition-colors cursor-pointer"
              >
                Select a Different Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-4">
          <Link
            href="/workflows"
            className="p-2 rounded-xl glass-pill hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Create Repurposing Workflow</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-cyan-300 text-[11px] font-mono border border-blue-500/30">
                Gemini AI Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Build an automated pipeline that turns long-form articles into high-converting social carousels.
            </p>
          </div>
        </div>
      </div>

      {/* Step Progress Stepper */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, label: "Content Source" },
          { num: 2, label: "Platform & Format" },
          { num: 3, label: "Template & Style" },
          { num: 4, label: "Gate & Triggers" },
        ].map((s) => {
          const isDone = activeStep > s.num;
          const isCurrent = activeStep === s.num;
          return (
            <div
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                isCurrent
                  ? "bg-blue-600/20 border-blue-500/60 text-white shadow-lg shadow-blue-500/10"
                  : isDone
                  ? "bg-white/[0.03] border-blue-500/30 text-slate-200"
                  : "bg-white/[0.01] border-white/[0.06] text-slate-500"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent
                    ? "bg-gradient-to-r from-blue-600 to-cyan-400 text-white shadow-sm"
                    : isDone
                    ? "bg-blue-500/20 text-cyan-300 border border-blue-500/40"
                    : "bg-white/5 text-slate-500"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className="text-xs font-semibold truncate">{s.label}</span>
            </div>
          );
        })}
      </div>

      {saveError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Workflow Builder Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: CONTENT SOURCE */}
        {activeStep === 1 && (
          <div className="p-6 rounded-3xl glass-panel space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Step 1: Content Source &amp; Workflow Name</span>
              </h2>
              <p className="text-xs text-slate-400">
                Specify where the AI engine monitors new articles or fetch directly from a target URL.
              </p>
            </div>

            {/* Workflow Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Workflow Pipeline Name</label>
                <button
                  type="button"
                  onClick={handleAutoName}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Name</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#151824] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                placeholder="e.g. Daily TechCrunch to LinkedIn Carousel"
              />
            </div>

            {/* Source Platform Selector */}
            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              <label className="text-xs font-semibold text-slate-300 block">
                Trigger Ingestion Method
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setSourcePlatform("BLOG_RSS")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                    sourcePlatform === "BLOG_RSS"
                      ? "bg-blue-950/40 border-blue-500/80 text-white shadow-lg shadow-blue-500/10"
                      : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Rss className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Blog RSS / Atom Feed (Automated Polling)
                      </span>
                    </div>
                    {sourcePlatform === "BLOG_RSS" && (
                      <Check className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Monitors your blog or news feed periodically. When a new article publishes, RepurposeAI processes it automatically.
                  </p>
                </div>

                <div
                  onClick={() => setSourcePlatform("CUSTOM_URL")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                    sourcePlatform === "CUSTOM_URL"
                      ? "bg-blue-950/40 border-blue-500/80 text-white shadow-lg shadow-blue-500/10"
                      : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Direct Article URL (On-Demand / Manual)
                      </span>
                    </div>
                    {sourcePlatform === "CUSTOM_URL" && (
                      <Check className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Run on a specific URL or article whenever you want on demand.
                  </p>
                </div>
              </div>
            </div>

            {/* Input URL Field */}
            {sourcePlatform === "BLOG_RSS" ? (
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">
                    RSS Feed URL
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">RSS 2.0 &amp; Atom</span>
                </div>
                <input
                  type="url"
                  required
                  value={sourceRssFeedUrl}
                  onChange={(e) => setSourceRssFeedUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#151824] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  placeholder="https://techcrunch.com/feed/"
                />
                <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap pt-1">
                  <span>Quick samples:</span>
                  <button
                    type="button"
                    onClick={() => setSourceRssFeedUrl("https://techcrunch.com/feed/")}
                    className="px-2.5 py-0.5 rounded-full glass-pill hover:bg-white/10 text-slate-300 text-[10px]"
                  >
                    TechCrunch
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceRssFeedUrl("https://hnrss.org/frontpage")}
                    className="px-2.5 py-0.5 rounded-full glass-pill hover:bg-white/10 text-slate-300 text-[10px]"
                  >
                    Hacker News
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <label className="text-xs font-semibold text-slate-200 block">
                  Default Target Article URL
                </label>
                <input
                  type="url"
                  required
                  value={customArticleUrl}
                  onChange={(e) => setCustomArticleUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#151824] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  placeholder="https://example.com/posts/scale-content-repurposing"
                />
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <span>Continue to Platform &amp; Format</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OUTPUT PLATFORM & FORMAT */}
        {activeStep === 2 && (
          <div className="p-6 rounded-3xl glass-panel space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Step 2: Output Platform &amp; Format</span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose the social media destination and output layout structure.
              </p>
            </div>

            {/* Destination Platform */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
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
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? "bg-blue-950/40 border-blue-500/80 text-white shadow-lg shadow-blue-500/10"
                          : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${p.bg} ${p.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-200">{p.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Output Format */}
            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              <label className="text-xs font-semibold text-slate-300 block">
                Output Presentation Format
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setOutputFormat("MULTI_SLIDE_CAROUSEL")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                    outputFormat === "MULTI_SLIDE_CAROUSEL"
                      ? "bg-blue-950/40 border-blue-500/80 text-white shadow-lg shadow-blue-500/10"
                      : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Multi-Slide Carousel (5–6 Slides)
                      </span>
                    </div>
                    {outputFormat === "MULTI_SLIDE_CAROUSEL" && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 font-semibold border border-blue-500/30">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Generates Hook Slide, 3-4 Insight Takeaways, and a strong Call-To-Action slide + stitches a LinkedIn PDF.
                  </p>
                </div>

                <div
                  onClick={() => setOutputFormat("SINGLE_IMAGE_CARD")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                    outputFormat === "SINGLE_IMAGE_CARD"
                      ? "bg-blue-950/40 border-blue-500/80 text-white shadow-lg shadow-blue-500/10"
                      : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Single Image Card / Quote (1 Slide)
                      </span>
                    </div>
                    {outputFormat === "SINGLE_IMAGE_CARD" && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                        Compact
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Distills a single high-impact quote, insight, or summary graphic for Twitter, LinkedIn posts, and image shares.
                  </p>
                </div>
              </div>
            </div>

            {/* Information Density Guard Banner */}
            <div className="p-4 rounded-2xl glass-panel-elevated space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">
                  Information Density Guard
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Carousels require at least 150 words of rich content to generate compelling takeaways. For short announcements or quotes, Single Image Card format is recommended.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 glass-pill hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-full cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <span>Continue to Template &amp; Style</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TEMPLATE & BACKGROUND STRATEGY */}
        {activeStep === 3 && (
          <div className="p-6 rounded-3xl glass-panel space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>Step 3: Template &amp; Background Image Strategy</span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose a configured visual template. Only templates with confirmed layer mappings (green badge) can be used in workflows.
              </p>
            </div>

            {/* Template Selector Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Select Brand / Slide Template
                </label>
                <Link
                  href="/templates"
                  target="_blank"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Manage Templates in Studio &rarr;
                </Link>
              </div>

              {isLoadingTemplates ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                  Loading templates...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {allAvailableTemplates.map((tmpl) => {
                    const isSelected = brandTemplateId === tmpl.templatedTemplateId;
                    const isMock = isMockTemplate(tmpl.templatedTemplateId);
                    const isConfig = isTemplateConfigured(tmpl) || isMock;

                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => handleSelectTemplate(tmpl)}
                        className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? "bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-lg"
                            : isMock
                            ? "bg-cyan-950/20 border-dashed border-cyan-500/40 hover:border-cyan-400"
                            : isConfig
                            ? "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]"
                            : "bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50"
                        }`}
                      >
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-[#050608] border border-white/10">
                          {isMock ? (
                            <div className="w-full h-full bg-[#070b14] flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff0a_1px,transparent_1px),linear-gradient(to_bottom,#00ffff0a_1px,transparent_1px)] bg-[size:12px_12px]" />
                              <div className="relative z-10 space-y-1 flex flex-col items-center">
                                <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                                <span className="text-[11px] font-bold text-cyan-300 font-mono">
                                  SIMULATION (0 CREDITS)
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={tmpl.previewImageUrl}
                              alt={tmpl.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (!target.src.includes("templated-assets")) {
                                  target.src = `https://templated-assets.s3.amazonaws.com/public/thumbnail/${tmpl.templatedTemplateId}.webp`;
                                }
                              }}
                            />
                          )}
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold glass-pill text-white shadow-sm font-mono">
                            {tmpl.aspectRatio}
                          </span>

                          {/* Configured Status Badge */}
                          <div className="absolute bottom-2 left-2">
                            {isMock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-[10px] font-bold shadow-md backdrop-blur-sm font-mono">
                                <Sparkles className="w-3 h-3 text-cyan-300" />
                                Zero Credits
                              </span>
                            ) : isConfig ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-emerald-950 text-[10px] font-bold shadow-md backdrop-blur-sm">
                                <Check className="w-3 h-3 stroke-[3]" />
                                Configured
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-bold shadow-md backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Not Configured
                              </span>
                            )}
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-cyan-400 text-cyan-950 flex items-center justify-center shadow-lg">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-bold text-white truncate">
                              {tmpl.name}
                            </h4>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {tmpl.templatedTemplateId}
                            </span>
                            {!isConfig && (
                              <span className="text-[10px] text-rose-400 font-semibold underline">
                                Requires Setup &rarr;
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Background Strategy Selector */}
            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              <label className="text-xs font-semibold text-slate-300 block">
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
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? "bg-blue-950/40 border-blue-500/80 text-white shadow-lg shadow-blue-500/10"
                          : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold text-slate-200">{strat.name}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full glass-pill text-slate-300 font-mono">
                          {strat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{strat.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 glass-pill hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-full cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinueFromStep3}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <span>Continue to Automation Settings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PUBLISHING MODE & FILTER RULES */}
        {activeStep === 4 && (
          <div className="p-6 rounded-3xl glass-panel space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Step 4: Publishing Mode &amp; Trigger Settings</span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure safety approval gates, minimum word count filters, and keyword triggers.
              </p>
            </div>

            {/* Publishing Mode */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Publishing Mode Gate
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setIsAutopilot(false)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                    !isAutopilot
                      ? "bg-blue-950/40 border-blue-500/80 text-white shadow-lg shadow-blue-500/10"
                      : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Send to Approval Inbox (Default)
                      </span>
                    </div>
                    {!isAutopilot && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 font-semibold border border-blue-500/30">
                        Safe Review
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Generated carousels and captions wait in the Approval Inbox for one-click human review and quick text adjustments before posting.
                  </p>
                </div>

                <div
                  onClick={() => setIsAutopilot(true)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                    isAutopilot
                      ? "bg-amber-950/40 border-amber-500/80 text-white shadow-lg shadow-amber-500/10"
                      : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Autopilot (Post Directly)
                      </span>
                    </div>
                    {isAutopilot && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                        Autonomous
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bypasses human review and automatically stages/publishes drafts to social destinations immediately after generation.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Rules */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Minimum Word Count Filter:{" "}
                    <span className="text-cyan-400 font-mono font-bold">{minWordCount} words</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Filters out short stubs</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={minWordCount}
                  onChange={(e) => setMinWordCount(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>50 words</span>
                  <span>150 words (Default)</span>
                  <span>500 words</span>
                  <span>1000 words</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Must Include Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    value={includeKeywords}
                    onChange={(e) => setIncludeKeywords(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151824] border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. AI, SaaS, Engineering (comma separated)"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Exclude Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    value={excludeKeywords}
                    onChange={(e) => setExcludeKeywords(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151824] border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. sponsor, politics, crypto (comma separated)"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 glass-pill hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-full cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? "Saving..." : "Create Automation Workflow"}
              </button>
            </div>
          </div>
        )}

        {/* Live Summary Card */}
        <div className="p-5 rounded-3xl glass-panel space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Pipeline Configuration Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Source Platform</span>
              <span className="font-semibold text-slate-200">
                {sourcePlatform === "BLOG_RSS" ? "RSS Feed" : "Custom URL"}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Destination</span>
              <span className="font-semibold text-slate-200">{destinationPlatform}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Format &amp; Strategy</span>
              <span className="font-semibold text-slate-200">
                {outputFormat === "MULTI_SLIDE_CAROUSEL" ? "Carousel" : "Single Card"}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 block">Publishing Gate</span>
              <span className="font-semibold text-cyan-400">
                {isAutopilot ? "Autopilot (Direct)" : "Approval Inbox"}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
