"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  LayoutTemplate,
  GitFork,
  Inbox,
  Settings,
  Sparkles,
  ChevronDown,
  Layers,
  ExternalLink,
} from "lucide-react";
import React from "react";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/brand-kits",
    icon: LayoutDashboard,
  },
  {
    name: "Brand Kits",
    href: "/brand-kits",
    icon: Palette,
  },
  {
    name: "Templates",
    href: "/templates",
    icon: LayoutTemplate,
  },
  {
    name: "Workflows",
    href: "/workflows",
    icon: GitFork,
  },
  {
    name: "Approval Inbox",
    href: "/inbox",
    icon: Inbox,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 antialiased font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl flex flex-col justify-between shrink-0 sticky top-0 h-screen">
        <div>
          {/* App Branding */}
          <div className="p-5 border-b border-zinc-800/60 flex items-center justify-between">
            <Link href="/brand-kits" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-5 h-5 text-zinc-950 font-bold" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
                  Repurpose<span className="text-emerald-400">AI</span>
                </span>
                <span className="text-[11px] text-zinc-400 font-medium block">
                  Content Repurposing Engine
                </span>
              </div>
            </Link>
          </div>

          {/* Workspace Pill */}
          <div className="px-4 py-3">
            <div className="px-3 py-2 rounded-lg bg-zinc-800/40 border border-zinc-700/40 flex items-center justify-between text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-zinc-200 truncate max-w-[130px]">
                  Default Workspace
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            <div className="px-3 pb-1.5 pt-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              Navigation
            </div>
            {NAV_ITEMS.map((item, index) => {
              const Icon = item.icon;
              // For Dashboard vs Brand Kits, match specifically or active route
              const isActive =
                index === 0
                  ? pathname === "/"
                  : pathname === item.href || (pathname?.startsWith(`${item.href}/`) && item.href !== "/");
              return (
                <Link
                  key={`${item.name}-${item.href}`}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? "text-emerald-400"
                          : "text-zinc-500 group-hover:text-zinc-300"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/60 space-y-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800/80 border border-zinc-700/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Templated.io Studio
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Design and render social carousels and visual cards automatically.
            </p>
          </div>

          <a
            href="https://templated.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-[11px] text-zinc-500 hover:text-zinc-300 px-2 transition-colors"
          >
            <span>Open Templated.io</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-400">Workspace</span>
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-semibold text-zinc-200 capitalize">
              {pathname?.split("/")[1]?.replace("-", " ") || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xs font-bold text-zinc-950 ring-2 ring-emerald-500/30">
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
