"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, RefreshCw, Layers, Check, ExternalLink, SlidersHorizontal, Sparkles } from "lucide-react";

interface TemplatedEditorProps {
  templateId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

export function TemplatedEditor({
  templateId,
  isOpen,
  onClose,
  onSaveSuccess,
}: TemplatedEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const embedUrl = `https://app.templated.io/embed/${templateId || "new"}?embed=true&hide_header=true&hide_nav=true`;

  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = async (event: MessageEvent) => {
      // Validate or parse event data from Templated.io iframe
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (!data) return;

        const eventType = data.type || data.event || data.action;

        // 1. Listen for templated:close event
        if (eventType === "templated:close" || eventType === "close") {
          onClose();
          return;
        }

        // 2. Listen for templated:save / templated:template:saved event
        if (
          eventType === "templated:save" ||
          eventType === "templated:template:saved" ||
          eventType === "save" ||
          eventType === "template_saved"
        ) {
          setIsSaving(true);
          const payload = data.payload || data.data || data;

          const tmplId = payload.template_id || payload.id || templateId || `tmpl_${Date.now().toString().slice(-6)}`;
          const tmplName = payload.name || payload.title || "Custom Slide Template";
          const previewUrl = payload.preview_url || payload.render_url || payload.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";
          const aspectRatio = payload.aspect_ratio || (payload.width && payload.height ? (payload.width === payload.height ? "1:1" : payload.width > payload.height ? "16:9" : "4:5") : "1:1");

          // Extract layers if provided in payload
          const layers = payload.layers || payload.layer_names || {};
          const layerMappings = {
            headline_layer: layers.headline_layer || layers.headline || "headline_text",
            body_layer: layers.body_layer || layers.body || "body_text",
            background_layer: layers.background_layer || layers.background || "background_image",
            logo_layer: layers.logo_layer || layers.logo || "brand_logo",
            counter_layer: layers.counter_layer || layers.counter || "slide_counter",
          };

          // Save to RepurposeAI database
          const res = await fetch("/api/v1/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: tmplName,
              templatedTemplateId: tmplId,
              previewImageUrl: previewUrl,
              aspectRatio,
              hasBackgroundPlaceholder: true,
              layerMappings,
            }),
          });

          if (res.ok) {
            setSaveMessage("Template saved successfully!");
            setTimeout(() => {
              setSaveMessage(null);
              if (onSaveSuccess) onSaveSuccess();
              onClose();
            }, 1200);
          }
        }
      } catch (err) {
        console.error("Error processing Templated.io message event:", err);
      } finally {
        setIsSaving(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [isOpen, templateId, onClose, onSaveSuccess]);

  if (!isOpen) return null;

  // Fallback direct save callback for testing/custom designs
  const handleManualSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/v1/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateId ? `Updated Template (${templateId})` : "New Studio Template",
          templatedTemplateId: templateId || `tmpl_${Date.now().toString().slice(-6)}`,
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
        }),
      });

      if (res.ok) {
        setSaveMessage("Template saved to workspace!");
        setTimeout(() => {
          setSaveMessage(null);
          if (onSaveSuccess) onSaveSuccess();
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error("Manual save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 md:p-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              Templated.io Visual Studio
              {templateId && (
                <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
                  {templateId}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Sandboxed visual editor. Changes automatically sync to your workspace templates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {saveMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>{saveMessage}</span>
            </div>
          )}

          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? "Saving..." : "Save Template"}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Close Editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded Sandboxed Iframe Container */}
      <div className="flex-1 w-full mt-3.5 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden relative shadow-2xl flex flex-col">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="Templated.io Embedded Studio"
          className="w-full h-full border-0 flex-1"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="camera; microphone; clipboard-read; clipboard-write;"
        />
      </div>
    </div>
  );
}
export default TemplatedEditor;
