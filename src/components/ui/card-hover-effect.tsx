"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export const CardHoverEffect = ({
  items,
  className,
}: {
  items: {
    id?: string;
    title: string;
    description: string;
    link?: string;
    badge?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  }[];
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4",
        className
      )}
    >
      {items.map((item, idx) => {
        const Wrapper = item.link ? "a" : "div";
        return (
          <Wrapper
            href={item.link}
            key={item.id || item.title || idx}
            className="relative group block p-1 h-full w-full cursor-pointer"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={item.onClick}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className="absolute inset-0 h-full w-full bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent block rounded-2xl -z-0"
                  layoutId="hoverBackground"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.15 },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.98,
                    transition: { duration: 0.15, delay: 0.05 },
                  }}
                />
              )}
            </AnimatePresence>
            <div className="relative z-10 h-full rounded-2xl p-5 glass-panel border border-white/[0.08] group-hover:border-blue-500/30 transition-colors duration-200">
              <div className="flex items-start justify-between gap-3 mb-3">
                {item.icon && (
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:text-cyan-300 group-hover:scale-105 transition-all duration-200">
                    {item.icon}
                  </div>
                )}
                {item.badge && (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full glass-pill text-blue-300 border border-blue-500/20">
                    {item.badge}
                  </span>
                )}
              </div>
              <h4 className="text-base font-semibold tracking-tight text-white group-hover:text-blue-200 transition-colors">
                {item.title}
              </h4>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
};
