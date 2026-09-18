"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ExternalLink } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050608] relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/[0.06]">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-[1px] shadow-md shadow-blue-500/20">
                <div className="w-full h-full bg-[#08090d] rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                </div>
              </div>
              <span className="font-bold tracking-tight text-white text-base">
                Repurpose<span className="text-cyan-400">Studio</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The autonomous AI content repurposing pipeline. Turn blogs, articles, and RSS feeds into high-converting multi-slide social carousels and visual assets.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Engine Systems Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Product</span>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  Core Features
                </Link>
              </li>
              <li>
                <Link href="/use-cases" className="hover:text-white transition-colors">
                  Use Cases
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="hover:text-white transition-colors">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Studio Links */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Studio Hub</span>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/workflows" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <span>Pipeline Studio</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                </Link>
              </li>
              <li>
                <Link href="/templates" className="hover:text-white transition-colors">
                  Template Canvases
                </Link>
              </li>
              <li>
                <Link href="/inbox" className="hover:text-white transition-colors">
                  Approval Inbox
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-white transition-colors">
                  Engine Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Integration Links */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Integrations</span>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="https://templated.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Templated.io Canvas</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <span className="text-slate-400">Gemini 2.0 Flash AI</span>
              </li>
              <li>
                <span className="text-slate-400">Unsplash Stock Visuals</span>
              </li>
              <li>
                <span className="text-slate-400">LinkedIn PDF Exporter</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} RepurposeStudio Inc. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-slate-400 transition-colors">
              Terms &amp; Privacy
            </Link>
            <Link href="/changelog" className="hover:text-slate-400 transition-colors">
              Security Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
