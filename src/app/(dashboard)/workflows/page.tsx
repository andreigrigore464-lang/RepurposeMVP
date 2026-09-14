"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  FileCheck,
  ArrowRight,
  ImageIcon,
} from "lucide-react";

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
}

interface TemplateOption {
  id: string;
  name: string;
  templatedTemplateId: string;
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
  draft: {
    id: string;
    postTitle: string;
    postCaption: string;
    postHashtags: string[];
    slidesData: RenderedSlide[];
    pdfDocumentUrl?: string | null;
    status: string;
  };
  timings?: Record<string, number>;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [userTemplates, setUserTemplates] = useState<TemplateOption[]>([]);
  const [starterTemplates, setStarterTemplates] = useState<TemplateOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Repurpose Runner Modal & Execution State
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runStep, setRunStep] = useState<number>(0);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [savedToInbox, setSavedToInbox] = useState(false);

  // Form State for Instant Runner
  const [runnerData, setRunnerData] = useState({
    articleUrl: "https://example.com/scale-content-repurposing",
    templateId: "",
    backgroundStrategy: "ARTICLE_IMAGE_FIRST",
    outputFormat: "MULTI_SLIDE_CAROUSEL",
    destinationPlatform: "LINKEDIN",
  });

  // Form State for Creating New Workflow
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({
    name: "Automated Blog to LinkedIn Carousel",
    sourcePlatform: "CUSTOM_URL",
    sourceRssFeedUrl: "",
    destinationPlatform: "LINKEDIN",
    brandTemplateId: "",
    outputFormat: "MULTI_SLIDE_CAROUSEL",
    backgroundStrategy: "ARTICLE_IMAGE_FIRST",
    isAutopilot: false,
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
        setWorkflows(wfData.workflows || []);
      }
      if (tmplRes.ok) {
        const tmplData = await tmplRes.json();
        const userTmpls: TemplateOption[] = tmplData.templates || [];
        const starterTmpls: TemplateOption[] = tmplData.starterTemplates || [];
        setUserTemplates(userTmpls);
        setStarterTemplates(starterTmpls);

        const defaultTmplId =
          userTmpls[0]?.templatedTemplateId ||
          starterTmpls[0]?.templatedTemplateId ||
          "tmpl_hook_square_01";

        setRunnerData((prev) => ({
          ...prev,
          templateId: prev.templateId || defaultTmplId,
        }));
        setWorkflowForm((prev) => ({
          ...prev,
          brandTemplateId: prev.brandTemplateId || defaultTmplId,
        }));
      }
    } catch (err) {
      console.error("Failed to load workflow data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch("/api/v1/workflows").then((res) => (res.ok ? res.json() : { workflows: [] })),
      fetch("/api/v1/templates").then((res) => (res.ok ? res.json() : { templates: [], starterTemplates: [] })),
    ])
      .then(([wfData, tmplData]) => {
        if (!isMounted) return;
        setWorkflows(wfData.workflows || []);
        const userTmpls: TemplateOption[] = tmplData.templates || [];
        const starterTmpls: TemplateOption[] = tmplData.starterTemplates || [];
        setUserTemplates(userTmpls);
        setStarterTemplates(starterTmpls);

        const defaultTmplId =
          userTmpls[0]?.templatedTemplateId ||
          starterTmpls[0]?.templatedTemplateId ||
          "tmpl_hook_square_01";

        setRunnerData((prev) => ({
          ...prev,
          templateId: prev.templateId || defaultTmplId,
        }));
        setWorkflowForm((prev) => ({
          ...prev,
          brandTemplateId: prev.brandTemplateId || defaultTmplId,
        }));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load workflow data:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Execute Pipeline Run
  const handleExecuteRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setRunStep(1);
    setGenerationResult(null);
    setActiveSlideIndex(0);
    setSavedToInbox(false);

    // Visual step progression
    const stepInterval = setInterval(() => {
      setRunStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1200);

    try {
      const res = await fetch("/api/v1/workflows/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(runnerData),
      });

      clearInterval(stepInterval);
      setRunStep(5);

      if (res.ok) {
        const data = await res.json();
        setGenerationResult(data);
      } else {
        const errData = await res.json();
        alert(`Pipeline failed: ${errData.error || "Unknown error"}`);
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error("Pipeline run error:", err);
      alert("Failed to execute pipeline");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowForm),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to save workflow:", err);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      const res = await fetch(`/api/v1/workflows?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete workflow:", err);
    }
  };

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
      console.error("Failed to toggle workflow active status:", err);
    }
  };

  const handleCopyCaption = () => {
    if (!generationResult?.draft) return;
    const text = `${generationResult.draft.postCaption}\n\n${generationResult.draft.postHashtags.join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Automation Workflows & Ingestion Engine
            </h1>
          </div>
          <p className="text-sm text-zinc-400">
            Configure automated pipelines to ingest blog posts, generate multi-slide carousels via Gemini Flash, and stitch LinkedIn PDFs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setGenerationResult(null);
              setIsRunnerOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Repurpose Article Now</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

      {/* Quick Launch Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/30 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 2 Engine Online</span>
          </div>
          <h2 className="text-lg font-bold text-white">
            Transform Any Article URL into a Swipeable Carousel Deck
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Our multi-stage pipeline automatically scrapes long-form content, distills structured 5–6 slide hooks and insights with Gemini Flash, applies your dynamic brand tokens, renders full-res PNG slides, and compiles a LinkedIn PDF.
          </p>
        </div>

        <button
          onClick={() => {
            setGenerationResult(null);
            setIsRunnerOpen(true);
          }}
          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <span>Open Interactive Runner</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <GitFork className="w-4 h-4 text-emerald-400" />
            <span>Active Pipelines</span>
          </h3>
          <span className="text-xs text-zinc-500">{workflows.length} configured</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] space-y-3">
            <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
            <p className="text-xs text-zinc-400">Loading workflows...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30 space-y-3">
            <GitFork className="w-8 h-8 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-300">No Workflows Configured</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Create an automated RSS or URL pipeline to continuously produce carousel drafts.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-lg hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-zinc-100">{wf.name}</h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          wf.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {wf.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {wf.sourcePlatform} → {wf.destinationPlatform} ({wf.outputFormat})
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleActive(wf)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer font-medium px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    {wf.isActive ? "Pause" : "Resume"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-zinc-800/60">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate">Template: {wf.brandTemplateId || "Default"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span className="truncate">Strategy: {wf.backgroundStrategy}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40">
                  <button
                    onClick={() => {
                      setRunnerData({
                        articleUrl: "https://example.com/scale-content-repurposing",
                        templateId: wf.brandTemplateId || "tmpl_hook_square_01",
                        backgroundStrategy: wf.backgroundStrategy || "ARTICLE_IMAGE_FIRST",
                        outputFormat: wf.outputFormat || "MULTI_SLIDE_CAROUSEL",
                        destinationPlatform: wf.destinationPlatform || "LINKEDIN",
                      });
                      setIsRunnerOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run on Custom URL</span>
                  </button>

                  <button
                    onClick={() => handleDeleteWorkflow(wf.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Workflow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1. Modal: Repurpose Article Live Runner */}
      {isRunnerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">
                    Interactive AI Repurpose Studio
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Ingest an article URL and generate a LinkedIn Carousel or Social Card live.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRunnerOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Form */}
            {!generationResult && (
              <form onSubmit={handleExecuteRun} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Source Article URL
                  </label>
                  <input
                    type="url"
                    required
                    value={runnerData.articleUrl}
                    onChange={(e) => setRunnerData({ ...runnerData, articleUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    placeholder="https://yourblog.com/posts/how-to-scale"
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Brand Template
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      Auto-detects layers, aspect ratio & image placeholders
                    </span>
                  </div>
                  <select
                    value={runnerData.templateId}
                    onChange={(e) => setRunnerData({ ...runnerData, templateId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {userTemplates.length > 0 && (
                      <optgroup label="🌟 Your Custom Workspace Templates">
                        {userTemplates.map((t) => (
                          <option key={t.id} value={t.templatedTemplateId}>
                            {t.name} ({t.aspectRatio || "Auto-detected"})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {starterTemplates.length > 0 && (
                      <optgroup label="Starter Library Templates">
                        {starterTemplates.map((t) => (
                          <option key={t.id} value={t.templatedTemplateId}>
                            {t.name} ({t.aspectRatio || "Auto-detected"})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Output Format Segmented Switch */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Output Type
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setRunnerData({ ...runnerData, outputFormat: "MULTI_SLIDE_CAROUSEL" })}
                        className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          runnerData.outputFormat === "MULTI_SLIDE_CAROUSEL"
                            ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Carousel (PDF)</span>
                        </span>
                        <span className={`text-[10px] mt-0.5 ${runnerData.outputFormat === "MULTI_SLIDE_CAROUSEL" ? "text-zinc-900 font-normal" : "text-zinc-500"}`}>
                          5–7 Slide Deck
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRunnerData({ ...runnerData, outputFormat: "SINGLE_IMAGE_CARD" })}
                        className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          runnerData.outputFormat === "SINGLE_IMAGE_CARD"
                            ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Single Card</span>
                        </span>
                        <span className={`text-[10px] mt-0.5 ${runnerData.outputFormat === "SINGLE_IMAGE_CARD" ? "text-zinc-900 font-normal" : "text-zinc-500"}`}>
                          1 Key Insight Card
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Background Image Strategy */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Visual Background Strategy
                    </label>
                    <select
                      value={runnerData.backgroundStrategy}
                      onChange={(e) =>
                        setRunnerData({ ...runnerData, backgroundStrategy: e.target.value })
                      }
                      className="w-full h-[46px] px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ARTICLE_IMAGE_FIRST">📸 Article Photo First (Fallback to Stock)</option>
                      <option value="STOCK_SEARCH_ONLY">🔍 Unsplash Stock Search (AI Keywords)</option>
                      <option value="SOLID_COLOR_ONLY">🎨 Solid Brand Color Theme Only</option>
                    </select>
                  </div>
                </div>

                {/* Stepper Indicator if running */}
                {isRunning && (
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-400 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          {runStep === 1 && "1/5 Scraping & Parsing Article..."}
                          {runStep === 2 && "2/5 Gemini Flash AI Generating Hooks & Slides..."}
                          {runStep === 3 && "3/5 Resolving Atmospheric Background..."}
                          {runStep === 4 && "4/5 Templated.io Parallel Slide Rendering..."}
                          {runStep === 5 && "5/5 Compiling Multi-Page LinkedIn PDF Document..."}
                        </span>
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${(runStep / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRunnerOpen(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRunning}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-zinc-950 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    {isRunning && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isRunning ? "Processing Pipeline..." : "Generate Carousel"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Generated Results Preview */}
            {generationResult && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Carousel Generated Successfully!</span>
                  </div>
                  {generationResult.timings && (
                    <span className="font-mono text-[11px] text-emerald-400/80">
                      Total Time: {(generationResult.timings.total_duration_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Slide Carousel Viewer */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                      <span>
                        Slide {activeSlideIndex + 1} of{" "}
                        {generationResult.draft.slidesData?.length || 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setActiveSlideIndex((prev) => (prev > 0 ? prev - 1 : prev))
                          }
                          disabled={activeSlideIndex === 0}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 text-zinc-300" />
                        </button>
                        <button
                          onClick={() =>
                            setActiveSlideIndex((prev) =>
                              prev < (generationResult.draft.slidesData?.length || 1) - 1
                                ? prev + 1
                                : prev
                            )
                          }
                          disabled={
                            activeSlideIndex ===
                            (generationResult.draft.slidesData?.length || 1) - 1
                          }
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 text-zinc-300" />
                        </button>
                      </div>
                    </div>

                    {/* Active Slide Image */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          generationResult.draft.slidesData?.[activeSlideIndex]?.rendered_png_url ||
                          generationResult.draft.slidesData?.[0]?.rendered_png_url
                        }
                        alt={`Slide ${activeSlideIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {generationResult.draft.slidesData?.map((slide, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSlideIndex(idx)}
                          className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
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
                  </div>

                  {/* Right: Caption & Export Actions */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] text-zinc-400 block mb-1 font-semibold uppercase tracking-wider">
                          Post Title
                        </span>
                        <h3 className="text-sm font-bold text-zinc-100">
                          {generationResult.draft.postTitle}
                        </h3>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                            Post Caption & Hashtags
                          </span>
                          <button
                            onClick={handleCopyCaption}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium"
                          >
                            {copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCaption ? "Copied!" : "Copy Caption"}</span>
                          </button>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono whitespace-pre-wrap max-h-[160px] overflow-y-auto leading-relaxed">
                          {generationResult.draft.postCaption}
                          {"\n\n"}
                          {generationResult.draft.postHashtags?.join(" ")}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2.5 pt-4 border-t border-zinc-800">
                      {generationResult.draft.pdfDocumentUrl && (
                        <a
                          href={generationResult.draft.pdfDocumentUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Swipeable LinkedIn PDF</span>
                        </a>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSavedToInbox(true);
                            setTimeout(() => {
                              setIsRunnerOpen(false);
                            }, 1200);
                          }}
                          disabled={savedToInbox}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          <span>{savedToInbox ? "Saved to Approval Inbox!" : "View in Inbox"}</span>
                        </button>

                        <button
                          onClick={() => setGenerationResult(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                        >
                          New Run
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Modal: Create New Workflow */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-zinc-100">Create Repurposing Workflow</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkflow} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Workflow Name
                </label>
                <input
                  type="text"
                  required
                  value={workflowForm.name}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Weekly Tech Blog to LinkedIn Carousel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Source Type
                  </label>
                  <select
                    value={workflowForm.sourcePlatform}
                    onChange={(e) =>
                      setWorkflowForm({ ...workflowForm, sourcePlatform: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CUSTOM_URL">Custom URL / Manual Input</option>
                    <option value="BLOG_RSS">Blog RSS Feed (Automated)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Destination Platform
                  </label>
                  <select
                    value={workflowForm.destinationPlatform}
                    onChange={(e) =>
                      setWorkflowForm({ ...workflowForm, destinationPlatform: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LINKEDIN">LinkedIn (PDF Document)</option>
                    <option value="TWITTER_X">Twitter / X (Card + Thread)</option>
                    <option value="INSTAGRAM">Instagram Feed (1:1 / 4:5)</option>
                  </select>
                </div>
              </div>

              {workflowForm.sourcePlatform === "BLOG_RSS" && (
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    RSS Feed URL
                  </label>
                  <input
                    type="url"
                    value={workflowForm.sourceRssFeedUrl}
                    onChange={(e) =>
                      setWorkflowForm({ ...workflowForm, sourceRssFeedUrl: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    placeholder="https://techcrunch.com/feed/"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Brand Template
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Auto-binds typography & aspect ratio
                  </span>
                </div>
                <select
                  value={workflowForm.brandTemplateId}
                  onChange={(e) =>
                    setWorkflowForm({ ...workflowForm, brandTemplateId: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {userTemplates.length > 0 && (
                    <optgroup label="🌟 Your Custom Workspace Templates">
                      {userTemplates.map((t) => (
                        <option key={t.id} value={t.templatedTemplateId}>
                          {t.name} ({t.aspectRatio || "Auto-detected"})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {starterTemplates.length > 0 && (
                    <optgroup label="Starter Library Templates">
                      {starterTemplates.map((t) => (
                        <option key={t.id} value={t.templatedTemplateId}>
                          {t.name} ({t.aspectRatio || "Auto-detected"})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Output Format
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setWorkflowForm({ ...workflowForm, outputFormat: "MULTI_SLIDE_CAROUSEL" })}
                      className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        workflowForm.outputFormat === "MULTI_SLIDE_CAROUSEL"
                          ? "bg-emerald-500 text-zinc-950 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>Carousel</span>
                      </span>
                      <span className="text-[9px] mt-0.5 opacity-80">PDF Deck</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkflowForm({ ...workflowForm, outputFormat: "SINGLE_IMAGE_CARD" })}
                      className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        workflowForm.outputFormat === "SINGLE_IMAGE_CARD"
                          ? "bg-emerald-500 text-zinc-950 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>Card</span>
                      </span>
                      <span className="text-[9px] mt-0.5 opacity-80">Single Post</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Visual Strategy
                  </label>
                  <select
                    value={workflowForm.backgroundStrategy}
                    onChange={(e) =>
                      setWorkflowForm({ ...workflowForm, backgroundStrategy: e.target.value })
                    }
                    className="w-full h-[46px] px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ARTICLE_IMAGE_FIRST">📸 Article Photo First</option>
                    <option value="STOCK_SEARCH_ONLY">🔍 Unsplash Stock</option>
                    <option value="SOLID_COLOR_ONLY">🎨 Solid Brand Theme</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Create Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
