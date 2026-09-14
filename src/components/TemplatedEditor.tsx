"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  X,
  RefreshCw,
  Layers,
  Check,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
  Eye,
  FileText,
  Grid,
  Copy,
  Terminal,
  Settings,
  Layout,
  Maximize2,
  Minimize2,
  RotateCcw,
  AlertTriangle,
  Type,
  Image as ImageIcon,
  Key,
  Globe,
} from "lucide-react";

export type EmbedLaunchMode = "studio" | "preview" | "form" | "gallery" | "render";

export interface TemplatedEmbedConfig {
  embedId: string;
  externalId?: string;
  launchMode: EmbedLaunchMode;
  clone: boolean;
  autoSave: boolean;
  renderId?: string;
  folderId?: string;
  imageUrl?: string;
  zoom: number;
  language: string;
  pageLayoutMode: "vertical" | "horizontal";
  hideTabs: string[];
  // Permissions
  allowRename: boolean;
  allowSave: boolean;
  allowDownload: boolean;
  allowResize: boolean;
  allowCreateTemplate: boolean;
  allowTemplateSelection: boolean;
  allowVideo: boolean;
  // Layer Permissions
  allowLayerMove: boolean;
  allowLayerResize: boolean;
  allowLayerSelect: boolean;
  allowLayerUnlock: boolean;
  allowLayerRename: boolean;
  allowTextEdition: boolean;
  allowEditTextOnly: boolean;
  // UI Customization
  hideSidebar: boolean;
  hideHeader: boolean;
  hideLayersPanel: boolean;
  hideSaveButton: boolean;
  hideLanguageToggle: boolean;
  hideCanvasBackground: boolean;
  previewOnDownload: boolean;
  loadUploads: boolean;
  useExternalAssets: boolean;
}

export interface TemplatedEditorProps {
  templateId?: string;
  workspaceId?: string;
  includeAccountTemplates?: boolean;
  clone?: boolean;
  renderId?: string;
  initialMode?: EmbedLaunchMode;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
  onRenderCreated?: (renderUrl: string) => void;
}

interface EventLogItem {
  id: string;
  timestamp: string;
  type: string;
  payload: Record<string, unknown>;
}

const DEFAULT_CONFIG: TemplatedEmbedConfig = {
  embedId: "",
  externalId: "repurpose_workspace_default",
  launchMode: "studio",
  clone: false,
  autoSave: false,
  zoom: 50,
  language: "en",
  pageLayoutMode: "vertical",
  hideTabs: ["barcode", "rating"],
  allowRename: true,
  allowSave: true,
  allowDownload: true,
  allowResize: true,
  allowCreateTemplate: true,
  allowTemplateSelection: true,
  allowVideo: true,
  allowLayerMove: true,
  allowLayerResize: true,
  allowLayerSelect: true,
  allowLayerUnlock: true,
  allowLayerRename: true,
  allowTextEdition: true,
  allowEditTextOnly: false,
  hideSidebar: false,
  hideHeader: false,
  hideLayersPanel: false,
  hideSaveButton: false,
  hideLanguageToggle: false,
  hideCanvasBackground: false,
  previewOnDownload: false,
  loadUploads: true,
  useExternalAssets: true,
};

