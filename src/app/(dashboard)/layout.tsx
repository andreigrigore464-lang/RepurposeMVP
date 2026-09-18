"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  GitFork,
  LayoutTemplate,
  Inbox,
  Settings,
  Layers,
  ExternalLink,
  Zap,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import React from "react";
import { AmbientGlow } from "@/components/ui/ambient-glow";

const NAV_ITEMS = [
  {
    name: "Workflows",
    href: "/workflows",
    icon: GitFork,
    badge: null,
  },
  {
    name: "Templates",
    href: "/templates",
    icon: LayoutTemplate,
    badge: null,
  },
  {
    name: "Approval Inbox",
    href: "/inbox",
    icon: Inbox,
    badge: "3",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    badge: null,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#08090d] text-slate-100 antialiased font-sans selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden">
      {/* Ambient Top Glow */}
      <AmbientGlow variant="combo" />

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/[0.07] bg-[#0c0e15]/80 backdrop-blur-2xl flex flex-col justify-between shrink-0 sticky top-0 h-screen z-40">
        <div>
          {/* App Branding */}
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <Link href="/" title="View Landing Page" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                <div className="w-full h-full bg-[#08090d] rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform duration-200" />
                </div>
              </div>
              <div>
                <span className="font-bold tracking-tight text-white flex items-center gap-1 text-base">
                  Repurpose<span className="text-cyan-400">Studio</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  AI Content Transformer
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2 pt-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Studio Navigation
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (pathname?.startsWith(`${item.href}/`) && item.href !== "/");
              return (
                <Link
                  key={`${item.name}-${item.href}`}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/15 via-cyan-500/10 to-transparent text-white border border-blue-500/30 shadow-sm shadow-blue-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? "text-cyan-400"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-blue-500/20 text-cyan-300 border border-blue-500/30"
                          : "bg-white/[0.06] text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] space-y-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Rendering Engine
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Automated slide rendering &amp; PDF carousels connected.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <Link
              href="/"
              className="flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-300 px-2 py-1 rounded-lg hover:bg-white/[0.03] transition-colors group"
            >
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                <span>Landing Page</span>
              </span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-300" />
            </Link>

            <a
              href="https://templated.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-300 px-2 py-1 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <span>Templated.io Console</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/[0.07] bg-[#08090d]/80 backdrop-blur-2xl px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400">Studio</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-white capitalize">
              {pathname?.split("/")[1]?.replace("-", " ") || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct transition to Landing Page */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-pill hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all border border-white/10 shadow-sm group"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span>Landing Page</span>
            </Link>

            <Link
              href="/workflows/new"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold hover:from-blue-500 hover:to-cyan-400 shadow-md shadow-blue-500/20 transition-all duration-200"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Create Workflow</span>
            </Link>

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-xs font-bold text-white ring-2 ring-blue-500/30">
              WO
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
