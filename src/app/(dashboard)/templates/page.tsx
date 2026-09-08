"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutTemplate,
  Plus,
  ExternalLink,
  Layers,
  Sparkles,
  Trash2,
  Check,
  RefreshCw,
  Edit3,
  Ratio,
  SlidersHorizontal,
  X,
  Eye,
  Info,
} from "lucide-react";

interface LayerMappings {
  headline_layer: string;
  body_layer: string;
  background_layer: string;
  logo_layer: string;
  counter_layer: string;
}

interface BrandTemplate {
  id: string;
  name: string;
  templatedTemplateId: string;
  previewImageUrl: string;
  aspectRatio: string;
  hasBackgroundPlaceholder: boolean;
  layerMappings: LayerMappings;
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<BrandTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);
  const [activeEmbedTemplateId, setActiveEmbedTemplateId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Form State for creating/editing template
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    templatedTemplateId: string;
    previewImageUrl: string;
    aspectRatio: string;
    hasBackgroundPlaceholder: boolean;
    layerMappings: LayerMappings;
  }>({
    name: "",
    templatedTemplateId: "",
    previewImageUrl: "",
    aspectRatio: "1:1",
    hasBackgroundPlaceholder: true,
    layerMappings: {
      headline_layer: "headline_text",
      body_layer: "body_text",
      background_layer: "background_image",
      logo_layer: "brand_logo",
      counter_layer: "slide_counter",
    },
  });

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleOpenCreateModal = () => {
    setFormData({
      name: "Custom Carousel Slide",
      templatedTemplateId: `tmpl_${Date.now().toString().slice(-6)}`,
      previewImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
      aspectRatio: "1:1",
      hasBackgroundPlaceholder: true,
      layerMappings: {
        headline_layer: "headline_text",
        body_layer: "body_text",
        background_layer: "background_image",
        logo_layer: "brand_logo",
        counter_layer: "slide_counter",
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tmpl: BrandTemplate) => {
    setFormData({
      id: tmpl.id,
      name: tmpl.name,
      templatedTemplateId: tmpl.templatedTemplateId,
      previewImageUrl: tmpl.previewImageUrl,
      aspectRatio: tmpl.aspectRatio,
      hasBackgroundPlaceholder: tmpl.hasBackgroundPlaceholder,
      layerMappings: {
        headline_layer: tmpl.layerMappings?.headline_layer || "headline_text",
        body_layer: tmpl.layerMappings?.body_layer || "body_text",
        background_layer: tmpl.layerMappings?.background_layer || "background_image",
        logo_layer: tmpl.layerMappings?.logo_layer || "brand_logo",
        counter_layer: tmpl.layerMappings?.counter_layer || "slide_counter",
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEmbedStudio = (templateId: string) => {
    setActiveEmbedTemplateId(templateId);
    setIsEmbedOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await fetch("/api/v1/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await loadTemplates();
      }
    } catch (err) {
      console.error("Failed to save template:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/v1/templates?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Visual Template Studio & Gallery
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              Task 1.4
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Manage your Templated.io dynamic layer templates and automated slide layout mappings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenEmbedStudio("new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>Launch Embed Studio</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Template</span>
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-zinc-400">Loading saved templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30 space-y-3">
          <LayoutTemplate className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-300">No Templates Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Create or connect your first visual template from Templated.io to start rendering carousel slides.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
          >
            Create Starter Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Preview Image Card */}
              <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.previewImageUrl}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/20" />

                {/* Aspect Ratio Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 text-[11px] font-mono font-medium text-zinc-200">
                  <Ratio className="w-3 h-3 text-emerald-400" />
                  <span>{template.aspectRatio}</span>
                </div>

                {/* Template ID Pill */}
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-zinc-400 border border-white/10">
                  {template.templatedTemplateId}
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {template.hasBackgroundPlaceholder
                      ? "Dynamic Image Placeholder Active"
                      : "Solid Brand Palette Only"}
                  </p>
                </div>

                {/* Dynamic Layer Badges */}
                <div className="pt-2 border-t border-zinc-800/60 space-y-2">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
                    Bound Layers:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(template.layerMappings || {}).map(([key, val]) => (
                      <span
                        key={key}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/70 border border-zinc-700/40 text-zinc-300 font-mono"
                      >
                        {String(val)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEmbedStudio(template.templatedTemplateId)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open in Studio</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(template)}
                    className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    title="Edit Layer Mappings"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 rounded-lg bg-zinc-800/60 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Modal: Template Configuration & Layer Mapping */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-zinc-100">
                  {formData.id ? "Edit Brand Template" : "Add Brand Template"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              {/* Template Name */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Modern Carousel Slide"
                />
              </div>

              {/* Templated.io Template ID */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Templated.io Template ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.templatedTemplateId}
                  onChange={(e) =>
                    setFormData({ ...formData, templatedTemplateId: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="tmpl_xxxxxxxxx"
                />
              </div>

              {/* Preview Image URL */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Preview Image URL
                </label>
                <input
                  type="text"
                  required
                  value={formData.previewImageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, previewImageUrl: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  placeholder="https://..."
                />
              </div>

              {/* Aspect Ratio & BG Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Aspect Ratio
                  </label>
                  <select
                    value={formData.aspectRatio}
                    onChange={(e) =>
                      setFormData({ ...formData, aspectRatio: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="1:1">1:1 (Square Carousel)</option>
                    <option value="4:5">4:5 (Portrait Feed)</option>
                    <option value="16:9">16:9 (Landscape Card)</option>
                    <option value="9:16">9:16 (Story / Reel)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Background Photo
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        hasBackgroundPlaceholder: !formData.hasBackgroundPlaceholder,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                      formData.hasBackgroundPlaceholder
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
                    }`}
                  >
                    {formData.hasBackgroundPlaceholder ? "Enabled (Photo BG)" : "Disabled (Solid BG)"}
                  </button>
                </div>
              </div>

              {/* Layer Mappings Section */}
              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Templated.io Dynamic Layer Mappings</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1">Headline Layer</span>
                    <input
                      type="text"
                      value={formData.layerMappings.headline_layer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          layerMappings: {
                            ...formData.layerMappings,
                            headline_layer: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-[11px] text-zinc-200"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1">Body Text Layer</span>
                    <input
                      type="text"
                      value={formData.layerMappings.body_layer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          layerMappings: {
                            ...formData.layerMappings,
                            body_layer: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-[11px] text-zinc-200"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1">Background Image Layer</span>
                    <input
                      type="text"
                      value={formData.layerMappings.background_layer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          layerMappings: {
                            ...formData.layerMappings,
                            background_layer: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-[11px] text-zinc-200"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1">Brand Logo Layer</span>
                    <input
                      type="text"
                      value={formData.layerMappings.logo_layer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          layerMappings: {
                            ...formData.layerMappings,
                            logo_layer: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-[11px] text-zinc-200"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-zinc-950 transition-colors disabled:opacity-50"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? "Saving..." : "Save Template"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Embedded Templated.io Studio Iframe */}
      {isEmbedOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 md:p-8">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <LayoutTemplate className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  Templated.io Studio Embed
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">
                    Template: {activeEmbedTemplateId || "New"}
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Design dynamic layers in the visual editor. All layers map to RepurposeAI AI engine.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEmbedOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
            >
              Close Studio
            </button>
          </div>

          <div className="flex-1 w-full mt-4 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden relative">
            <iframe
              src={`https://templated.io/embed/${activeEmbedTemplateId || ""}?embed=true`}
              title="Templated.io Visual Studio"
              className="w-full h-full border-0"
              allow="camera; microphone; clipboard-read; clipboard-write;"
            />
          </div>
        </div>
      )}
    </div>
  );
}
