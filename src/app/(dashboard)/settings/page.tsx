"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sliders,
  Layers,
  Sparkles,
  AlertTriangle,
  Info,
  Check,
  Zap,
  ArrowRight,
  Activity,
  CheckCircle2,
  Eye,
  Type,
  Image as ImageIcon,
} from "lucide-react";

export default function SettingsPage() {
  const [resolutionMode, setResolutionMode] = useState<"dropdown_mapper" | "heuristic_auto">("dropdown_mapper");
  const [isSaved, setIsSaved] = useState(false);
  const [showInspector, setShowInspector] = useState(true);

  // Load initial preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("repurpose_resolution_mode");
      if (savedMode === "dropdown_mapper" || savedMode === "heuristic_auto") {
        setResolutionMode(savedMode);
      }
    }
  }, []);

  const handleSelectMode = (mode: "dropdown_mapper" | "heuristic_auto") => {
    setResolutionMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("repurpose_resolution_mode", mode);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, mode: "dropdown_mapper" | "heuristic_auto") => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelectMode(mode);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#08090d] rounded-[15px] flex items-center justify-center">
                <Sliders className="w-5 h-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-display">
                Engine &amp; Studio Settings
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Configure global AI template interpretation and layer resolution preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry & Save Status */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {isSaved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold animate-in fade-in duration-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Saved to Preferences</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Gemini &amp; Templated.io Online</span>
          </div>
        </div>
      </div>

      {/* 1. Global Layer Resolution Strategy Mode Selection */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Template Layer Resolution Strategy</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Choose how the AI workflow engine maps synthesized slide content onto canvas layers.
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono self-start sm:self-auto">
            Strategy: <span className="text-cyan-300 font-bold">{resolutionMode === "dropdown_mapper" ? "Deterministic" : "Autonomous Heuristic"}</span>
          </span>
        </div>

        {/* Accessible Radiogroup */}
        <div
          role="radiogroup"
          aria-label="Template Layer Resolution Strategy"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1"
        >
          {/* Option 1: Dropdown Mapper (Default & Recommended) */}
          <div
            role="radio"
            aria-checked={resolutionMode === "dropdown_mapper"}
            tabIndex={0}
            onClick={() => handleSelectMode("dropdown_mapper")}
            onKeyDown={(e) => handleKeyDown(e, "dropdown_mapper")}
            className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-4 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090d] ${
              resolutionMode === "dropdown_mapper"
                ? "bg-gradient-to-b from-blue-950/40 to-blue-900/10 border-blue-500/60 shadow-xl shadow-blue-500/15 text-white"
                : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] text-slate-300 hover:bg-white/[0.04]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${resolutionMode === "dropdown_mapper" ? "bg-blue-500/20 text-cyan-300 shadow-inner" : "bg-white/5 text-slate-400"}`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Explicit Visual Layer Mapping
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Manual Template Binding
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 font-semibold border border-blue-500/30">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Uses the explicit layer bindings configured per template in the Studio. Guarantees 100% precision for headlines, body copy, and background images.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-cyan-300 font-medium pt-2 border-t border-white/[0.06]">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Deterministic • Zero AI layer guesswork</span>
            </div>
          </div>

          {/* Option 2: Smart Heuristic Auto-Detection */}
          <div
            role="radio"
            aria-checked={resolutionMode === "heuristic_auto"}
            tabIndex={0}
            onClick={() => handleSelectMode("heuristic_auto")}
            onKeyDown={(e) => handleKeyDown(e, "heuristic_auto")}
            className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-4 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090d] ${
              resolutionMode === "heuristic_auto"
                ? "bg-gradient-to-b from-amber-950/40 to-amber-900/10 border-amber-500/60 shadow-xl shadow-amber-500/15 text-white"
                : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] text-slate-300 hover:bg-white/[0.04]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${resolutionMode === "heuristic_auto" ? "bg-amber-500/20 text-amber-300 shadow-inner" : "bg-white/5 text-slate-400"}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Smart Heuristic Auto-Detection
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Autonomous Geometry Inference
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Autonomous
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Dynamically resolves layers based on font size (largest text layer = headline) and canvas bounding boxes without requiring prior template configuration.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-amber-300 font-medium pt-2 border-t border-white/[0.06]">
              <Info className="w-3.5 h-3.5" />
              <span>Fully automated • Fast prototyping</span>
            </div>
          </div>
        </div>

        {/* Heuristic Notice */}
        {resolutionMode === "heuristic_auto" && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Important Note on Heuristic Auto-Detection:</span>
              <p className="text-[11px] text-amber-200/90 leading-relaxed font-sans">
                Heuristic auto-detection infers layers automatically based on font dimensions and coordinate positions. It may misidentify decorative typography or multi-column text if your custom template deviates from standard headline/body hierarchies.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive Live Dry-Run / Layer Resolution Inspector */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white font-display">
              Live Resolution Simulator (Sample Carousel Slide)
            </h2>
          </div>
          <button
            onClick={() => setShowInspector(!showInspector)}
            className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer transition-colors"
          >
            {showInspector ? "Hide Simulation" : "Show Simulation"}
          </button>
        </div>

        {showInspector && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Layer 1 */}
              <div className="p-3.5 rounded-2xl bg-[#08090d] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Type className="w-3.5 h-3.5 text-cyan-400" />
                    <span>layer_title (48px font)</span>
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    {resolutionMode === "dropdown_mapper" ? "Explicit Hook" : "Heuristic #1 (Largest)"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-slate-300 font-sans">
                  &quot;3 Strategic Shift Principles for 2026&quot;
                </div>
              </div>

              {/* Layer 2 */}
              <div className="p-3.5 rounded-2xl bg-[#08090d] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Type className="w-3.5 h-3.5 text-blue-400" />
                    <span>layer_body (18px font)</span>
                  </span>
                  <span className="font-mono text-[10px] text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    {resolutionMode === "dropdown_mapper" ? "Explicit Body" : "Heuristic #2 (Paragraph)"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-slate-400 font-sans">
                  &quot;High-performing teams repurpose core narrative assets across networks...&quot;
                </div>
              </div>

              {/* Layer 3 */}
              <div className="p-3.5 rounded-2xl bg-[#08090d] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>layer_background_img</span>
                  </span>
                  <span className="font-mono text-[10px] text-purple-400 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                    Image Slot (1080×1350)
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-slate-400 font-mono">
                  Cloudinary / Unsplash Dynamic Fill
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              * The workflow execution engine will apply the active mode (
              <span className="text-slate-300 font-semibold">{resolutionMode === "dropdown_mapper" ? "Explicit Mapping" : "Autonomous Heuristic"}</span>
              ) whenever processing incoming blog articles and RSS feeds.
            </p>
          </div>
        )}
      </div>

      {/* 3. Template Configuration Navigation Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Individual Template Layer Configuration</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Explicit layer mappings (Headline Hook, Body Text, Background Image, and Slide Counter) are configured directly per template in the Templates Studio.
            </p>
          </div>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <span>Open Template Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
