"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Palette,
  UploadCloud,
  Check,
  RefreshCw,
  Sparkles,
  Type,
  Sliders,
  Image as ImageIcon,
  Trash2,
  Eye,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";

interface BrandKitData {
  id?: string;
  name: string;
  logoCloudinaryUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

const FONT_OPTIONS = [
  { name: "Inter", fontClass: "font-sans", category: "Clean & Modern (Sans)" },
  { name: "Plus Jakarta Sans", fontClass: "font-sans", category: "Geometric Tech (Sans)" },
  { name: "Roboto", fontClass: "font-sans", category: "Standard Editorial (Sans)" },
  { name: "Montserrat", fontClass: "font-sans", category: "Bold & Expressive (Sans)" },
  { name: "Playfair Display", fontClass: "font-serif", category: "Luxury & Editorial (Serif)" },
  { name: "Space Grotesk", fontClass: "font-mono", category: "Brutalist & Tech (Mono/Display)" },
];

const PRESET_PALETTES = [
  {
    name: "Cyber Neon",
    primary: "#0F172A",
    secondary: "#F8FAFC",
    accent: "#00FF66",
  },
  {
    name: "Electric Violet",
    primary: "#18181B",
    secondary: "#FAFAFA",
    accent: "#8B5CF6",
  },
  {
    name: "Sunset Crimson",
    primary: "#0C0A09",
    secondary: "#FFF7ED",
    accent: "#F97316",
  },
  {
    name: "Deep Ocean",
    primary: "#082F49",
    secondary: "#F0F9FF",
    accent: "#06B6D4",
  },
  {
    name: "Monochrome Pro",
    primary: "#111827",
    secondary: "#FFFFFF",
    accent: "#E5E7EB",
  },
];

export default function BrandKitsPage() {
  const [brandKit, setBrandKit] = useState<BrandKitData>({
    name: "Default Brand Kit",
    logoCloudinaryUrl: null,
    primaryColor: "#0F172A",
    secondaryColor: "#F8FAFC",
    accentColor: "#00FF66",
    fontFamily: "Inter",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [previewMode, setPreviewMode] = useState<"carousel" | "quote">("carousel");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial Brand Kit
  useEffect(() => {
    async function loadBrandKit() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/v1/brand-kits");
        if (res.ok) {
          const data = await res.json();
          if (data.brandKit) {
            setBrandKit({
              id: data.brandKit.id,
              name: data.brandKit.name || "Default Brand Kit",
              logoCloudinaryUrl: data.brandKit.logoCloudinaryUrl || null,
              primaryColor: data.brandKit.primaryColor || "#0F172A",
              secondaryColor: data.brandKit.secondaryColor || "#F8FAFC",
              accentColor: data.brandKit.accentColor || "#00FF66",
              fontFamily: data.brandKit.fontFamily || "Inter",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load brand kit:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBrandKit();
  }, []);

  // Handle Logo Upload via signed Cloudinary route
  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(20);

      // 1. Request signature from API
      const sigRes = await fetch("/api/v1/media/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "repurpose_brand_logos" }),
      });

      const sigData = await sigRes.json();
      setUploadProgress(50);

      if (sigData.success && sigData.apiKey !== "mock_api_key") {
        // Real Cloudinary direct upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp);
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder);

        const uploadRes = await fetch(sigData.uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadResult = await uploadRes.json();
          setBrandKit((prev) => ({
            ...prev,
            logoCloudinaryUrl: uploadResult.secure_url,
          }));
        } else {
          // Fallback to local data URL if credentials not configured in Cloudinary yet
          const reader = new FileReader();
          reader.onload = (e) => {
            setBrandKit((prev) => ({
              ...prev,
              logoCloudinaryUrl: e.target?.result as string,
            }));
          };
          reader.readAsDataURL(file);
        }
      } else {
        // Development / mock fallback: preview as Data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          setBrandKit((prev) => ({
            ...prev,
            logoCloudinaryUrl: e.target?.result as string,
          }));
        };
        reader.readAsDataURL(file);
      }

      setUploadProgress(100);
    } catch (error) {
      console.error("Logo upload failed:", error);
      // Fallback preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBrandKit((prev) => ({
          ...prev,
          logoCloudinaryUrl: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus("idle");

      const res = await fetch("/api/v1/brand-kits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandKit),
      });

