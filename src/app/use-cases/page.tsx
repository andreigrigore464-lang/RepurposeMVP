"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  GitFork,
  CheckCircle2,
  Users,
  Briefcase,
  PenTool,
  Layers,
  Zap,
  Globe,
  Ratio,
  FileText,
} from "lucide-react";
import { AmbientGlow } from "@/components/ui/ambient-glow";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function UseCasesPage() {
  const [activeTab, setActiveTab] = useState<"founders" | "marketing" | "agencies">("founders");

  const useCases = {
    founders: {
      title: "For Founders & Tech Executives",
      subtitle: "Turn deep industry insights and Substacks into high-converting personal brand carousels in 30 seconds.",
      metric: "+410%",
      metricLabel: "More LinkedIn Profile Views",
      painPoint: "Writing long essays takes hours, but condensing them into visual slides takes even longer.",
      solution: "RepurposeStudio extracts your best contrarian hooks, synthesizes core bullet points, and styles them in your executive brand kit automatically.",
      workflowSteps: [
        "Paste your latest essay, Substack, or podcast transcript URL.",
        "Gemini Flash AI extracts punchy 1-sentence slide takeaways and hook headlines.",
        "Templated.io renders your signature font, avatar, and minimalist layout.",
        "Download the LinkedIn PDF ready for 1-click publishing.",
      ],
      sampleDeck: [
        { slide: 1, text: "Why 90% of AI Wrappers Will Die in 2026 (And What Wins)" },
        { slide: 2, text: "1. The Context Moat: Why UI is the new distribution vector." },
        { slide: 3, text: "2. Layer-Aware Rendering: Static images are dead." },
        { slide: 4, text: "3. The Autonomous Repurposing Loop: Real-time RSS." },
        { slide: 5, text: "The Takeaway: Build systems, not one-off posts." },
      ],
    },
    marketing: {
      title: "For B2B Marketing & Growth Teams",
      subtitle: "Transform technical engineering blogs into multi-platform visual assets on full autopilot.",
      metric: "12 hrs/wk",
      metricLabel: "Saved on Social Production",
      painPoint: "Great content gets buried because marketing teams lack the bandwidth to design daily graphic decks.",
      solution: "Connect your company blog RSS feed. Every new product launch or engineering post automatically generates gated drafts in your Approval Inbox.",
      workflowSteps: [
        "Connect your engineering blog RSS feed once in the Workflow Wizard.",
        "Automated polling detects new articles and synthesizes multi-slide carousels.",
        "Brand kit automatically injects your corporate color palette and logo.",
        "Review staged drafts in the Approval Inbox before pushing to company social channels.",
      ],
      sampleDeck: [
        { slide: 1, text: "How We Scaled Our Postgres Cluster to 100k Queries/sec" },
        { slide: 2, text: "The Bottleneck: Connection pool starvation under spike load." },
        { slide: 3, text: "The Architecture Fix: Dedicated read replicas & query sharding." },
        { slide: 4, text: "The Benchmark: 99.9th percentile latency dropped to 4ms." },
        { slide: 5, text: "Read the full case study on our engineering blog." },
      ],
    },
    agencies: {
      title: "For Ghostwriters & Social Agencies",
      subtitle: "Manage 10+ client pipelines with isolated brand kits and automated approval staging.",
      metric: "5x Output",
      metricLabel: "Per Creator Headcount",
      painPoint: "Client design bottlenecks slow down delivery and limit the number of retainers you can scale.",
      solution: "Set up individual client RSS feeds with unique template mapping. Review, tweak, and deliver branded LinkedIn PDF decks in seconds.",
      workflowSteps: [
        "Create dedicated client pipelines with tailored visual themes.",
        "Ingest client draft docs or live published articles.",
        "Quickly polish captions and slide copies in the built-in Approval Inbox.",
        "Export finished PDF bundles for client scheduling.",
      ],
      sampleDeck: [
        { slide: 1, text: "The 5 Frameworks Top CMOs Use to Allocate $10M Budgets" },
        { slide: 2, text: "Framework 1: The 70-20-10 Experimentation Matrix." },
        { slide: 3, text: "Framework 2: Blended CAC vs Channel-Specific Payback." },
        { slide: 4, text: "Framework 3: Organic Distribution Multipliers." },
        { slide: 5, text: "Save this cheat sheet for your next quarterly review." },
      ],
    },
  };

  const current = useCases[activeTab];

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 antialiased font-sans selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden flex flex-col justify-between">
      {/* Ambient Lighting */}
      <AmbientGlow variant="combo" />

      {/* Floating Navigation */}
      <MarketingNav />

      {/* Main Content */}
      <main className="pt-36 sm:pt-44 pb-24 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-16 relative z-10">
        {/* Title Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border border-blue-500/30 text-xs font-semibold text-cyan-300 shadow-sm">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Built for Modern Content Creators</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Tailored Solutions for High-Output Creators &amp; Teams
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Discover how founders, marketing teams, and ghostwriting agencies use RepurposeStudio to 10x their organic reach.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-center">
          <div className="p-1.5 rounded-full glass-panel border border-white/10 flex items-center gap-2 max-w-md w-full justify-between">
            <button
              type="button"
              onClick={() => setActiveTab("founders")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "founders"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Founders</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("marketing")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "marketing"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>B2B Marketing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("agencies")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "agencies"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Agencies</span>
            </button>
          </div>
        </div>

        {/* Active Use Case Deep Dive Card */}
        <div className="p-8 sm:p-10 rounded-3xl glass-panel border border-white/10 shadow-2xl space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-white/[0.08]">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {current.title}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {current.subtitle}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center shrink-0 min-w-[180px]">
              <span className="text-3xl font-extrabold text-cyan-300 font-mono block">
                {current.metric}
              </span>
              <span className="text-xs text-slate-400 font-medium block mt-1">
                {current.metricLabel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: Workflow Steps & Pain Point */}
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  The Problem
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {current.painPoint}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 space-y-1.5">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                  The RepurposeStudio Solution
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {current.solution}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Automated Pipeline Steps
                </h3>
                <div className="space-y-2.5">
                  {current.workflowSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-cyan-300 flex items-center justify-center shrink-0 font-mono text-[10px] font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Interactive Slide Deck Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sample Generated Slide Deck</span>
                </span>
                <span className="text-[10px] text-cyan-300 font-mono bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                  5 Slides • 4:5 Portrait
                </span>
              </div>

              <div className="space-y-2.5">
                {current.sampleDeck.map((slide) => (
                  <div
                    key={slide.slide}
                    className="p-3.5 rounded-2xl bg-[#0e1017] border border-white/10 flex items-center gap-3.5 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-xs font-bold font-mono text-cyan-300">
                      {slide.slide}
                    </div>
                    <span className="text-xs text-slate-200 font-medium">
                      {slide.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href="/workflows/new"
                  className="w-full py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Build This Workflow in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Audience Grid Mini Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-6 rounded-3xl glass-panel space-y-3 border border-white/10">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">Substack &amp; Medium Writers</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never let an article die after publication. Automatically generate 5 promotional swipe decks for LinkedIn and X.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel space-y-3 border border-white/10">
            <GitFork className="w-6 h-6 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Engineering &amp; SaaS Blogs</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Condense deep architectural postmortems and release notes into digestible carousel summaries.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel space-y-3 border border-white/10">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h4 className="text-sm font-bold text-white">Social Marketing Agencies</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scale client content pipelines with automated intake, isolated brand kits, and approval staging.
            </p>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <MarketingFooter />
    </div>
  );
}
