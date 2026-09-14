"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  GitFork,
  Play,
  Plus,
  Sparkles,
  Layers,
  Download,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  X,
  Trash2,
  ArrowRight,
  ImageIcon,
  Globe,
  Rss,
  Sliders,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
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

interface Workflow {
  id: string;
  name: string;
  isActive: boolean;
  sourcePlatform: string;
  sourceRssFeedUrl?: string | null;
  destinationPlatform: string;
  brandTemplateId?: string | null;
  outputFormat: string;
  backgroundStrategy: string;
  isAutopilot: boolean;
  filterRules?: {
    min_word_count?: number;
    keywords_include?: string[];
    keywords_exclude?: string[];
  };
  createdAt?: string;
  brandTemplate?: {
    id: string;
    name: string;
    previewImageUrl: string;
    aspectRatio: string;
  };
}

interface TemplateOption {
  id: string;
  name: string;
  templatedTemplateId: string;
  previewImageUrl: string;
  aspectRatio: string;
}

interface RenderedSlide {
  slide_index: number;
  headline: string;
  body: string;
  rendered_png_url: string;
  background_image_url?: string | null;
}

interface GenerationResult {
  workflowId?: string | null;
  draft: {
    id: string;
    postTitle: string;
    postCaption: string;
    postHashtags: string[];
    slidesData: RenderedSlide[];
    pdfDocumentUrl?: string | null;
    status: string;
  };
  sourceItem?: {
    id: string;
    title: string;
    url: string;
    wordCount: number;
  };
  timings?: Record<string, number>;
}