      if (res.ok) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("Failed to save brand kit:", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const applyPalette = (palette: (typeof PRESET_PALETTES)[0]) => {
    setBrandKit((prev) => ({
      ...prev,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      accentColor: palette.accent,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-zinc-400">Loading your Brand Identity...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">Brand Kit Studio</h1>
          </div>
          <p className="text-sm text-zinc-400">
            Define your visual identity. These assets and color tokens are injected directly into Templated.io dynamic slide layers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === "success" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Brand Kit Saved</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all duration-150 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isSaving ? "Saving..." : "Save Brand Kit"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brand Kit Name */}
          <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 shadow-sm space-y-4">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Brand Kit Name
            </label>
            <input
              type="text"
              value={brandKit.name}
              onChange={(e) => setBrandKit({ ...brandKit, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="e.g. Acme Studio Flagship"
            />
          </div>

          {/* 1. Logo Asset Uploader */}
          <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  Brand Logo Asset
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  High-resolution PNG or SVG with transparent background recommended.
                </p>
              </div>
              {brandKit.logoCloudinaryUrl && (
                <button
                  onClick={() => setBrandKit({ ...brandKit, logoCloudinaryUrl: null })}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>

            {brandKit.logoCloudinaryUrl ? (
              <div className="p-6 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-zinc-900/80 border border-zinc-700/50 p-2 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brandKit.logoCloudinaryUrl}
                      alt="Brand Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-zinc-200 block">
                      Active Logo Asset
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Cloudinary Linked
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
                >
                  Replace
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-700/60 hover:border-zinc-600 bg-zinc-950/40 hover:bg-zinc-950/60"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mb-3 text-zinc-400">
                  <UploadCloud className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-xs font-medium text-zinc-200">
                  {isUploading ? "Uploading to Cloudinary..." : "Click or drag logo here to upload"}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Supports PNG, SVG, JPG (Max 5MB)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleLogoUpload(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* 2. Color Palette System */}
          <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  Color Palette System
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Applied to background overlays, slide typography, and high-impact highlight layers.
                </p>
              </div>
            </div>

            {/* Quick Preset Badges */}
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Curated Presets
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_PALETTES.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPalette(preset)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-700/80 border border-zinc-700/50 text-xs font-medium text-zinc-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-center -space-x-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full ring-1 ring-zinc-900"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full ring-1 ring-zinc-900"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Primary Color */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">Primary Color</span>
                  <span className="text-[10px] text-zinc-500">Dark / BG</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandKit.primaryColor}
                    onChange={(e) =>
                      setBrandKit({ ...brandKit, primaryColor: e.target.value })
                    }
                    className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandKit.primaryColor}
                    onChange={(e) =>
                      setBrandKit({ ...brandKit, primaryColor: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 font-mono text-xs text-zinc-200 uppercase"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">Secondary Color</span>
                  <span className="text-[10px] text-zinc-500">Light / Text</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandKit.secondaryColor}
                    onChange={(e) =>
                      setBrandKit({ ...brandKit, secondaryColor: e.target.value })
                    }
                    className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandKit.secondaryColor}
                    onChange={(e) =>
                      setBrandKit({ ...brandKit, secondaryColor: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 font-mono text-xs text-zinc-200 uppercase"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">Accent Color</span>
                  <span className="text-[10px] text-emerald-400">Highlights</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandKit.accentColor}
                    onChange={(e) =>
                      setBrandKit({ ...brandKit, accentColor: e.target.value })
                    }
                    className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandKit.accentColor}
                    onChange={(e) =>
                      setBrandKit({ ...brandKit, accentColor: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 font-mono text-xs text-zinc-200 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Typography Configuration */}
          <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-400" />
                Typography Selection
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Font applied to headline hooks, body takeaways, and slide counters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {FONT_OPTIONS.map((font) => {
                const isSelected = brandKit.fontFamily === font.name;
                return (
                  <button
                    key={font.name}
                    onClick={() => setBrandKit({ ...brandKit, fontFamily: font.name })}
                    className={`p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30"
                        : "bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-zinc-200">
                        {font.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="text-[11px] text-zinc-500 block">
                      {font.category}
                    </span>
                    <p
                      className="mt-2 text-sm text-zinc-300 truncate"
                      style={{ fontFamily: font.name }}
                    >
                      Turn 1 Article Into 10 Social Assets
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 shadow-xl sticky top-24 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-zinc-200">Live Brand Preview</span>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center p-1 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs">
                <button
                  onClick={() => setPreviewMode("carousel")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    previewMode === "carousel"
                      ? "bg-zinc-800 text-zinc-100 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Carousel Slide
                </button>
                <button
                  onClick={() => setPreviewMode("quote")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    previewMode === "quote"
                      ? "bg-zinc-800 text-zinc-100 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Social Card
                </button>
              </div>
            </div>

            {/* Live Canvas Mockup */}
            <div className="flex items-center justify-center p-2">
              <div
                className="w-full max-w-sm rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between"
                style={{
                  backgroundColor: brandKit.primaryColor,
                  color: brandKit.secondaryColor,
                  fontFamily: brandKit.fontFamily,
                  aspectRatio: previewMode === "carousel" ? "1 / 1" : "16 / 9",
                  minHeight: previewMode === "carousel" ? "340px" : "220px",
                }}
              >
                {/* Background decorative glow */}
                <div
                  className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: brandKit.accentColor }}
                />

                {/* Top Bar: Brand Logo & Slide Badge */}
                <div className="flex items-center justify-between relative z-10">
                  {brandKit.logoCloudinaryUrl ? (
                    <div className="h-7 max-w-[120px] flex items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={brandKit.logoCloudinaryUrl}
                        alt="Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: brandKit.accentColor }}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                        {brandKit.name || "Brand Kit"}
                      </span>
                    </div>
                  )}

                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded-full font-bold"
                    style={{
                      backgroundColor: `${brandKit.accentColor}25`,
                      color: brandKit.accentColor,
                    }}
                  >
                    1 / 5
                  </span>
                </div>

                {/* Center Content: Headline & Body */}
                <div className="space-y-3 my-auto relative z-10">
                  <h2 className="text-lg sm:text-xl font-extrabold leading-snug tracking-tight">
                    Stop Writing From Scratch.{" "}
                    <span style={{ color: brandKit.accentColor }}>
                      Automate Your Growth.
                    </span>
                  </h2>

                  <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                    Convert 1 deep-dive blog post into 10 multi-slide carousels, viral quotes, and X threads in under 60 seconds.
                  </p>
                </div>

                {/* Footer Bar: Call to Action & Swipe indicator */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] opacity-75 relative z-10 font-medium">
                  <span className="flex items-center gap-1">
                    Swipe next <ArrowRight className="w-3 h-3" />
                  </span>
                  <span className="opacity-60">@repurpose_engine</span>
                </div>
              </div>
            </div>

            {/* Token Legend */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Dynamic Binding Layer Tokens</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-2 text-zinc-300">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: brandKit.primaryColor }}
                  />
                  <span>BG: {brandKit.primaryColor}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: brandKit.secondaryColor }}
                  />
                  <span>Text: {brandKit.secondaryColor}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: brandKit.accentColor }}
                  />
                  <span>Accent: {brandKit.accentColor}</span>
                </div>
                <div className="text-zinc-300 truncate">
                  Font: {brandKit.fontFamily}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
