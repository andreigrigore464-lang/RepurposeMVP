"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  GitFork,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Ratio,
  ShieldCheck,
  Palette,
  Play,
  Check,
  ExternalLink,
  Zap,
  Globe,
} from "lucide-react";
import { AmbientGlow } from "@/components/ui/ambient-glow";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { CardHoverEffect } from "@/components/ui/card-hover-effect";
import { PipelineVisualizer } from "@/components/ui/pipeline-visualizer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function HomePage() {
  const bentoFeatures = [
    {
      title: "Dynamic Layer Mapping",
      description:
        "Deterministic layer binding ensures your hooks, body takeaways, and author signatures map with 100% precision into Templated.io canvases.",
      icon: <Layers className="w-5 h-5" />,
      badge: "Precision",
    },
    {
      title: "Information Density Guard",
      description:
        "AI prompt chains analyze content depth to guarantee concise, high-converting slide hooks without generic fluff.",
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: "AI Quality",
    },
    {
      title: "Multi-Format Export",
      description:
        "Instantly compile swipeable LinkedIn PDF carousels, 1:1 Instagram decks, and high-impact quote cards from a single intake.",
      icon: <Ratio className="w-5 h-5" />,
      badge: "Multi-Format",
    },
    {
      title: "Automated Feed Polling",
      description:
        "Connect blog RSS/Atom feeds or individual article URLs. RepurposeStudio synthesizes slide decks on autopilot.",
      icon: <GitFork className="w-5 h-5" />,
      badge: "Automation",
    },
    {
      title: "Brand Kit Injection",
      description:
        "Inject your exact brand palettes, typography scales, and creator badges into every rendered slide asset seamlessly.",
      icon: <Palette className="w-5 h-5" />,
      badge: "Brand Identity",
    },
    {
      title: "Approval Inbox Staging",
      description:
        "1-click review stage allows quick text adjustments and immediate PDF carousel download before distribution.",
      icon: <CheckCircle2 className="w-5 h-5" />,
      badge: "Safe Review",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 antialiased font-sans selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden flex flex-col justify-between">
      {/* Ambient Top Glow */}
      <AmbientGlow variant="combo" />

      {/* Floating Navigation Header */}
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-36 sm:pt-44 pb-20 px-4 sm:px-6 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border border-blue-500/30 text-xs font-semibold text-cyan-300 shadow-lg shadow-blue-500/10 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Gen Content Repurposing Studio</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.08] relative">
          <span className="hero-aurora-halo" />
          Turn One Article Into <span className="hero-laser-text">High-Converting</span> Slide Decks Everywhere.
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Automatically synthesize blog posts and RSS feeds into swipeable LinkedIn PDF carousels, Instagram decks, and social cards with pixel-accurate layer mapping.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/workflows/new">
            <HoverBorderGradient
              containerClassName="rounded-full"
              className="px-6 py-3 font-bold text-xs flex items-center gap-2"
            >
              <span>Create Your First Workflow</span>
              <ArrowRight className="w-4 h-4 text-cyan-300" />
            </HoverBorderGradient>
          </Link>
          <Link
            href="/templates"
            className="px-6 py-3 rounded-full glass-pill hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            Explore Brand Templates
          </Link>
        </div>

        {/* Live Transformation Visualizer */}
        <div className="pt-10">
          <PipelineVisualizer />
        </div>
      </section>

      {/* Bento Grid Feature Matrix */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-10 scroll-mt-28">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block font-mono">
            Full Spectrum Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Built for Peak Creative Execution
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Everything you need to automate multi-slide social distribution without losing control over quality.
          </p>
        </div>

        <CardHoverEffect items={bentoFeatures} />
      </section>

      {/* Comparison Table Section */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block font-mono">
            Why RepurposeStudio
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Three Ways to Repurpose. Only One is Effortless.
          </h2>
        </div>

        <div className="rounded-3xl glass-panel overflow-hidden border border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-4 font-bold text-slate-400">Feature</th>
                  <th className="p-4 font-semibold text-slate-400 text-center">Manual Copy-Paste</th>
                  <th className="p-4 font-semibold text-slate-400 text-center">Generic Schedulers</th>
                  <th className="p-4 font-bold text-cyan-300 text-center bg-blue-500/10">
                    RepurposeStudio
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-300">
                <tr>
                  <td className="p-4 font-medium text-white">Full Slide Deck Synthesis</td>
                  <td className="p-4 text-center text-slate-500">Manual (30 min)</td>
                  <td className="p-4 text-center text-slate-500">Text only</td>
                  <td className="p-4 text-center font-semibold text-cyan-300 bg-blue-500/10">
                    <Check className="w-4 h-4 mx-auto text-emerald-400" />
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Automated LinkedIn PDF Stitching</td>
                  <td className="p-4 text-center text-slate-500">Canva export</td>
                  <td className="p-4 text-center text-slate-500">Not supported</td>
                  <td className="p-4 text-center font-semibold text-cyan-300 bg-blue-500/10">
                    <Check className="w-4 h-4 mx-auto text-emerald-400" />
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Deterministic Layer Mapping</td>
                  <td className="p-4 text-center text-slate-500">Manual adjustments</td>
                  <td className="p-4 text-center text-slate-500">None</td>
                  <td className="p-4 text-center font-semibold text-cyan-300 bg-blue-500/10">
                    <Check className="w-4 h-4 mx-auto text-emerald-400" />
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Brand Palette &amp; Typography Injection</td>
                  <td className="p-4 text-center text-slate-500">Repetitive setup</td>
                  <td className="p-4 text-center text-slate-500">Basic</td>
                  <td className="p-4 text-center font-semibold text-cyan-300 bg-blue-500/10">
                    <Check className="w-4 h-4 mx-auto text-emerald-400" />
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Time per Repurposed Campaign</td>
                  <td className="p-4 text-center text-rose-400 font-mono">45 mins</td>
                  <td className="p-4 text-center text-amber-400 font-mono">15 mins</td>
                  <td className="p-4 text-center font-bold text-emerald-400 bg-blue-500/10 font-mono">
                    Under 10 seconds
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
        <div className="p-10 sm:p-12 rounded-3xl glass-panel-elevated relative overflow-hidden border border-white/15 space-y-6 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-cyan-300 border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready to Accelerate Your Growth?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight max-w-xl mx-auto">
            Start Generating LinkedIn &amp; Instagram Decks Today.
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Connect your blog feed or paste an article to generate client-ready multi-slide carousels in seconds.
          </p>

          <div className="pt-2">
            <Link
              href="/workflows"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 hover:from-blue-500 hover:to-cyan-300 text-zinc-950 font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all active:scale-95"
            >
              <span>Launch Repurpose Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
