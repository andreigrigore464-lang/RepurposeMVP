"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1.2,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>("TOP");

  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const currentIndex = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  };

  const movingMap: Record<Direction, string> = {
    TOP: "radial-gradient(25% 60% at 50% 0%, #38bdf8 0%, rgba(37, 99, 235, 0) 100%)",
    LEFT: "radial-gradient(20% 50% at 0% 50%, #38bdf8 0%, rgba(37, 99, 235, 0) 100%)",
    BOTTOM: "radial-gradient(25% 60% at 50% 100%, #38bdf8 0%, rgba(37, 99, 235, 0) 100%)",
    RIGHT: "radial-gradient(20% 50% at 100% 50%, #38bdf8 0%, rgba(37, 99, 235, 0) 100%)",
  };

  const highlight =
    "radial-gradient(80% 180% at 50% 50%, #38bdf8 0%, #2563eb 50%, rgba(255, 255, 255, 0) 100%)";

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered, duration]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 items-center justify-center p-[1px] decoration-clone w-fit cursor-pointer shadow-lg shadow-blue-500/10",
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          "w-auto text-white z-10 bg-[#0e1017] px-4 py-2 rounded-[inherit] transition-colors duration-200",
          className
        )}
      >
        {children}
      </div>
      <motion.div
        className="flex-none inset-0 overflow-hidden absolute z-0 rounded-[inherit]"
        style={{
          filter: "blur(2px)",
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered
            ? [movingMap[direction], highlight]
            : movingMap[direction],
        }}
        transition={{ ease: "linear", duration: duration ?? 1.2 }}
      />
      <div className="bg-[#0e1017] absolute z-1 flex-none inset-[1px] rounded-[inherit]" />
    </Tag>
  );
}
