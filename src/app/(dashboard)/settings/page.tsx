"use client";

import React from "react";
import Link from "next/link";
import {
  Sliders,
  Layers,
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2,
  Cpu,
  Cloud,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function SettingsPage() {
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
                System telemetry, connected integrations, and studio configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry Status */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>All Engines Operational</span>
          </div>
        </div>
      </div>

      {/* 1. Integration Status Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Core AI &amp; Rendering Services</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gemini AI */}
          <div className="p-5 rounded-3xl glass-panel space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Connected</span>
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Google Gemini 2.5 Flash</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Powers real-time article comprehension, hook generation, concise slide takeaways, and viral LinkedIn captions.
              </p>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono pt-2 border-t border-white/[0.06]">
              Low latency • High accuracy
            </div>
          </div>

          {/* Templated.io Engine */}
          <div className="p-5 rounded-3xl glass-panel space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Connected</span>
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Templated.io Visual Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Renders high-resolution image canvases with dynamic typography, layers, and automated PDF carousel compilation.
              </p>
            </div>
            <div className="text-[11px] text-purple-300 font-mono pt-2 border-t border-white/[0.06]">
              Vector fonts • PNG &amp; PDF Export
            </div>
          </div>

          {/* Cloud Storage & Ingestion */}
          <div className="p-5 rounded-3xl glass-panel space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ready</span>
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Media Ingestion &amp; Storage</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Direct Unsplash stock asset integration, article hero photo scraping, and high-speed Cloudinary storage.
              </p>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono pt-2 border-t border-white/[0.06]">
              Automatic WebP &amp; Optimization
            </div>
          </div>
        </div>
      </div>

      {/* 2. Template Configuration Navigation Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Template Layer Management</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans max-w-2xl">
              Template layers (Headline Hook, Body Takeaways, Hero Background, and Slide Counters) are configured directly per template in the Templates Studio with live visual inspection.
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

      {/* 3. Security & Multi-Tenancy */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel space-y-4">
        <div className="flex items-center gap-2 text-white font-display font-bold text-base">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Security &amp; Isolation</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Your workspace workflows, draft carousels, and templates are scoped to your multi-tenant workspace. External API calls to Templated and Gemini are signed server-side using secure environment vault keys.
        </p>
      </div>
    </div>
  );
}