export function TemplatedEditor({
  templateId,
  workspaceId,
  includeAccountTemplates = false,
  clone = false,
  renderId,
  initialMode = "studio",
  isOpen,
  onClose,
  onSaveSuccess,
  onRenderCreated,
}: TemplatedEditorProps) {
  const [selectedMode, setSelectedMode] = useState<EmbedLaunchMode | null>(null);
  const activeLaunchMode = selectedMode ?? initialMode;

  const [savedEmbedId, setSavedEmbedId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("templated_embed_config_id") || process.env.NEXT_PUBLIC_TEMPLATED_EMBED_ID || "";
    }
    return process.env.NEXT_PUBLIC_TEMPLATED_EMBED_ID || "";
  });

  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("templated_embed_config_id");
      const envId = process.env.NEXT_PUBLIC_TEMPLATED_EMBED_ID || "";
      return !(stored || envId);
    }
    return true;
  });
  const [iframeTimedOut, setIframeTimedOut] = useState(false);

  // Sandbox interactive template state for offline preview
  const [sandboxState, setSandboxState] = useState({
    title: "10 AI Prompts to Scale Your Content Engine",
    subtitle: "Stop spending 5 hours drafting carousels. Use this structured prompt framework to repurpose long-form articles into viral slide decks in seconds.",
    brandName: "RepurposeAI Studio",
    handle: "@repurpose_ai",
    theme: "emerald" as "emerald" | "purple" | "blue" | "dark",
    aspectRatio: "1:1" as "1:1" | "4:5" | "16:9",
    bgImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
  });

  const [config, setConfig] = useState<TemplatedEmbedConfig>(() => ({
    ...DEFAULT_CONFIG,
    embedId:
      typeof window !== "undefined"
        ? localStorage.getItem("templated_embed_config_id") || process.env.NEXT_PUBLIC_TEMPLATED_EMBED_ID || ""
        : process.env.NEXT_PUBLIC_TEMPLATED_EMBED_ID || "",
    launchMode: initialMode,
    renderId: renderId,
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [eventLogs, setEventLogs] = useState<EventLogItem[]>([]);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<"permissions" | "layers" | "ui" | "integration">("permissions");

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detect if iframe is stuck in loading (timeout after 5 seconds)
  useEffect(() => {
    if (!isOpen || isSandboxMode || !config.embedId) return;

    const timer = setTimeout(() => {
      setIframeTimedOut(true);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, isSandboxMode, config.embedId, activeLaunchMode]);

  // Construct official Templated.io URL according to docs
  const computedEmbedUrl = useMemo(() => {
    const baseUrl = "https://app.templated.io";
    let path = "/editor";

    if (activeLaunchMode === "preview" && templateId && templateId !== "new") {
      path = `/editor/preview/${templateId}`;
    } else if (activeLaunchMode === "form" && templateId && templateId !== "new") {
      path = `/editor/form/${templateId}`;
    } else if (templateId && templateId !== "new" && activeLaunchMode === "studio") {
      path = `/editor/${templateId}`;
    }

    const params = new URLSearchParams();

    // Required Embed parameter
    const effectiveEmbedId = config.embedId || savedEmbedId;
    if (effectiveEmbedId) {
      params.set("embed", effectiveEmbedId);
    }

    // Launch mode & clone parameters
    if (activeLaunchMode === "gallery") {
      params.set("launch-mode", "template-gallery");
    } else if (activeLaunchMode === "render" && config.renderId) {
      params.set("render", config.renderId);
    }

    const shouldClone = clone || config.clone;
    if (shouldClone) params.set("clone", "true");
    if (config.autoSave) params.set("auto-save", "true");

    // Integration & session identifiers (Tenant isolation)
    const effectiveExternalId = workspaceId || config.externalId;
    if (effectiveExternalId) params.set("external-id", effectiveExternalId);
    if (includeAccountTemplates || activeLaunchMode === "gallery") {
      params.set("include-account-templates", "true");
    }
    if (config.folderId) params.set("folder", config.folderId);
    if (config.imageUrl) params.set("image-url", config.imageUrl);
    if (config.loadUploads) params.set("load-uploads", "true");

    if (config.useExternalAssets && typeof window !== "undefined") {
      params.set("external-assets-endpoint", `${window.location.origin}/api/v1/templated/assets`);
    }

    // Permissions
    if (!config.allowRename) params.set("allow-rename", "false");
    if (!config.allowSave) params.set("allow-save", "false");
    if (!config.allowDownload) params.set("allow-download", "false");
    if (config.allowResize) params.set("allow-resize", "true");
    if (!config.allowCreateTemplate) params.set("allow-create-template", "false");
    if (config.allowTemplateSelection) params.set("allow-template-selection", "true");
    if (config.allowVideo) params.set("allow-video", "true");
    if (config.previewOnDownload) params.set("preview-on-download", "true");

    // Layer Controls
    if (config.allowLayerMove) params.set("allow-layer-move", "true");
    if (config.allowLayerResize) params.set("allow-layer-resize", "true");
    if (config.allowLayerSelect) params.set("allow-layer-select", "true");
    if (config.allowLayerUnlock) params.set("allow-layer-unlock", "true");
    if (config.allowLayerRename) params.set("allow-layer-rename", "true");
    if (config.allowTextEdition) params.set("allow-text-edition", "true");
    if (config.allowEditTextOnly) params.set("allow-edit-text-only", "true");

    // UI Customization
    if (config.hideSidebar) params.set("hide-sidebar", "true");
    if (config.hideHeader) params.set("hide-header", "true");
    if (config.hideLayersPanel) params.set("hide-layers-panel", "true");
    if (config.hideSaveButton) params.set("hide-save-button", "true");
    if (config.hideLanguageToggle) params.set("hide-language-toggle", "true");
    if (config.hideCanvasBackground) params.set("hide-canvas-background", "true");
    if (config.language && config.language !== "en") params.set("language", config.language);
    if (config.pageLayoutMode && config.pageLayoutMode !== "vertical") params.set("page-layout-mode", config.pageLayoutMode);

    if (config.hideTabs && config.hideTabs.length > 0) {
      params.set("hide-tabs", config.hideTabs.join(","));
    }

    if (config.zoom && config.zoom !== 50) {
      params.set("zoom", config.zoom.toString());
    }

    // Attach custom metadata
    const metadata = {
      app: "RepurposeAI",
      workspaceId: effectiveExternalId,
      templateId: templateId || "new",
      launchMode: activeLaunchMode,
      timestamp: new Date().toISOString(),
    };
    try {
      params.set("metadata", btoa(JSON.stringify(metadata)));
    } catch {
      // ignore encoding failure
    }

    return `${baseUrl}${path}?${params.toString()}`;
  }, [config, savedEmbedId, templateId, activeLaunchMode, workspaceId, includeAccountTemplates, clone]);

  // Handle postMessage Events from the Templated.io iframe
  const handleSaveToRepurposeAI = useCallback(
    async (payload: Record<string, unknown>) => {
      try {
        setIsSaving(true);
        const tmplId =
          (payload.template_id as string) ||
          (payload.id as string) ||
          templateId ||
          `tmpl_${Date.now().toString().slice(-6)}`;
        const tmplName = (payload.name as string) || (payload.title as string) || "Custom Slide Template";
        const previewUrl =
          (payload.preview_url as string) ||
          (payload.render_url as string) ||
          (payload.thumbnail_url as string) ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";

        const width = Number(payload.width) || 1080;
        const height = Number(payload.height) || 1080;
        const aspectRatio = width === height ? "1:1" : width > height ? "16:9" : "4:5";

        const rawLayers = (payload.layers || payload.layer_names || {}) as Record<string, string>;
        const layerMappings = {
          headline_layer: rawLayers.headline_layer || rawLayers.headline || "headline_text",
          body_layer: rawLayers.body_layer || rawLayers.body || "body_text",
          background_layer: rawLayers.background_layer || rawLayers.background || "background_image",
          logo_layer: rawLayers.logo_layer || rawLayers.logo || "brand_logo",
          counter_layer: rawLayers.counter_layer || rawLayers.counter || "slide_counter",
        };

        const res = await fetch("/api/v1/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: workspaceId || config.externalId,
            name: tmplName,
            templatedTemplateId: tmplId,
            previewImageUrl: previewUrl,
            aspectRatio,
            hasBackgroundPlaceholder: true,
            layerMappings,
          }),
        });

        if (res.ok) {
          setSaveMessage("Synced to workspace!");
          setTimeout(() => {
            setSaveMessage(null);
            if (onSaveSuccess) onSaveSuccess();
          }, 1500);
        }
      } catch (err) {
        console.error("Failed to sync template:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [templateId, onSaveSuccess, workspaceId, config.externalId]
  );

  // Manual save for Sandbox mode
  const handleSandboxSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/v1/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspaceId || config.externalId,
          name: sandboxState.title.slice(0, 30) || "Sandbox Designed Slide",
          templatedTemplateId: `tmpl_${Date.now().toString().slice(-6)}`,
          previewImageUrl: sandboxState.bgImage,
          aspectRatio: sandboxState.aspectRatio,
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
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to save sandbox template:", err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch {
            return;
          }
        }
        if (!data || typeof data !== "object") return;

        const eventType = data.type || data.event || data.action || "message";

        // If we receive a message from Templated, clear the timeout
        setIframeTimedOut(false);

        // Log incoming message to Inspector
        setEventLogs((prev) => [
          {
            id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toLocaleTimeString(),
            type: String(eventType),
            payload: data,
          },
          ...prev.slice(0, 49),
        ]);

        // 1. Close event
        if (eventType === "templated:close" || eventType === "close") {
          onClose();
          return;
        }

        // 2. Save event
        if (
          eventType === "templated:save" ||
          eventType === "templated:template:saved" ||
          eventType === "save" ||
          eventType === "template_saved"
        ) {
          const payload = (data.payload || data.data || data) as Record<string, unknown>;
          handleSaveToRepurposeAI(payload);
        }

        // 3. Render event
        if (eventType === "templated:render:created" || eventType === "render_created") {
          const renderUrl = (data.render_url || data.url || data.payload?.render_url) as string;
          if (renderUrl && onRenderCreated) {
            onRenderCreated(renderUrl);
          }
        }
      } catch (err) {
        console.error("Error handling iframe event:", err);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [isOpen, onClose, handleSaveToRepurposeAI, onRenderCreated]);

  // Remote action triggers sent to iframe via postMessage
  const handleRemoteTriggerSave = () => {
    if (isSandboxMode) {
      handleSandboxSave();
      return;
    }
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "templated:save", action: "save" }, "*");
      setSaveMessage("Save requested via postMessage");
      setTimeout(() => setSaveMessage(null), 1500);
    }
  };

  const handleReloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = computedEmbedUrl;
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(computedEmbedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSaveEmbedId = (newId: string) => {
    const trimmed = newId.trim();
    setSavedEmbedId(trimmed);
    setConfig((p) => ({ ...p, embedId: trimmed }));
    if (typeof window !== "undefined") {
      localStorage.setItem("templated_embed_config_id", trimmed);
    }
    setShowSetupGuide(false);
    setIsSandboxMode(false);
    setIframeTimedOut(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col transition-all duration-300 ${
        isFullscreen ? "p-0" : "p-3 md:p-5"
      }`}
    >
      {/* Top Main Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800 shrink-0">
        {/* Brand & Mode Badges */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shadow-inner">
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Templated.io Studio</span>
                {isSandboxMode ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">
                    🎮 Interactive Sandbox
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    ⚡ Live Embed Engine
                  </span>
                )}
              </h3>
              {templateId && (
                <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
                  {templateId}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Visual slide designer & automated layer synchronization
            </p>
          </div>
        </div>

        {/* Live / Sandbox Toggle */}
        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setIsSandboxMode(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              !isSandboxMode
                ? "bg-emerald-500 text-zinc-950 font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Live Embed</span>
          </button>

          <button
            onClick={() => setIsSandboxMode(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              isSandboxMode
                ? "bg-purple-500 text-white font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Sandbox</span>
          </button>
        </div>

        {/* Mode Selector Tabs (when in Live Embed) */}
        {!isSandboxMode && (
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl gap-1">
            <button
              onClick={() => setSelectedMode("studio")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeLaunchMode === "studio"
                  ? "bg-zinc-800 text-emerald-400 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>

            <button
              onClick={() => setSelectedMode("preview")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeLaunchMode === "preview"
                  ? "bg-zinc-800 text-emerald-400 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              onClick={() => setSelectedMode("form")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeLaunchMode === "form"
                  ? "bg-zinc-800 text-emerald-400 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Form</span>
            </button>

            <button
              onClick={() => setSelectedMode("gallery")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeLaunchMode === "gallery"
                  ? "bg-zinc-800 text-emerald-400 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Gallery</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {saveMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{saveMessage}</span>
            </div>
          )}

          {/* Connection / Setup Guide Button */}
          <button
            onClick={() => setShowSetupGuide((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              !savedEmbedId
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse"
                : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            }`}
            title="Templated Connection Setup Guide"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {!savedEmbedId ? "Setup Connection" : "Connection Key"}
            </span>
          </button>

          {/* Quick Remote Save Button */}
          <button
            onClick={handleRemoteTriggerSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
            title="Save Template"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Save Template</span>
          </button>

          {/* Configuration Drawer Toggle */}
          {!isSandboxMode && (
            <button
              onClick={() => setShowConfigDrawer((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                showConfigDrawer
                  ? "bg-zinc-800 border-emerald-500/40 text-emerald-400"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
              }`}
              title="Configure Embed Parameters"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Config</span>
            </button>
          )}

          {/* Event Log Inspector Toggle */}
          {!isSandboxMode && (
            <button
              onClick={() => setShowEventLog((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer relative ${
                showEventLog
                  ? "bg-zinc-800 border-emerald-500/40 text-emerald-400"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
              }`}
              title="Open postMessage Event Log"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Events</span>
              {eventLogs.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          )}

          {/* Copy URL */}
          {!isSandboxMode && (
            <button
              onClick={handleCopyUrl}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Copy Configured Embed URL"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          {/* Open in New Window */}
          {!isSandboxMode && (
            <a
              href={computedEmbedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen((v) => !v)}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            title="Close Editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Setup Guide Modal Overlay */}
      {showSetupGuide && (
        <div className="absolute inset-x-4 top-16 z-50 max-w-2xl mx-auto bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Key className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  Templated.io Embed Connection Setup
                </h3>
                <p className="text-xs text-zinc-400">
                  Follow these 3 quick steps in your Templated account to enable live embedding.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSetupGuide(false)}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                1
              </div>
              <h4 className="font-semibold text-zinc-200">Create Embed Config</h4>
              <p className="text-[11px] text-zinc-400">
                Go to{" "}
                <a
                  href="https://app.templated.io/embed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline inline-flex items-center gap-0.5"
                >
                  app.templated.io/embed <ExternalLink className="w-3 h-3" />
                </a>{" "}
                and create an Embed Configuration.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                2
              </div>
              <h4 className="font-semibold text-zinc-200">Enable Localhost</h4>
              <p className="text-[11px] text-zinc-400">
                In Domain settings, check the checkbox: <strong className="text-zinc-200">&quot;Allow Development Environment&quot;</strong> and set Domain to <code className="text-emerald-400">http://localhost:3000</code>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                3
              </div>
              <h4 className="font-semibold text-zinc-200">Paste Embed ID</h4>
              <p className="text-[11px] text-zinc-400">
                Copy your Embed ID from the dashboard and paste it into the box below.
              </p>
            </div>
          </div>

          {/* Input field */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
              Enter Your Templated.io Embed Configuration ID:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                defaultValue={savedEmbedId}
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                id="modalEmbedIdInput"
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => {
                  const input = document.getElementById("modalEmbedIdInput") as HTMLInputElement;
                  if (input) handleSaveEmbedId(input.value);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                Connect & Load
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-zinc-400">
              Don&apos;t have an Embed Config ID yet?
            </span>
            <button
              onClick={() => {
                setShowSetupGuide(false);
                setIsSandboxMode(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium transition-colors"
            >
              Switch to Interactive Sandbox
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Body Area */}
      <div className="flex-1 w-full mt-3 flex gap-3 overflow-hidden relative">
        {/* Interactive Sandbox Simulator Mode */}
        {isSandboxMode ? (
          <div className="flex-1 flex flex-col md:flex-row rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
            {/* Left Sandbox Sidebar Controls */}
            <div className="w-full md:w-80 bg-zinc-900/80 border-b md:border-b-0 md:border-r border-zinc-800 p-5 space-y-5 overflow-y-auto shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  Interactive Canvas Controls
                </span>
                <h4 className="text-sm font-bold text-zinc-100">
                  Slide Content & Layout
                </h4>
              </div>

              {/* Aspect Ratio Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Canvas Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["1:1", "4:5", "16:9"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setSandboxState((p) => ({ ...p, aspectRatio: ratio }))}
                      className={`py-1.5 text-xs font-mono font-medium rounded-lg border transition-all ${
                        sandboxState.aspectRatio === ratio
                          ? "bg-purple-500/20 border-purple-500 text-purple-300 font-bold"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headline Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Headline Layer</span>
                </label>
                <input
                  type="text"
                  value={sandboxState.title}
                  onChange={(e) => setSandboxState((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                  placeholder="Slide headline text..."
                />
              </div>

              {/* Body Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Body Excerpt Layer</span>
                </label>
                <textarea
                  rows={4}
                  value={sandboxState.subtitle}
                  onChange={(e) => setSandboxState((p) => ({ ...p, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-purple-500 leading-relaxed"
                  placeholder="Slide body content..."
                />
              </div>

              {/* Author & Handle */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={sandboxState.brandName}
                    onChange={(e) => setSandboxState((p) => ({ ...p, brandName: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    Social Handle
                  </label>
                  <input
                    type="text"
                    value={sandboxState.handle}
                    onChange={(e) => setSandboxState((p) => ({ ...p, handle: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  />
                </div>
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Gradient Theme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "emerald", bg: "from-emerald-500/30 via-teal-900/30 to-black" },
                    { id: "purple", bg: "from-purple-500/30 via-indigo-900/30 to-black" },
                    { id: "blue", bg: "from-cyan-500/30 via-blue-900/30 to-black" },
                    { id: "dark", bg: "from-zinc-800/40 via-zinc-900/50 to-black" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSandboxState((p) => ({ ...p, theme: t.id as "emerald" | "purple" | "blue" | "dark" }))}
                      className={`h-8 rounded-lg bg-gradient-to-br ${t.bg} border transition-all ${
                        sandboxState.theme === t.id
                          ? "border-white ring-2 ring-purple-500/50 scale-105"
                          : "border-zinc-700 hover:border-zinc-500"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Quick Background Presets */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Background Imagery</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop",
                  ].map((imgUrl, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={imgUrl}
                      alt="Preset bg"
                      onClick={() => setSandboxState((p) => ({ ...p, bgImage: imgUrl }))}
                      className={`h-12 w-full object-cover rounded-md border cursor-pointer transition-transform hover:scale-105 ${
                        sandboxState.bgImage === imgUrl
                          ? "border-purple-400 ring-2 ring-purple-500/50"
                          : "border-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSandboxSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Save Slide to Templates</span>
              </button>
            </div>

            {/* Right Interactive Canvas Preview Area */}
            <div className="flex-1 bg-zinc-950 p-6 flex flex-col items-center justify-center overflow-auto relative">
              <div
                className={`w-full max-w-md rounded-2xl border border-zinc-700/80 overflow-hidden relative shadow-2xl transition-all duration-300 ${
                  sandboxState.aspectRatio === "1:1"
                    ? "aspect-square"
                    : sandboxState.aspectRatio === "4:5"
                    ? "aspect-[4/5]"
                    : "aspect-video"
                }`}
              >
                {/* Background Image & Overlay */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sandboxState.bgImage}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    sandboxState.theme === "emerald"
                      ? "from-zinc-950/90 via-emerald-950/80 to-zinc-950/95"
                      : sandboxState.theme === "purple"
                      ? "from-zinc-950/90 via-purple-950/80 to-zinc-950/95"
                      : sandboxState.theme === "blue"
                      ? "from-zinc-950/90 via-cyan-950/80 to-zinc-950/95"
                      : "from-zinc-950/95 via-zinc-900/90 to-black/95"
                  } backdrop-blur-[2px]`}
                />

                {/* Canvas Content Layers */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between text-zinc-100 z-10">
                  {/* Top Header Layer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs">
                        {sandboxState.brandName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-none">{sandboxState.brandName}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{sandboxState.handle}</div>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-zinc-300">
                      01 / 07
                    </span>
                  </div>

                  {/* Center Text Layer */}
                  <div className="space-y-3 my-auto py-4">
                    <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-snug drop-shadow-md">
                      {sandboxState.title}
                    </h2>
                    <p className="text-xs md:text-sm text-zinc-300 leading-relaxed drop-shadow">
                      {sandboxState.subtitle}
                    </p>
                  </div>

                  {/* Bottom Footer Layer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-[11px] text-zinc-400 font-medium">
                    <span>Swipe for more &rarr;</span>
                    <span className="font-mono text-[10px] uppercase text-purple-400 tracking-wider font-semibold">
                      RepurposeAI Slide
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Live Templated.io Iframe Container */
          <div className="flex-1 flex flex-col rounded-xl border border-zinc-800/90 bg-zinc-950 overflow-hidden relative shadow-2xl">
            {/* Loading Timeout / Missing Embed ID Diagnostic Helper */}
            {iframeTimedOut && (
              <div className="absolute inset-x-4 top-4 z-40 bg-zinc-900/95 border border-amber-500/50 rounded-xl p-4 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">
                      Templated.io Iframe is taking longer than usual to load
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Ensure your Embed Config ID is created in Templated and <strong>&quot;Allow Development Environment&quot;</strong> is checked for <code>http://localhost:3000</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowSetupGuide(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                  >
                    Setup Embed ID
                  </button>
                  <button
                    onClick={() => setIsSandboxMode(true)}
                    className="px-3 py-1.5 rounded-lg bg-purple-500 text-white font-medium text-xs hover:bg-purple-400 transition-colors"
                  >
                    Use Sandbox
                  </button>
                </div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={computedEmbedUrl}
              title="Templated.io Embedded Studio"
              className="w-full h-full border-0 flex-1 bg-zinc-950"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
              allow="camera; microphone; clipboard-read; clipboard-write;"
            />
          </div>
        )}

        {/* Right Collapsible Configuration Drawer */}
        {!isSandboxMode && showConfigDrawer && (
          <div className="w-80 md:w-96 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-200 shrink-0">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Embed Configuration
                </h4>
              </div>
              <button
                onClick={() => setShowConfigDrawer(false)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-950/40 text-[11px]">
              <button
                onClick={() => setActiveTab("permissions")}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  activeTab === "permissions"
                    ? "border-emerald-400 text-emerald-400 bg-zinc-900"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Permissions
              </button>
              <button
                onClick={() => setActiveTab("layers")}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  activeTab === "layers"
                    ? "border-emerald-400 text-emerald-400 bg-zinc-900"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Layer Controls
              </button>
              <button
                onClick={() => setActiveTab("ui")}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  activeTab === "ui"
                    ? "border-emerald-400 text-emerald-400 bg-zinc-900"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                UI & View
              </button>
              <button
                onClick={() => setActiveTab("integration")}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  activeTab === "integration"
                    ? "border-emerald-400 text-emerald-400 bg-zinc-900"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Session & API
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {activeTab === "permissions" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Allow Save</div>
                      <div className="text-[10px] text-zinc-400">Enable save button in UI</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.allowSave}
                      onChange={(e) => setConfig({ ...config, allowSave: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Allow Download</div>
                      <div className="text-[10px] text-zinc-400">Export JPG, PNG, PDF, MP4</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.allowDownload}
                      onChange={(e) => setConfig({ ...config, allowDownload: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Allow Rename</div>
                      <div className="text-[10px] text-zinc-400">Let user modify template title</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.allowRename}
                      onChange={(e) => setConfig({ ...config, allowRename: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Allow Resize</div>
                      <div className="text-[10px] text-zinc-400">Change canvas dimensions</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.allowResize}
                      onChange={(e) => setConfig({ ...config, allowResize: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Allow Video Controls</div>
                      <div className="text-[10px] text-zinc-400">Timeline & video loop settings</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.allowVideo}
                      onChange={(e) => setConfig({ ...config, allowVideo: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Template Selection Tab</div>
                      <div className="text-[10px] text-zinc-400">Allow switching templates</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.allowTemplateSelection}
                      onChange={(e) => setConfig({ ...config, allowTemplateSelection: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {activeTab === "layers" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Edit Text Only</div>
                      <div className="text-[10px] text-zinc-400">Locks all images & shapes</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.allowEditTextOnly}
                      onChange={(e) => setConfig({ ...config, allowEditTextOnly: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Allow Text Edition</div>
                      <div className="text-[10px] text-zinc-400">Double-click inline text edit</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.allowTextEdition}
                      onChange={(e) => setConfig({ ...config, allowTextEdition: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Allow Layer Move</div>
                      <div className="text-[10px] text-zinc-400">Drag layers around canvas</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.allowLayerMove}
                      onChange={(e) => setConfig({ ...config, allowLayerMove: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Allow Layer Resize</div>
                      <div className="text-[10px] text-zinc-400">Resize individual elements</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.allowLayerResize}
                      onChange={(e) => setConfig({ ...config, allowLayerResize: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {activeTab === "ui" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      Language
                    </label>
                    <select
                      value={config.language}
                      onChange={(e) => setConfig({ ...config, language: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs"
                    >
                      <option value="en">English (en)</option>
                      <option value="es">Spanish (es)</option>
                      <option value="pt">Portuguese (pt)</option>
                      <option value="fr">French (fr)</option>
                      <option value="de">German (de)</option>
                      <option value="zh">Chinese (zh)</option>
                      <option value="ja">Japanese (ja)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Transparent Canvas</div>
                      <div className="text-[10px] text-zinc-400">hide-canvas-background</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.hideCanvasBackground}
                      onChange={(e) => setConfig({ ...config, hideCanvasBackground: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">Hide Sidebar</div>
                      <div className="text-[10px] text-zinc-400">Canvas-only presentation</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.hideSidebar}
                      onChange={(e) => setConfig({ ...config, hideSidebar: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {activeTab === "integration" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      Embed Config ID
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={config.embedId}
                        onChange={(e) => setConfig({ ...config, embedId: e.target.value })}
                        placeholder="e.g. 550e8400-e29b-41d4..."
                        className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs font-mono"
                      />
                      <button
                        onClick={() => handleSaveEmbedId(config.embedId)}
                        className="px-2.5 py-1.5 bg-emerald-500 text-zinc-950 rounded-lg text-xs font-bold hover:bg-emerald-400"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      External ID (Multi-user Session)
                    </label>
                    <input
                      type="text"
                      value={config.externalId || ""}
                      onChange={(e) => setConfig({ ...config, externalId: e.target.value })}
                      placeholder="e.g. user_session_123"
                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <div className="font-semibold text-zinc-200">External Assets Endpoint</div>
                      <div className="text-[10px] text-zinc-400">Preload app media</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.useExternalAssets}
                      onChange={(e) => setConfig({ ...config, useExternalAssets: e.target.checked })}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Apply & Reload Button */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950/50">
              <button
                onClick={handleReloadIframe}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Apply & Reload Studio</span>
              </button>
            </div>
          </div>
        )}

        {/* Right Event Inspector Panel */}
        {!isSandboxMode && showEventLog && (
          <div className="w-80 md:w-96 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-200 shrink-0">
            <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  postMessage Event Feed
                </h4>
              </div>
              <button
                onClick={() => setShowEventLog(false)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 border-b border-zinc-800 bg-zinc-950/30 flex justify-between items-center text-[10px] text-zinc-400">
              <span>{eventLogs.length} events recorded</span>
              <button
                onClick={() => setEventLogs([])}
                className="hover:text-zinc-200 underline cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[11px]">
              {eventLogs.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  Listening for Templated.io postMessage events...
                </div>
              ) : (
                eventLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">{log.type}</span>
                      <span className="text-[10px] text-zinc-500">{log.timestamp}</span>
                    </div>
                    <pre className="text-[10px] text-zinc-300 overflow-x-auto max-h-24 bg-zinc-900/80 p-1.5 rounded border border-zinc-800/50">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-zinc-800/80 text-[11px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isSandboxMode
                  ? "bg-purple-400"
                  : savedEmbedId
                  ? "bg-emerald-400"
                  : "bg-amber-400 animate-ping"
              }`}
            />
            <span className="text-zinc-400">
              {isSandboxMode
                ? "Interactive Sandbox Mode Active"
                : savedEmbedId
                ? "Host Domain: localhost:3000 (Development Mode)"
                : "Awaiting Embed Configuration ID"}
            </span>
          </span>
          <span className="hidden sm:inline text-zinc-600">•</span>
          <span className="hidden sm:inline text-zinc-400">
            Active Mode: <strong className="text-zinc-200 capitalize">{activeLaunchMode}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isSandboxMode && (
            <span className="font-mono text-[10px] text-zinc-400 truncate max-w-xs hidden md:inline">
              {computedEmbedUrl}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemplatedEditor;
