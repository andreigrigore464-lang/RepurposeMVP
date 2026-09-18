"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Layers,
  Globe,
  Sliders,
} from "lucide-react";
import { AmbientGlow } from "@/components/ui/ambient-glow";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const tiers = [
    {
      name: "Free Starter",
      tagline: "For individual creators testing AI repurposing workflows.",
      priceMonthly: 0,
      priceAnnual: 0,
      badge: "Free Forever",
      popular: false,
      features: [
        "5 Repurposed Articles / month",
        "1:1 Square Carousel exports",
        "Standard Gemini Flash synthesis",
        "Manual Approval Inbox staging",
        "Community support",
      ],
      ctaText: "Start for Free",
      ctaHref: "/workflows",
    },
    {
      name: "Pro Creator",
      tagline: "For founders, ghostwriters, and active social creators scaling output.",
      priceMonthly: 35,
      priceAnnual: 29,
      badge: "Most Popular",
      popular: true,
      features: [
        "60 Repurposed Articles / month",
        "All Aspect Ratios (4:5, 16:9, 1:1, 9:16)",
        "Automated RSS Feed polling",
        "Custom Brand Kit color & font injection",
        "Unsplash Pro Stock visual lookup",
        "Direct LinkedIn PDF auto-bundling",
        "Priority Gemini 2.0 Flash engine",
      ],
      ctaText: "Launch Pro Studio",
      ctaHref: "/workflows",
    },
    {
      name: "Agency Autopilot",
      tagline: "For marketing agencies & teams managing multi-channel automation.",
      priceMonthly: 99,
      priceAnnual: 79,
      badge: "Full Automation",
      popular: false,
      features: [
        "Unlimited Repurposed Articles",
        "Direct Autopilot Publishing mode",
        "Multi-workspace team collaboration",
        "Custom Templated.io API key connection",
        "Custom Webhook & Zapier triggers",
        "Dedicated account manager & SLA",
      ],
      ctaText: "Contact for Agency",
      ctaHref: "/workflows",
    },
  ];

  const comparisonFeatures = [
    { feature: "Monthly Article Ingest", starter: "5", pro: "60", agency: "Unlimited" },
    { feature: "Carousel Formats", starter: "1:1 Square", pro: "1:1, 4:5, 16:9, 9:16", agency: "All + Custom" },
    { feature: "AI Model Tier", starter: "Gemini Flash", pro: "Gemini 2.0 Flash", agency: "Gemini 2.0 Flash Turbo" },
    { feature: "RSS Auto-Polling", starter: "Manual", pro: "Hourly", agency: "Real-time (5 min)" },
    { feature: "Brand Kits", starter: "1 Kit", pro: "5 Kits", agency: "Unlimited Kits" },
    { feature: "High-Res PDF Export", starter: true, pro: true, agency: true },
    { feature: "Autopilot Direct Publishing", starter: false, pro: false, agency: true },
    { feature: "Custom Webhook Integrations", starter: false, pro: false, agency: true },
  ];

  const faqs = [
    {
      q: "How does the RepurposeStudio credit system work?",
      a: "Each time you submit an article URL or your automated RSS pipeline ingests a post, 1 article credit is used. This includes full scraping, Gemini multi-turn AI synthesis, high-res Templated.io PNG slide rendering, and stitched PDF document generation.",
    },
    {
      q: "Can I use my own Templated.io account and templates?",
      a: "Yes! While RepurposeStudio ships with rich starter templates out-of-the-box, Pro and Agency tiers allow you to connect your Templated.io API key to edit and render your own custom layer layouts.",
    },
    {
      q: "What platforms are supported for slide carousels?",
      a: "We produce standardized multi-slide PDF documents for LinkedIn, downloadable high-res image sets for Instagram carousels, and optimized single-image quote cards for Twitter / X.",
    },
    {
      q: "Can I cancel or change plans anytime?",
      a: "Absolutely. You can upgrade, downgrade, or cancel your subscription at any time with zero lock-in or cancellation penalties.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 antialiased font-sans selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden flex flex-col justify-between">
      {/* Ambient Lighting */}
      <AmbientGlow variant="combo" />

      {/* Floating Navigation */}
      <MarketingNav />

      {/* Main Content */}
      <main className="pt-36 sm:pt-44 pb-24 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-20 relative z-10">
        {/* Header Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border border-blue-500/30 text-xs font-semibold text-cyan-300 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simple, Predictable Creator Pricing</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Turn Articles into Viral Carousels at Any Scale
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Choose the plan that fits your publishing volume. All plans include full Gemini AI synthesis, high-resolution rendering, and LinkedIn PDF bundling.
          </p>

          {/* Billing Switch */}
          <div className="pt-4 flex items-center justify-center gap-3 text-xs font-semibold">
            <span className={!isAnnual ? "text-white" : "text-slate-400"}>Monthly Billing</span>
            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 rounded-full bg-white/[0.08] p-1 border border-white/15 transition-colors cursor-pointer relative"
              aria-label="Toggle annual pricing"
            >
              <div
                className={`w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={isAnnual ? "text-white" : "text-slate-400"}>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                Save 20%
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-7 rounded-3xl glass-panel relative flex flex-col justify-between transition-all duration-300 border ${
                tier.popular
                  ? "border-cyan-400/50 bg-[#0e121d]/90 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/30 md:-translate-y-2"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 text-white text-[11px] font-bold shadow-md shadow-cyan-500/30">
                  {tier.badge}
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                    {!tier.popular && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 font-medium">
                        {tier.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                    {tier.tagline}
                  </p>
                </div>

                <div className="pt-2 pb-4 border-b border-white/[0.08]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white font-mono">
                      ${isAnnual ? tier.priceAnnual : tier.priceMonthly}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ month</span>
                  </div>
                  {isAnnual && tier.priceAnnual > 0 && (
                    <span className="text-[11px] text-cyan-400 mt-1 block">
                      Billed annually (${tier.priceAnnual * 12}/year)
                    </span>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-3 pt-2">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-cyan-300" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href={tier.ctaHref}
                  className={`w-full py-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                    tier.popular
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/25 active:scale-95"
                      : "glass-pill hover:bg-white/10 text-white hover:border-white/20"
                  }`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="space-y-6 pt-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Full Plan Comparison</h2>
            <p className="text-xs text-slate-400">Compare every feature across our tiers.</p>
          </div>

          <div className="rounded-3xl glass-panel border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                    <th className="p-4 font-semibold text-slate-300">Capability</th>
                    <th className="p-4 font-semibold text-slate-300 text-center">Free Starter</th>
                    <th className="p-4 font-semibold text-cyan-300 text-center bg-blue-500/10">Pro Creator</th>
                    <th className="p-4 font-semibold text-slate-300 text-center">Agency Autopilot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {comparisonFeatures.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-slate-200 font-medium">{row.feature}</td>
                      <td className="p-4 text-center text-slate-400">
                        {typeof row.starter === "boolean" ? (
                          row.starter ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <span className="text-slate-600 font-mono">—</span>
                          )
                        ) : (
                          row.starter
                        )}
                      </td>
                      <td className="p-4 text-center text-cyan-200 font-semibold bg-blue-500/5">
                        {typeof row.pro === "boolean" ? (
                          row.pro ? (
                            <Check className="w-4 h-4 text-cyan-400 mx-auto" />
                          ) : (
                            <span className="text-slate-600 font-mono">—</span>
                          )
                        ) : (
                          row.pro
                        )}
                      </td>
                      <td className="p-4 text-center text-slate-300">
                        {typeof row.agency === "boolean" ? (
                          row.agency ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <span className="text-slate-600 font-mono">—</span>
                          )
                        ) : (
                          row.agency
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-6 pt-10 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400">Everything you need to know about our plans and engine.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl glass-panel border border-white/10 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-white">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-cyan-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/[0.04]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 sm:p-10 rounded-3xl glass-panel-elevated text-center space-y-5 border border-cyan-500/30 relative overflow-hidden shadow-2xl">
          <div className="space-y-2 max-w-xl mx-auto relative z-10">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Ready to automate your social slide content?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Start with our free starter tier in under 60 seconds with no credit card required.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 relative z-10">
            <Link
              href="/workflows"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <span>Launch Free Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <MarketingFooter />
    </div>
  );
}
