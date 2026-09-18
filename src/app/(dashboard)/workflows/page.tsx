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
  Activity,
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

interface ToastMessage {
  type: "success" | "error" | "info";
  message: string;
}

type FilterCategory = "ALL" | "ACTIVE" | "PAUSED" | "AUTOPILOT" | "APPROVAL_GATED";

function WorkflowsContent() {
  const searchParams = useSearchParams();
  const runIdParam = searchParams.get("runId");

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [userTemplates, setUserTemplates] = useState<TemplateOption[]>([]);
  const [starterTemplates, setStarterTemplates] = useState<TemplateOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterType, setFilterType] = useState<FilterCategory>("ALL");

  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [selectedWorkflowForRun, setSelectedWorkflowForRun] = useState<Workflow | null>(null);
  const [testUrlInput, setTestUrlInput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [runStep, setRunStep] = useState<number>(0);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

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
      showToast("error", "Failed to load workflows and templates.");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (runIdParam && workflows.length > 0) {
      const target = workflows.find((w) => w.id === runIdParam);
      if (target) {
        handleOpenRunnerForWorkflow(target);
      }
    }
  }, [runIdParam, workflows]);

  // Keyboard navigation for slide preview modal
  useEffect(() => {
    if (!isRunnerOpen || !generationResult?.draft?.slidesData?.length) return;

    const totalSlides = generationResult.draft.slidesData.length;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setActiveSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setActiveSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
      } else if (e.key === "Escape") {
        setIsRunnerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunnerOpen, generationResult]);

  const handleToggleActive = async (workflow: Workflow) => {
    const nextStatus = !workflow.isActive;
    try {
      const res = await fetch("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...workflow, isActive: nextStatus }),
      });
      if (res.ok) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflow.id ? { ...w, isActive: nextStatus } : w))
        );
        showToast("success", `Workflow "${workflow.name}" is now ${nextStatus ? "Active" : "Paused"}.`);
      } else {
        showToast("error", "Failed to update workflow status.");
      }
    } catch (err) {
      console.error("Failed to toggle active status:", err);
      showToast("error", "Network error toggling workflow status.");
    }
  };

  const handleDuplicateWorkflow = async (workflow: Workflow) => {
    try {
      const duplicatedPayload = {
        name: `${workflow.name} (Copy)`,
        isActive: workflow.isActive,
        sourcePlatform: workflow.sourcePlatform,
        sourceRssFeedUrl: workflow.sourceRssFeedUrl,
        destinationPlatform: workflow.destinationPlatform,
        brandTemplateId: workflow.brandTemplateId,
        outputFormat: workflow.outputFormat,
        backgroundStrategy: workflow.backgroundStrategy,
        isAutopilot: workflow.isAutopilot,
        filterRules: workflow.filterRules,
      };

      const res = await fetch("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicatedPayload),
      });

      if (res.ok) {
        showToast("success", `Cloned pipeline "${workflow.name}" successfully!`);
        fetchData();
      } else {
        showToast("error", "Failed to duplicate workflow pipeline.");
      }
    } catch (err) {
      console.error("Error duplicating workflow:", err);
      showToast("error", "Network error while duplicating pipeline.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!workflowToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/workflows?id=${workflowToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== workflowToDelete.id));
        showToast("success", `Workflow "${workflowToDelete.name}" deleted.`);
      } else {
        showToast("error", "Could not delete workflow.");
      }
    } catch (err) {
      console.error("Failed to delete workflow:", err);
      showToast("error", "Network error deleting workflow.");
    } finally {
      setIsDeleting(false);
      setWorkflowToDelete(null);
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
        showToast("success", "Pipeline synthesis completed successfully!");
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast("error", `Pipeline failed: ${errData.error || `HTTP ${res.status}`}`);
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error("Execution error:", err);
      showToast("error", `Pipeline error: ${err instanceof Error ? err.message : "Network error"}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyCaption = () => {
    if (!generationResult?.draft) return;
    const text = `${generationResult.draft.postCaption}\n\n${generationResult.draft.postHashtags.join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    showToast("info", "Caption & hashtags copied to clipboard!");
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const filteredWorkflows = workflows.filter((w) => {
    if (filterType === "ACTIVE") return w.isActive;
    if (filterType === "PAUSED") return !w.isActive;
    if (filterType === "AUTOPILOT") return w.isAutopilot;
    if (filterType === "APPROVAL_GATED") return !w.isAutopilot;
    return true;
  });

  const allTemplates = [...userTemplates, ...starterTemplates];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#08090d] rounded-[15px] flex items-center justify-center">
                <GitFork className="w-5 h-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Workflows &amp; Automation Studio
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Automate blog &amp; article intake, Gemini synthesis, slide rendering, and social packaging.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenStandaloneRunner}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full glass-pill hover:bg-white/10 text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
            <span>Test URL Repurpose</span>
          </button>

          <Link
            href="/workflows/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </Link>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="p-7 rounded-3xl glass-panel relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl border border-white/10">
        <div className="space-y-2.5 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border border-blue-500/30 text-[11px] font-semibold text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini Flash Synthesis Active</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Transform Any Article or RSS Feed into Multi-Slide Social Assets
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure automated pipelines with custom filtering, Templated.io visual canvases, Unsplash stock photos, and direct approval staging.
          </p>
        </div>

        <Link
          href="/workflows/new"
          className="px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer relative z-10"
        >
          <span>Open Workflow Wizard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Overview Stats Bar (Interactive Quick Filters) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setFilterType("ALL")}
          className={`p-5 rounded-3xl glass-panel text-left transition-all cursor-pointer border ${
            filterType === "ALL"
              ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/15 ring-1 ring-blue-400/30"
              : "hover:border-white/20 hover:bg-white/[0.04]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium block">Total Pipelines</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-mono">All</span>
          </div>
          <span className="text-2xl font-bold text-white mt-1.5 block font-mono">{workflows.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType(filterType === "ACTIVE" ? "ALL" : "ACTIVE")}
          className={`p-5 rounded-3xl glass-panel text-left transition-all cursor-pointer border ${
            filterType === "ACTIVE"
              ? "border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/30"
              : "hover:border-white/20 hover:bg-white/[0.04]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium block">Active Pipelines</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono">Running</span>
          </div>
          <span className="text-2xl font-bold text-cyan-300 mt-1.5 block font-mono">
            {workflows.filter((w) => w.isActive).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType(filterType === "AUTOPILOT" ? "ALL" : "AUTOPILOT")}
          className={`p-5 rounded-3xl glass-panel text-left transition-all cursor-pointer border ${
            filterType === "AUTOPILOT"
              ? "border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/15 ring-1 ring-amber-400/30"
              : "hover:border-white/20 hover:bg-white/[0.04]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium block">Autopilot Direct</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono">Auto</span>
          </div>
          <span className="text-2xl font-bold text-emerald-400 mt-1.5 block font-mono">
            {workflows.filter((w) => w.isAutopilot).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType(filterType === "APPROVAL_GATED" ? "ALL" : "APPROVAL_GATED")}
          className={`p-5 rounded-3xl glass-panel text-left transition-all cursor-pointer border ${
            filterType === "APPROVAL_GATED"
              ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/15 ring-1 ring-purple-400/30"
              : "hover:border-white/20 hover:bg-white/[0.04]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium block">Approval Gated</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono">Gated</span>
          </div>
          <span className="text-2xl font-bold text-blue-400 mt-1.5 block font-mono">
            {workflows.filter((w) => !w.isAutopilot).length}
          </span>
        </button>
      </div>

      {/* Filter Tabs & Workflows Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <GitFork className="w-4 h-4 text-cyan-400" />
              <span>Configured Pipelines</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">({filteredWorkflows.length})</span>
          </div>

          <div
            role="tablist"
            aria-label="Workflow pipeline filters"
            className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-full border border-white/[0.08] overflow-x-auto max-w-full"
          >
            {[
              { id: "ALL", label: "All Pipelines", count: workflows.length },
              { id: "ACTIVE", label: "Active", count: workflows.filter((w) => w.isActive).length },
              { id: "PAUSED", label: "Paused", count: workflows.filter((w) => !w.isActive).length },
              { id: "AUTOPILOT", label: "Autopilot", count: workflows.filter((w) => w.isAutopilot).length },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={filterType === tab.id}
                onClick={() => setFilterType(tab.id as FilterCategory)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  filterType === tab.id
                    ? "bg-blue-600/30 text-cyan-300 border border-blue-500/40 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] space-y-3">
            <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading workflows...</p>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl glass-panel space-y-4">
            <GitFork className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-200">No Workflows Found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {filterType === "ALL"
                  ? "Create your first automated RSS or URL pipeline to start generating social carousels."
                  : `No workflows match the "${filterType.toLowerCase()}" filter.`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              {filterType !== "ALL" && (
                <button
                  onClick={() => setFilterType("ALL")}
                  className="px-4 py-2 rounded-full glass-pill hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
              <Link
                href="/workflows/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-full hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Workflow</span>
              </Link>
            </div>
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
                  className="p-5 rounded-3xl glass-panel hover:border-blue-500/30 transition-all flex flex-col justify-between space-y-4 shadow-md"
                >
                  {/* Top Row: Title & Active Toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{wf.name}</h4>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                            wf.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-white/5 text-slate-400 border-white/10"
                          }`}
                        >
                          {wf.isActive ? "Active" : "Paused"}
                        </span>
                        {wf.isAutopilot && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Autopilot
                          </span>
                        )}
                      </div>

                      {/* Source -> Destination Badges */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-200 font-medium">
                          {isRss ? <Rss className="w-3 h-3 text-orange-400" /> : <Globe className="w-3 h-3 text-cyan-400" />}
                          {isRss ? "RSS Feed" : "Custom URL"}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-200 font-medium">
                          {wf.destinationPlatform === "LINKEDIN" && <LinkedinIcon className="w-3 h-3 text-blue-400" />}
                          {wf.destinationPlatform === "INSTAGRAM" && <InstagramIcon className="w-3 h-3 text-pink-400" />}
                          {wf.destinationPlatform === "TWITTER_X" && <TwitterIcon className="w-3 h-3 text-sky-400" />}
                          {wf.destinationPlatform}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ({wf.outputFormat === "MULTI_SLIDE_CAROUSEL" ? "5-6 Slides" : "Single Card"})
                        </span>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggleActive(wf)}
                      aria-label={`Toggle active state for ${wf.name}`}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors cursor-pointer border ${
                        wf.isActive
                          ? "glass-pill text-slate-300 hover:bg-white/10"
                          : "bg-blue-500/15 border-blue-500/30 text-cyan-300 hover:bg-blue-500/25"
                      }`}
                    >
                      {wf.isActive ? "Pause" : "Activate"}
                    </button>
                  </div>

                  {/* Middle Row: Template Preview & Metadata */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewImg}
                      alt={matchedTemplate?.name || "Template"}
                      className="w-16 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-white truncate">
                          {matchedTemplate?.name || wf.brandTemplateId || "Modern Carousel Hook"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>Strategy: {wf.backgroundStrategy}</span>
                        {wf.filterRules?.min_word_count && (
                          <>
                            <span>•</span>
                            <span className="font-mono">Min: {wf.filterRules.min_word_count} words</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => handleOpenRunnerForWorkflow(wf)}
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Ingestion / Test Now</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateWorkflow(wf)}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer rounded-xl hover:bg-white/5"
                        title="Duplicate Pipeline"
                        aria-label="Duplicate Pipeline"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setWorkflowToDelete(wf)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer rounded-xl hover:bg-white/5"
                        title="Delete Workflow"
                        aria-label="Delete Workflow"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIVE REPURPOSING & INGESTION RUNNER MODAL */}
      {isRunnerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1017] border border-white/15 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px]">
                  <div className="w-full h-full bg-[#08090d] rounded-[11px] flex items-center justify-center text-cyan-300">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {selectedWorkflowForRun
                      ? `Run Workflow: ${selectedWorkflowForRun.name}`
                      : "Interactive AI Repurpose Engine"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ingest article content, run Gemini Flash synthesis, render high-res slides, and compile LinkedIn PDF.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRunnerOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingestion & Run Form */}
            {!generationResult && (
              <form onSubmit={handleExecuteRun} className="space-y-4">
                {selectedWorkflowForRun ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300">Pipeline Configuration:</span>
                        <span className="text-cyan-300 font-mono">
                          {selectedWorkflowForRun.outputFormat} • {selectedWorkflowForRun.destinationPlatform}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Template: {selectedWorkflowForRun.brandTemplateId || "Default"} | Strategy: {selectedWorkflowForRun.backgroundStrategy}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                        {selectedWorkflowForRun.sourcePlatform === "BLOG_RSS"
                          ? "RSS Feed / Article URL to Ingest"
                          : "Target Article URL"}
                      </label>
                      <input
                        type="url"
                        required
                        value={testUrlInput}
                        onChange={(e) => setTestUrlInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#151824] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                        placeholder="https://techcrunch.com/feed/ or https://myblog.com/post-title"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                        Source Article URL
                      </label>
                      <input
                        type="url"
                        required
                        value={customRunnerData.articleUrl}
                        onChange={(e) =>
                          setCustomRunnerData({ ...customRunnerData, articleUrl: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#151824] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                        placeholder="https://example.com/scale-content-repurposing"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                          Output Format
                        </label>
                        <select
                          value={customRunnerData.outputFormat}
                          onChange={(e) =>
                            setCustomRunnerData({ ...customRunnerData, outputFormat: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#151824] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                        >
                          <option value="MULTI_SLIDE_CAROUSEL">Multi-Slide Carousel (5-6 slides)</option>
                          <option value="SINGLE_IMAGE_CARD">Single Image Card (1 slide)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-300 block">
                            Background Strategy
                          </label>
                          <span className="text-[10px] text-cyan-400 font-mono">
                            {customRunnerData.backgroundStrategy === "ARTICLE_IMAGE_FIRST"
                              ? "Scrapes lead graphic"
                              : customRunnerData.backgroundStrategy === "STOCK_SEARCH_ONLY"
                              ? "AI Unsplash search"
                              : "Solid brand gradient"}
                          </span>
                        </div>
                        <select
                          value={customRunnerData.backgroundStrategy}
                          onChange={(e) =>
                            setCustomRunnerData({ ...customRunnerData, backgroundStrategy: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#151824] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                        >
                          <option value="ARTICLE_IMAGE_FIRST">Article Image First (Extracts hero visual from body)</option>
                          <option value="STOCK_SEARCH_ONLY">Stock Search Only (Unsplash stock photography via AI)</option>
                          <option value="SOLID_COLOR_ONLY">Solid Brand Color Only (Minimalist gradient theme)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Animation during run */}
                {isRunning && (
                  <div className="p-4 rounded-2xl glass-panel-elevated space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                        Repurposing Content in Real-time...
                      </span>
                      <span className="font-mono">Step {runStep} of 4</span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-400">
                      <div className={`flex items-center gap-2 ${runStep >= 1 ? "text-cyan-300" : "text-slate-600"}`}>
                        {runStep > 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />}
                        <span>1. Scraping and extracting clean article body</span>
                      </div>
                      <div className={`flex items-center gap-2 ${runStep >= 2 ? "text-cyan-300" : "text-slate-600"}`}>
                        {runStep > 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : runStep === 2 ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20" />}
                        <span>2. Gemini Flash AI synthesizing hook, insights &amp; captions</span>
                      </div>
                      <div className={`flex items-center gap-2 ${runStep >= 3 ? "text-cyan-300" : "text-slate-600"}`}>
                        {runStep > 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : runStep === 3 ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20" />}
                        <span>3. Resolving background visuals &amp; rendering PNG slides via Templated.io</span>
                      </div>
                      <div className={`flex items-center gap-2 ${runStep >= 4 ? "text-cyan-300" : "text-slate-600"}`}>
                        {runStep >= 4 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20" />}
                        <span>4. Stitching high-res LinkedIn PDF document &amp; saving to Inbox</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRunnerOpen(false)}
                    className="px-4 py-2 rounded-full glass-pill hover:bg-white/10 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRunning}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
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
                <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-center gap-2 text-xs text-cyan-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Repurposing Complete! Draft generated and saved to Approval Inbox.</span>
                  </div>
                  {generationResult.timings?.total_duration_ms && (
                    <span className="text-[11px] font-mono text-cyan-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                      {(generationResult.timings.total_duration_ms / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Interactive Carousel Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 font-mono">
                          Slide {activeSlideIndex + 1} of {generationResult.draft.slidesData.length}
                        </span>
                        <span className="text-[10px] text-slate-500 hidden sm:inline-block font-mono">
                          (Press ← / → keys)
                        </span>
                      </div>
                      {generationResult.draft.pdfDocumentUrl && (
                        <a
                          href={generationResult.draft.pdfDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download LinkedIn PDF</span>
                        </a>
                      )}
                    </div>

                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#050608] border border-white/10 shadow-xl flex items-center justify-center">
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
                            aria-label="Previous Slide"
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-30 cursor-pointer backdrop-blur-sm transition-opacity"
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
                            aria-label="Next Slide"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-30 cursor-pointer backdrop-blur-sm transition-opacity"
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
                            aria-label={`Select Slide ${idx + 1}`}
                            className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                              activeSlideIndex === idx
                                ? "border-cyan-400 scale-105 shadow-md shadow-cyan-500/20"
                                : "border-white/10 opacity-60 hover:opacity-100"
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
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                          Post Title
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {generationResult.draft.postTitle}
                        </h3>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                            Generated Post Caption
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCaption}
                            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                          >
                            {copiedCaption ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCaption ? "Copied!" : "Copy Caption"}</span>
                          </button>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#08090d] border border-white/10 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-sans">
                          {generationResult.draft.postCaption}
                          {generationResult.draft.postHashtags.length > 0 && (
                            <div className="mt-3 text-cyan-400 font-mono">
                              {generationResult.draft.postHashtags.join(" ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => {
                          setGenerationResult(null);
                          setRunStep(0);
                        }}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer font-semibold"
                      >
                        Run Another Test
                      </button>

                      <Link
                        href="/inbox"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-blue-500/20"
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

      {/* Delete Confirmation Modal */}
      {workflowToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-red-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Workflow Pipeline?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300">
              <span className="font-semibold text-white block">{workflowToDelete.name}</span>
              <span className="text-slate-400 text-[11px]">
                {workflowToDelete.sourcePlatform} → {workflowToDelete.destinationPlatform} ({workflowToDelete.outputFormat})
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setWorkflowToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full glass-pill hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-500/20 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete Pipeline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 max-w-sm text-xs font-medium ${
              toast.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200 shadow-emerald-500/10"
                : toast.type === "error"
                ? "bg-red-950/80 border-red-500/40 text-red-200 shadow-red-500/10"
                : "bg-[#101422]/90 border-cyan-500/30 text-cyan-200 shadow-cyan-500/10"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === "error" ? (
              <X className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-white/50 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
        <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading Workflows Studio...</p>
      </div>
    }>
      <WorkflowsContent />
    </Suspense>
  );
}
