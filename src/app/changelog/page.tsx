"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Layers,
  GitFork,
  CheckCircle2,
  Sliders,
  Calendar,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { AmbientGlow } from "@/components/ui/ambient-glow";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function ChangelogPage() {
  const releases = [
    {
      version: "v1.2.0",
      date: "September 18, 2026",
      title: "Multi-Ratio Canvases, Live Repurpose Runner & Accessible Keyboard Controls",
      badge: "Latest Release",
      isLatest: true,
      highlights: [
        {
          tag: "Canvas Studio",
          title: "Full Aspect Ratio Support",
          description:
            "Added live segmented filtering and automated layer mapping for 4:5 Portrait Carousels, 16:9 Landscape banners, and 1:1 Square Instagram slides.",
        },
        {
          tag: "Interactive Engine",
          title: "Real-Time Ingestion Runner",
          description:
            "Watch Gemini Flash AI scrape, synthesize, render Templated.io slides, and compile LinkedIn PDFs step-by-step with live timing telemetry.",
        },
        {
          tag: "UX Polish",
          title: "Glassmorphic Notifications & Keyboard Shortcuts",
          description:
            "Cycle slide previews instantly with ArrowLeft / ArrowRight keys. Replaced native browser alerts with dark-mode glass toasts and soft delete dialogs.",
        },
      ],
    },
    {
      version: "v1.1.0",
      date: "August 29, 2026",
      title: "Gemini Flash Prompt Chains & Information Density Filtering",
      badge: "Major Update",
      isLatest: false,
      highlights: [
        {
          tag: "AI Engine",
          title: "Information Density Guard",
          description:
            "Strict negative constraints eliminate generic filler words from slide copy, ensuring punchy, high-converting social hooks.",
        },
        {
          tag: "Automation",
          title: "Background Visual Heuristics",
          description:
            "Configurable visual strategies: Article Hero Image First, Unsplash AI keyword lookup, or sleek Minimalist Brand Gradient themes.",
        },
        {
          tag: "Approval Inbox",
          title: "1-Click PDF Download & Copy Hashtags",
          description:
            "Staged drafts can be edited in place, downloaded as high-res LinkedIn PDFs, and copied with pre-formatted hashtags.",
        },
      ],
    },
    {
      version: "v1.0.0",
      date: "August 10, 2026",
      title: "Initial Public Release: Autonomous Content Repurposing MVP",
      badge: "Initial Launch",
      isLatest: false,
      highlights: [
        {
          tag: "Core Platform",
          title: "Automated RSS & URL Scraping",
          description:
            "Connect blog RSS feeds or paste single article URLs for automated ingestion and slide creation.",
        },
        {
          tag: "Integration",
          title: "Templated.io Dynamic Layer Mapping",
          description:
            "Deterministic schema matching links AI hook titles, body bullet points, and creator avatars to Templated.io graphic canvas layers.",
        },
        {
          tag: "Packaging",
          title: "LinkedIn Multi-Slide PDF Stitches",
          description:
            "Automated PDF document compilation tailored specifically to LinkedIn's document carousel upload format.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 antialiased font-sans selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden flex flex-col justify-between">
      {/* Ambient Lighting */}
      <AmbientGlow variant="combo" />

      {/* Floating Navigation */}
      <MarketingNav />

      {/* Main Content */}
      <main className="pt-36 sm:pt-44 pb-24 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-16 relative z-10">
        {/* Title Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border border-blue-500/30 text-xs font-semibold text-cyan-300 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Product Updates &amp; Releases</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Changelog &amp; Engine Updates
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            See everything new we’ve shipped to the RepurposeStudio platform and AI synthesis engine.
          </p>
        </div>

        {/* Timeline List */}
        <div className="space-y-12 relative before:absolute before:inset-0 before:left-3 sm:before:left-4 before:w-[2px] before:bg-white/[0.08]">
          {releases.map((rel, idx) => (
            <div key={rel.version} className="relative pl-8 sm:pl-12 space-y-5">
              {/* Timeline Dot */}
              <div
                className={`absolute left-1.5 sm:left-2.5 top-1.5 w-3.5 h-3.5 rounded-full -translate-x-1/2 border-2 ${
                  rel.isLatest
                    ? "bg-cyan-400 border-cyan-300 shadow-lg shadow-cyan-400/50"
                    : "bg-[#08090d] border-slate-500"
                }`}
              />

              {/* Version Header Card */}
              <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xl font-mono font-bold text-white">
                      {rel.version}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        rel.isLatest
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-white/5 text-slate-400 border border-white/10"
                      }`}
                    >
                      {rel.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{rel.date}</span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  {rel.title}
                </h3>

                {/* Highlights */}
                <div className="space-y-4">
                  {rel.highlights.map((item, hIdx) => (
                    <div
                      key={hIdx}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          {item.tag}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 rounded-3xl glass-panel-elevated text-center space-y-4 border border-cyan-500/30">
          <h3 className="text-xl font-bold text-white">
            Ready to test the latest features in the Studio?
          </h3>
          <p className="text-xs text-slate-300">
            Open the Studio to create new pipelines, test live article intake, and export LinkedIn carousels.
          </p>
          <div className="pt-2">
            <Link
              href="/workflows"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <MarketingFooter />
    </div>
  );
}
