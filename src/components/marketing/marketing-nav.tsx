"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";

export function MarketingNav() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Features", href: "/#features", isAnchor: true },
    { name: "Use Cases", href: "/use-cases", isAnchor: false },
    { name: "Pricing", href: "/pricing", isAnchor: false },
    { name: "Changelog", href: "/changelog", isAnchor: false },
  ];

  return (
    <header className="fixed top-5 inset-x-0 z-50 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="rounded-full glass-panel px-5 py-3 flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-2xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
            <div className="w-full h-full bg-[#08090d] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform duration-200" />
            </div>
          </div>
          <span className="font-bold tracking-tight text-white flex items-center gap-1 text-sm">
            Repurpose<span className="text-cyan-400">Studio</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          {navLinks.map((link) => {
            const isActive = !link.isAnchor && pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors duration-200 relative py-1 ${
                  isActive
                    ? "text-cyan-300 font-semibold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <span>{link.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth & Bridge Controls */}
        <div className="flex items-center gap-2.5">
          <Show when="signed-in">
            <Link
              href="/workflows"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-95 duration-200 cursor-pointer"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <div className="pl-1 flex items-center">
              <UserButton />
            </div>
          </Show>

          <Show when="signed-out">
            <Link
              href="/waitlist?mode=sign-in"
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/waitlist?mode=sign-up"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-95 duration-200 cursor-pointer"
            >
              <span>Join Waitlist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Show>
        </div>
      </div>
    </header>
  );
}