function WorkflowsContent() {
  const searchParams = useSearchParams();
  const runIdParam = searchParams.get("runId");

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [userTemplates, setUserTemplates] = useState<TemplateOption[]>([]);
  const [starterTemplates, setStarterTemplates] = useState<TemplateOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search state
  const [filterType, setFilterType] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");

  // Runner Modal State
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [selectedWorkflowForRun, setSelectedWorkflowForRun] = useState<Workflow | null>(null);
  const [testUrlInput, setTestUrlInput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [runStep, setRunStep] = useState<number>(0);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Quick Standalone Runner Data (for instant custom repurposing)
  const [customRunnerData, setCustomRunnerData] = useState({
    articleUrl: "https://example.com/scale-content-repurposing",
    templateId: "tmpl_hook_square_01",
    backgroundStrategy: "ARTICLE_IMAGE_FIRST",
    outputFormat: "MULTI_SLIDE_CAROUSEL",
    destinationPlatform: "LINKEDIN",
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [wfRes, tmplRes] = await Promise.all([
        fetch("/api/v1/workflows"),
        fetch("/api/v1/templates"),
      ]);

      if (wfRes.ok) {
        const wfData = await wfRes.json();
        const rawWfs: Workflow[] = wfData.workflows || [];
        const uniqueWfs = Array.from(new Map(rawWfs.map((w) => [w.id, w])).values());
        setWorkflows(uniqueWfs);
      }

      if (tmplRes.ok) {
        const tmplData = await tmplRes.json();
        const userTmpls: TemplateOption[] = tmplData.templates || [];
        const starterTmpls: TemplateOption[] = tmplData.starterTemplates || [];
        setUserTemplates(userTmpls);
        setStarterTemplates(starterTmpls);
      }
    } catch (err) {
      console.error("Failed to load workflows:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle runId query parameter to automatically launch runner
  useEffect(() => {
    if (runIdParam && workflows.length > 0) {
      const target = workflows.find((w) => w.id === runIdParam);
      if (target) {
        handleOpenRunnerForWorkflow(target);
      }
    }
  }, [runIdParam, workflows]);

  const handleToggleActive = async (workflow: Workflow) => {
    try {
      const res = await fetch("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...workflow, isActive: !workflow.isActive }),
      });
      if (res.ok) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflow.id ? { ...w, isActive: !w.isActive } : w))
        );
      }
    } catch (err) {
      console.error("Failed to toggle active status:", err);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow pipeline?")) return;
    try {
      const res = await fetch(`/api/v1/workflows?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete workflow:", err);
    }
  };

  const handleOpenRunnerForWorkflow = (workflow: Workflow) => {
    setSelectedWorkflowForRun(workflow);
    const initialUrl =
      workflow.sourceRssFeedUrl ||
      (workflow.sourcePlatform === "BLOG_RSS"
        ? "https://techcrunch.com/feed/"
        : "https://example.com/scale-content-repurposing");
    setTestUrlInput(initialUrl);
    setGenerationResult(null);
    setRunStep(0);
    setIsRunnerOpen(true);
  };

  const handleOpenStandaloneRunner = () => {
    setSelectedWorkflowForRun(null);
    setTestUrlInput("https://example.com/scale-content-repurposing");
    setGenerationResult(null);
    setRunStep(0);
    setIsRunnerOpen(true);
  };

  // Execute Pipeline Run
  const handleExecuteRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setRunStep(1);
    setGenerationResult(null);
    setActiveSlideIndex(0);

    const stepInterval = setInterval(() => {
      setRunStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1100);

    try {
      let payload: Record<string, unknown> = {};

      if (selectedWorkflowForRun) {
        payload = {
          workflowId: selectedWorkflowForRun.id,
          articleUrl: testUrlInput,
        };
      } else {
        payload = {
          articleUrl: customRunnerData.articleUrl,
          templateId: customRunnerData.templateId,
          backgroundStrategy: customRunnerData.backgroundStrategy,
          outputFormat: customRunnerData.outputFormat,
          destinationPlatform: customRunnerData.destinationPlatform,
        };
      }

      const res = await fetch("/api/v1/workflows/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      clearInterval(stepInterval);
      setRunStep(5);

      if (res.ok) {
        const data = await res.json();
        setGenerationResult(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Pipeline execution failed: ${errData.error || `HTTP ${res.status}`}`);
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error("Execution error:", err);
      alert(`Pipeline error: ${err instanceof Error ? err.message : "Network error"}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyCaption = () => {
    if (!generationResult?.draft) return;
    const text = `${generationResult.draft.postCaption}\n\n${generationResult.draft.postHashtags.join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const filteredWorkflows = workflows.filter((w) => {
    if (filterType === "ACTIVE") return w.isActive;
    if (filterType === "PAUSED") return !w.isActive;
    return true;
  });

  const allTemplates = [...userTemplates, ...starterTemplates];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-emerald-500/20">
              <GitFork className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Automation Workflows & Ingestion Studio
            </h1>
          </div>
          <p className="text-sm text-zinc-400">
            Create automated pipelines to ingest blog posts, generate multi-slide carousels via Gemini Flash, and stage drafts for social distribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenStandaloneRunner}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
            <span>Test URL Repurposing</span>
          </button>

          <Link
            href="/workflows/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </Link>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/30 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 3 Engine Online</span>
          </div>
          <h2 className="text-lg font-bold text-white">
            Transform Any Article or RSS Feed into a Multi-Slide Carousel Deck
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Configure dynamic workflows with custom source rules, Templated.io visual canvases, Unsplash stock imagery, and direct approval staging.
          </p>
        </div>

        <Link
          href="/workflows/new"
          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <span>Open Workflow Builder</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[11px] text-zinc-500 block">Total Workflows</span>
          <span className="text-xl font-bold text-white mt-1 block">{workflows.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[11px] text-zinc-500 block">Active Pipelines</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">
            {workflows.filter((w) => w.isActive).length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[11px] text-zinc-500 block">Autopilot Direct</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">
            {workflows.filter((w) => w.isAutopilot).length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[11px] text-zinc-500 block">Approval Inbox Gated</span>
          <span className="text-xl font-bold text-blue-400 mt-1 block">
            {workflows.filter((w) => !w.isAutopilot).length}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Workflows Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-emerald-400" />
              <span>Configured Pipelines</span>
            </h3>
            <span className="text-xs text-zinc-500">({filteredWorkflows.length})</span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            {(["ALL", "ACTIVE", "PAUSED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterType === tab
                    ? "bg-zinc-800 text-emerald-400 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab === "ALL" ? "All Pipelines" : tab === "ACTIVE" ? "Active" : "Paused"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] space-y-3">
            <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
            <p className="text-xs text-zinc-400">Loading workflows...</p>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30 space-y-4">
            <GitFork className="w-10 h-10 text-zinc-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-300">No Workflows Found</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {filterType === "ALL"
                  ? "Create your first automated RSS or URL pipeline to start generating social carousels."
                  : `No ${filterType.toLowerCase()} workflows currently.`}
              </p>
            </div>
            <Link
              href="/workflows/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-zinc-950 text-xs font-bold rounded-xl hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workflow</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredWorkflows.map((wf) => {
              const matchedTemplate =
                wf.brandTemplate ||
                allTemplates.find(
                  (t) =>
                    t.templatedTemplateId === wf.brandTemplateId ||
                    t.id === wf.brandTemplateId
                );

              const previewImg =
                matchedTemplate?.previewImageUrl ||
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";

              const isRss = wf.sourcePlatform === "BLOG_RSS";

              return (
                <div
                  key={wf.id}
                  className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                >
                  {/* Top Row: Title & Active Toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-zinc-100">{wf.name}</h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            wf.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}
                        >
                          {wf.isActive ? "Active" : "Paused"}
                        </span>
                        {wf.isAutopilot && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Autopilot
                          </span>
                        )}
                      </div>

                      {/* Source -> Destination Badges */}
                      <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                          {isRss ? <Rss className="w-3 h-3 text-orange-400" /> : <Globe className="w-3 h-3 text-blue-400" />}
                          {isRss ? "RSS Feed" : "Custom URL"}
                        </span>
                        <ArrowRight className="w-3 h-3 text-zinc-600" />
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                          {wf.destinationPlatform === "LINKEDIN" && <LinkedinIcon className="w-3 h-3 text-blue-400" />}
                          {wf.destinationPlatform === "INSTAGRAM" && <InstagramIcon className="w-3 h-3 text-pink-400" />}
                          {wf.destinationPlatform === "TWITTER_X" && <TwitterIcon className="w-3 h-3 text-sky-400" />}
                          {wf.destinationPlatform}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          ({wf.outputFormat === "MULTI_SLIDE_CAROUSEL" ? "5-6 Slides" : "Single Card"})
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleActive(wf)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer border ${
                        wf.isActive
                          ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {wf.isActive ? "Pause" : "Activate"}
                    </button>
                  </div>

                  {/* Middle Row: Template Preview & Metadata */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewImg}
                      alt={matchedTemplate?.name || "Template"}
                      className="w-16 h-12 rounded-lg object-cover border border-zinc-800 shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-zinc-200 truncate">
                          {matchedTemplate?.name || wf.brandTemplateId || "Modern Carousel Hook"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span>Strategy: {wf.backgroundStrategy}</span>
                        {wf.filterRules?.min_word_count && (
                          <>
                            <span>•</span>
                            <span>Min: {wf.filterRules.min_word_count} words</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                    <button
                      onClick={() => handleOpenRunnerForWorkflow(wf)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Ingestion / Test Now</span>
                    </button>

                    <button
                      onClick={() => handleDeleteWorkflow(wf.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-zinc-800"
                      title="Delete Workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIVE REPURPOSING & INGESTION RUNNER MODAL */}
      {isRunnerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">
                    {selectedWorkflowForRun
                      ? `Run Workflow: ${selectedWorkflowForRun.name}`
                      : "Interactive AI Repurpose Engine"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Ingest article content, run Gemini Flash synthesis, render high-res slides, and compile LinkedIn PDF.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRunnerOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingestion & Run Form */}
            {!generationResult && (
              <form onSubmit={handleExecuteRun} className="space-y-4">
                {selectedWorkflowForRun ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-zinc-850 border border-zinc-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-300">Pipeline Configuration:</span>
                        <span className="text-emerald-400 font-mono">
                          {selectedWorkflowForRun.outputFormat} • {selectedWorkflowForRun.destinationPlatform}
                        </span>
                      </div>
                      <div className="text-zinc-400 text-[11px]">
                        Template: {selectedWorkflowForRun.brandTemplateId || "Default"} | Strategy: {selectedWorkflowForRun.backgroundStrategy}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                        {selectedWorkflowForRun.sourcePlatform === "BLOG_RSS"
                          ? "RSS Feed / Article URL to Ingest"
                          : "Target Article URL"}
                      </label>
                      <input
                        type="url"
                        required
                        value={testUrlInput}
                        onChange={(e) => setTestUrlInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                        placeholder="https://techcrunch.com/feed/ or https://myblog.com/post-title"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                        Source Article URL
                      </label>
                      <input
                        type="url"
                        required
                        value={customRunnerData.articleUrl}
                        onChange={(e) =>
                          setCustomRunnerData({ ...customRunnerData, articleUrl: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                        placeholder="https://example.com/scale-content-repurposing"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                          Output Format
                        </label>
                        <select
                          value={customRunnerData.outputFormat}
                          onChange={(e) =>
                            setCustomRunnerData({ ...customRunnerData, outputFormat: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="MULTI_SLIDE_CAROUSEL">Multi-Slide Carousel (5-6 slides)</option>
                          <option value="SINGLE_IMAGE_CARD">Single Image Card (1 slide)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                          Background Strategy
                        </label>
                        <select
                          value={customRunnerData.backgroundStrategy}
                          onChange={(e) =>
                            setCustomRunnerData({ ...customRunnerData, backgroundStrategy: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="ARTICLE_IMAGE_FIRST">Article Image First</option>
                          <option value="STOCK_SEARCH_ONLY">Stock Search Only</option>
                          <option value="SOLID_COLOR_ONLY">Solid Brand Color Only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Animation during run */}
                {isRunning && (
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Repurposing Content in Real-time...
                      </span>
                      <span>Step {runStep} of 4</span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-zinc-400">
                      <div className={`flex items-center gap-2 ${runStep >= 1 ? "text-emerald-300" : "text-zinc-600"}`}>
                        {runStep > 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>1. Scraping and extracting clean article body</span>
                      </div>
                      <div className={`flex items-center gap-2 ${runStep >= 2 ? "text-emerald-300" : "text-zinc-600"}`}>
                        {runStep > 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : runStep === 2 ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />}
                        <span>2. Gemini Flash AI synthesizing hook, insights & captions</span>
                      </div>
                      <div className={`flex items-center gap-2 ${runStep >= 3 ? "text-emerald-300" : "text-zinc-600"}`}>
                        {runStep > 3 ? <CheckCircle2 className="w-3.5 h-3.5" /> : runStep === 3 ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />}
                        <span>3. Resolving background imagery & rendering PNG slides via Templated.io</span>
                      </div>
                      <div className={`flex items-center gap-2 ${runStep >= 4 ? "text-emerald-300" : "text-zinc-600"}`}>
                        {runStep >= 4 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />}
                        <span>4. Stitching high-res LinkedIn PDF document & saving to Inbox</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRunnerOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRunning}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Execute Pipeline Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Generation Results View */}
            {generationResult && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Repurposing Complete! Draft generated and saved to Approval Inbox.</span>
                  </div>
                  {generationResult.timings?.total_duration_ms && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {(generationResult.timings.total_duration_ms / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Interactive Carousel Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300">
                        Slide {activeSlideIndex + 1} of {generationResult.draft.slidesData.length}
                      </span>
                      {generationResult.draft.pdfDocumentUrl && (
                        <a
                          href={generationResult.draft.pdfDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download LinkedIn PDF</span>
                        </a>
                      )}
                    </div>

                    <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={generationResult.draft.slidesData[activeSlideIndex]?.rendered_png_url}
                        alt={`Slide ${activeSlideIndex + 1}`}
                        className="w-full h-full object-contain"
                      />

                      {generationResult.draft.slidesData.length > 1 && (
                        <>
                          <button
                            type="button"
                            disabled={activeSlideIndex === 0}
                            onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-30 cursor-pointer backdrop-blur-sm"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={activeSlideIndex === generationResult.draft.slidesData.length - 1}
                            onClick={() =>
                              setActiveSlideIndex((prev) =>
                                Math.min(generationResult.draft.slidesData.length - 1, prev + 1)
                              )
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-30 cursor-pointer backdrop-blur-sm"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {generationResult.draft.slidesData.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {generationResult.draft.slidesData.map((slide, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveSlideIndex(idx)}
                            className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                              activeSlideIndex === idx
                                ? "border-emerald-500 scale-105"
                                : "border-zinc-800 opacity-60 hover:opacity-100"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={slide.rendered_png_url}
                              alt={`Thumb ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Caption & Metadata */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">
                          Post Title
                        </span>
                        <h3 className="text-sm font-bold text-zinc-100">
                          {generationResult.draft.postTitle}
                        </h3>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                            Generated Post Caption
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCaption}
                            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                          >
                            {copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCaption ? "Copied!" : "Copy Caption"}</span>
                          </button>
                        </div>
                        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-sans">
                          {generationResult.draft.postCaption}
                          {generationResult.draft.postHashtags.length > 0 && (
                            <div className="mt-3 text-emerald-400 font-mono">
                              {generationResult.draft.postHashtags.join(" ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          setGenerationResult(null);
                          setRunStep(0);
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer font-semibold"
                      >
                        Run Another Test
                      </button>

                      <Link
                        href="/inbox"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
                      >
                        <span>Open in Approval Inbox</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
        <p className="text-xs text-zinc-400">Loading Workflows Studio...</p>
      </div>
    }>
      <WorkflowsContent />
    </Suspense>
  );
}
