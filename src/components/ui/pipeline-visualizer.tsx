"use client";

import React from "react";
import { Globe, Sparkles, Layers, FileText, Check } from "lucide-react";

export function PipelineVisualizer() {
  return (
    <div className="relative w-full max-w-5xl mx-auto p-8 sm:p-12 rounded-3xl overflow-hidden backdrop-blur-2xl transition-all duration-300 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(56,189,248,0.25),transparent_70%),rgba(14,16,23,0.88)] border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(56,189,248,0.15)]">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
        {/* Left: Engine Summary */}
        <div className="lg:w-1/2 space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Publishing Flow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight leading-tight">
            From Raw Article to Client-Ready Slide Deck in Seconds.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Connect your blog or RSS feed once. Our Gemini prompt chain extracts the core insights and paints them across your brand templates with deterministic layer alignment.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>LinkedIn PDF</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>Instagram 4:5 Deck</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>Social Thumbnails</span>
            </div>
          </div>
        </div>

        {/* Right: Visual Layer Fan Preview */}
        <div className="lg:w-1/2 relative flex items-center justify-center py-6">
          {/* Stacked 3D Slide Cards */}
          <div className="relative w-64 h-80 sm:w-72 sm:h-88">
            {/* Back Card */}
            <div className="absolute inset-0 rounded-2xl bg-[#151824] border border-white/10 shadow-xl transform rotate-6 translate-x-4 translate-y-2 opacity-60" />
            {/* Middle Card */}
            <div className="absolute inset-0 rounded-2xl bg-[#0e1017] border border-cyan-500/30 shadow-2xl transform -rotate-3 -translate-x-2 -translate-y-1 opacity-85" />
            {/* Front Card */}
            <div className="absolute inset-0 rounded-2xl bg-[#08090d] border border-cyan-400/50 p-6 flex flex-col justify-between shadow-2xl shadow-cyan-500/20 transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">Slide 01 // Hook</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">1080 × 1350</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold font-display text-white leading-snug">
                  5 Lessons Scaling AI SaaS to $100k MRR.
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                  High-converting social carousels start with a high-density thesis statement and crisp takeaways.
                </p>
              </div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Alex Rivers • Product Strategy</span>
                <span className="text-cyan-300">Swipe ➔</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
