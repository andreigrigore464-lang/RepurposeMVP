"use client";

import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutTemplate,
  Plus,
  Layers,
  Trash2,
  RefreshCw,
  Edit3,
  Ratio,
  SlidersHorizontal,
  X,
  Eye,
  DownloadCloud,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Type,
  Image as ImageIcon,
  Hash,
  ChevronDown,
  Check,
  PlusCircle,
  Filter,
  CheckCircle,
} from "lucide-react";
import { TemplatedEditor, EmbedLaunchMode } from "@/components/TemplatedEditor";
import {
  DynamicTemplateConfig,
  TemplateFieldConfig,
  SemanticRole,
  SEMANTIC_ROLE_LABELS,
  autoHeuristicLayerConfig,
  normalizeTemplateConfig,
  isTemplateConfigured,
  dynamicConfigToLegacyMappings,
  TemplatedLayer,
} from "@/lib/templated";

interface BrandTemplate {
  id: string;
  workspaceId?: string;
  name: string;
  templatedTemplateId: string;
  previewImageUrl: string;
  aspectRatio: string;
  hasBackgroundPlaceholder: boolean;
  isConfigured: boolean;
  layerMappings?: Record<string, string>;
  dynamicConfig?: DynamicTemplateConfig;
  createdAt: string;
}

interface StarterTemplate {
  id: string;
  name: string;
  templatedTemplateId: string;
  previewImageUrl: string;
  aspectRatio: string;
  hasBackgroundPlaceholder: boolean;
  isConfigured: boolean;
  layerMappings?: Record<string, string>;
  dynamicConfig?: DynamicTemplateConfig;
}

interface InspectedLayer extends TemplatedLayer {
  key: string;
  name: string;
  type: string;
  fontSize?: string;
  width?: number;
  height?: number;
  sampleText?: string;
  label: string;
  [key: string]: unknown;
}

const AVAILABLE_ATTRIBUTES: Array<{
  role: SemanticRole;
  label: string;
  type: "text" | "image" | "counter";
  defaultPrompt?: string;
  defaultCharLimit?: number;
  description: string;
}> = [
  {
    role: "headline",
    label: "Headline Hook",
    type: "text",
    defaultPrompt: "High-impact opening headline or hook",
    defaultCharLimit: 80,
    description: "Main title or primary hook",
  },
  {
    role: "body",
    label: "Body Content",
    type: "text",
    defaultPrompt: "Concise explanatory paragraph or core takeaway",
    defaultCharLimit: 180,
    description: "Main explanatory text or takeaway",
  },
  {
    role: "hero_image",
    label: "Hero Image",
    type: "image",
    defaultPrompt: "Relevant topic photo or hero visual",
    description: "Primary visual or featured photo",
  },
  {
    role: "subheading",
    label: "Subheading",
    type: "text",
    defaultPrompt: "Supporting subtitle or topic context",
    defaultCharLimit: 100,
    description: "Supporting subtitle or category label",
  },
  {
    role: "statistic_callout",
    label: "Statistic / Metric",
    type: "text",
    defaultPrompt: "Extracted numeric statistic or metric",
    defaultCharLimit: 25,
    description: "Numeric highlight (e.g. +45%, $1.2M)",
  },
  {
    role: "key_takeaway",
    label: "Key Takeaway",
    type: "text",
    defaultPrompt: "Core takeaway point or summary sentence",
    defaultCharLimit: 120,
    description: "Standalone takeaway or key insight",
  },
  {
    role: "quote_author",
    label: "Quote / Author",
    type: "text",
    defaultPrompt: "Attribution, quote source, or author name",
    defaultCharLimit: 60,
    description: "Speaker, citation, or author attribution",
  },
  {
    role: "cta_button",
    label: "Call to Action",
    type: "text",
    defaultPrompt: "Direct call to action prompt",
    defaultCharLimit: 30,
    description: "Action prompt text",
  },
  {
    role: "secondary_image",
    label: "Secondary Image",
    type: "image",
    defaultPrompt: "Supporting diagram or secondary visual",
    description: "Secondary graphic or supporting photo",
  },
  {
    role: "brand_logo",
    label: "Brand Logo",
    type: "image",
    description: "Workspace brand logo or user avatar",
  },
  {
    role: "slide_counter",
    label: "Slide Counter",
    type: "counter",
    defaultCharLimit: 10,
    description: "Slide page indexation (e.g. 01 / 05)",
  },
  {
    role: "custom",
    label: "Custom Attribute",
    type: "text",
    defaultCharLimit: 100,
    description: "Custom user-defined content attribute",
  },
];

const ASPECT_RATIO_OPTIONS = [
  { id: "ALL", label: "All Formats" },
  { id: "1:1", label: "1:1 Square" },
  { id: "4:5", label: "4:5 Carousel" },
  { id: "16:9", label: "16:9 Landscape" },
  { id: "9:16", label: "9:16 Story" },
];

function TemplatesContent() {
  const searchParams = useSearchParams();
  const configureParam = searchParams.get("configure");
  const returnToParam = searchParams.get("returnTo");

  const [workspace, setWorkspace] = useState<{ id: string; name: string } | null>(null);
  const [templates, setTemplates] = useState<BrandTemplate[]>([]);
  const [starterTemplates, setStarterTemplates] = useState<StarterTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);
  const [activeEmbedTemplateId, setActiveEmbedTemplateId] = useState<string>("");
  const [activeEmbedMode, setActiveEmbedMode] = useState<EmbedLaunchMode>("studio");
  const [activeEmbedClone, setActiveEmbedClone] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [importingStarterId, setImportingStarterId] = useState<string | null>(null);
  const [returnBannerUrl] = useState<string | null>(returnToParam);
  const [autoOpenedParam, setAutoOpenedParam] = useState<string | null>(null);

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [modalLayers, setModalLayers] = useState<InspectedLayer[]>([]);
  const [isLoadingModalLayers, setIsLoadingModalLayers] = useState(false);

  // New UI states: Aspect ratio filter & Non-blocking toast/dialog
  const [selectedRatio, setSelectedRatio] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);

  const showToast = useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }, []);

  const [formData, setFormData] = useState<{
    id?: string;
    workspaceId?: string;
    name: string;
    templatedTemplateId: string;
    previewImageUrl: string;
    aspectRatio: string;
    hasBackgroundPlaceholder: boolean;
    dynamicConfig: DynamicTemplateConfig;
  }>({
    name: "",
    templatedTemplateId: "",
    previewImageUrl: "",
    aspectRatio: "1:1",
    hasBackgroundPlaceholder: true,
    dynamicConfig: {
      version: 2,
      isConfigured: false,
      fields: [],
    },
  });

  const loadLayersForModal = async (templateId: string, initialConfig?: DynamicTemplateConfig) => {
    if (!templateId) return;
    try {
      setIsLoadingModalLayers(true);
      const res = await fetch(`/api/v1/templates/layers?templateId=${encodeURIComponent(templateId)}`);
      if (res.ok) {
        const data = await res.json();
        const rawDetected: InspectedLayer[] = Array.isArray(data.allLayers) ? data.allLayers : [];
        const seen = new Set<string>();
        const detectedLayers: InspectedLayer[] = [];
        for (const l of rawDetected) {
          if (l.key && !seen.has(l.key)) {
            seen.add(l.key);
            detectedLayers.push(l);
          }
        }
        setModalLayers(detectedLayers);

        if (!initialConfig || !initialConfig.fields || initialConfig.fields.length === 0) {
          const auto = data.autoConfig || autoHeuristicLayerConfig(detectedLayers);
          const activeOnly = auto.fields.filter((f: TemplateFieldConfig) => f.role !== "none");
          setFormData((prev) => ({
            ...prev,
            dynamicConfig: {
              version: 2,
              isConfigured: activeOnly.length > 0,
              fields: activeOnly.length > 0 ? activeOnly : createDefaultInitialFunctions(detectedLayers),
            },
          }));
        } else {
          const activeOnly = initialConfig.fields.filter((f) => f.role !== "none");
          setFormData((prev) => ({
            ...prev,
            dynamicConfig: {
              ...initialConfig,
              fields: activeOnly.length > 0 ? activeOnly : createDefaultInitialFunctions(detectedLayers),
            },
          }));
        }
      }
    } catch (err) {
      console.warn("Could not inspect layers for modal:", err);
    } finally {
      setIsLoadingModalLayers(false);
    }
  };

  const createDefaultInitialFunctions = (layers: InspectedLayer[]): TemplateFieldConfig[] => {
    const textLayers = layers.filter((l) => l.type === "text" || !l.type);
    const imageLayers = layers.filter((l) => l.type === "image");

    const defaultFields: TemplateFieldConfig[] = [
      {
        id: `field-headline-${Date.now().toString(36)}-1`,
        layerKey: textLayers[0]?.key || "headline_text",
        type: "text",
        role: "headline",
        label: "Headline Hook",
        promptInstruction: "High-impact opening headline or hook",
        characterLimit: 80,
        isRequired: true,
      },
      {
        id: `field-body-${Date.now().toString(36)}-2`,
        layerKey: textLayers[1]?.key || textLayers[0]?.key || "body_text",
        type: "text",
        role: "body",
        label: "Body Content",
        promptInstruction: "Concise explanatory paragraph or core takeaway",
        characterLimit: 180,
        isRequired: true,
      },
    ];

    if (imageLayers.length > 0) {
      defaultFields.push({
        id: `field-hero-${Date.now().toString(36)}-3`,
        layerKey: imageLayers[0].key,
        type: "image",
        role: "hero_image",
        label: "Hero Image",
        promptInstruction: "Relevant topic photo or hero visual",
        isRequired: false,
      });
    }

    return defaultFields;
  };

  const fetchTemplates = useCallback(async (sync = false) => {
    try {
      if (sync) setIsSyncing(true);
      const url = sync ? "/api/v1/templates?sync=true" : "/api/v1/templates";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        if (data.starterTemplates) setStarterTemplates(data.starterTemplates);
        if (data.workspace) setWorkspace(data.workspace);
        if (sync) showToast("Templates synced successfully from Templated.io");
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      if (sync) showToast("Failed to sync templates from Templated.io", "error");
    } finally {
      setIsLoading(false);
      if (sync) setIsSyncing(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/v1/templates")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (isMounted) {
          setTemplates(data.templates || []);
          if (data.starterTemplates) setStarterTemplates(data.starterTemplates);
          if (data.workspace) setWorkspace(data.workspace);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch templates:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!configureParam || autoOpenedParam === configureParam || isLoading) return;

    const target =
      templates.find((t) => t.templatedTemplateId === configureParam || t.id === configureParam) ||
      starterTemplates.find((s) => s.templatedTemplateId === configureParam || s.id === configureParam);

    if (target) {
      setAutoOpenedParam(configureParam);
      handleOpenEditModal(target);
    } else if (configureParam) {
      setAutoOpenedParam(configureParam);
      const initialConfig = normalizeTemplateConfig({});
      loadLayersForModal(configureParam, initialConfig);
      setFormData({
        name: "Custom Template",
        workspaceId: workspace?.id,
        templatedTemplateId: configureParam,
        previewImageUrl: `https://templated-assets.s3.amazonaws.com/public/thumbnail/${configureParam}.webp`,
        aspectRatio: "1:1",
        hasBackgroundPlaceholder: true,
        dynamicConfig: initialConfig,
      });
      setIsModalOpen(true);
    }
  }, [configureParam, templates, starterTemplates, isLoading, autoOpenedParam, workspace?.id]);

  const handleOpenCreateModal = () => {
    const initialConfig = normalizeTemplateConfig({
      headline_layer: "headline_text",
      body_layer: "body_text",
      background_layer: "background_image",
    });
    setFormData({
      name: "Custom Carousel Slide",
      workspaceId: workspace?.id,
      templatedTemplateId: `tmpl_${Date.now().toString().slice(-6)}`,
      previewImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
      aspectRatio: "1:1",
      hasBackgroundPlaceholder: true,
      dynamicConfig: initialConfig,
    });
    setModalLayers([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tmpl: BrandTemplate | StarterTemplate) => {
    const norm = normalizeTemplateConfig(tmpl.dynamicConfig || tmpl.layerMappings);
    loadLayersForModal(tmpl.templatedTemplateId, norm);
    setFormData({
      id: "workspaceId" in tmpl ? tmpl.id : undefined,
      workspaceId: "workspaceId" in tmpl ? tmpl.workspaceId : workspace?.id,
      name: tmpl.name,
      templatedTemplateId: tmpl.templatedTemplateId,
      previewImageUrl: tmpl.previewImageUrl,
      aspectRatio: tmpl.aspectRatio,
      hasBackgroundPlaceholder: tmpl.hasBackgroundPlaceholder,
      dynamicConfig: norm,
    });
    setIsModalOpen(true);
  };

  const handleOpenEmbedStudio = (
    templateId: string,
    mode: EmbedLaunchMode = "studio",
    shouldClone = false
  ) => {
    setActiveEmbedTemplateId(templateId);
    setActiveEmbedMode(mode);
    setActiveEmbedClone(shouldClone);
    setIsEmbedOpen(true);
  };

  const handleImportStarter = async (starterId: string) => {
    try {
      setImportingStarterId(starterId);
      const res = await fetch("/api/v1/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_starter",
          starterId,
          workspaceId: workspace?.id,
        }),
      });

      if (res.ok) {
        await fetchTemplates(false);
        showToast("Starter template added to your workspace!");
      }
    } catch (err) {
      console.error("Failed to import starter template:", err);
      showToast("Failed to import starter template", "error");
    } finally {
      setImportingStarterId(null);
    }
  };

  const handleAddAttribute = (attr: typeof AVAILABLE_ATTRIBUTES[number]) => {
    setIsAddMenuOpen(false);

    const matchingLayer = modalLayers.find((l) => {
      if (attr.type === "image") return l.type === "image";
      return l.type === "text" || !l.type;
    });

    const isCustom = attr.role === "custom";
    const newField: TemplateFieldConfig = {
      id: `field-${attr.role}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      layerKey: matchingLayer?.key || modalLayers[0]?.key || (isCustom ? "custom_layer" : `${attr.role}_layer`),
      type: attr.type,
      role: attr.role,
      label: isCustom ? "Custom Attribute" : attr.label,
      promptInstruction: isCustom ? "Custom content for this template element" : attr.defaultPrompt,
      characterLimit: attr.defaultCharLimit,
      isRequired: attr.role === "headline" || attr.role === "body",
    };

    setFormData((prev) => ({
      ...prev,
      dynamicConfig: {
        ...prev.dynamicConfig,
        fields: [...prev.dynamicConfig.fields, newField],
        isConfigured: true,
      },
    }));
  };

  const handleRemoveFunction = (fieldId: string) => {
    setFormData((prev) => {
      const remaining = prev.dynamicConfig.fields.filter((f) => f.id !== fieldId);
      return {
        ...prev,
        dynamicConfig: {
          ...prev.dynamicConfig,
          fields: remaining,
          isConfigured: remaining.length > 0,
        },
      };
    });
  };

  const handleUpdateFieldById = (
    fieldId: string,
    updates: Partial<TemplateFieldConfig>
  ) => {
    setFormData((prev) => {
      const newFields = prev.dynamicConfig.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      );
      return {
        ...prev,
        dynamicConfig: {
          ...prev.dynamicConfig,
          fields: newFields,
          isConfigured: newFields.length > 0,
        },
      };
    });
  };

  const activeFields = useMemo(() => {
    return formData.dynamicConfig.fields.filter(
      (f) => f.role !== "none" && f.layerKey && f.layerKey.trim().length > 0
    );
  }, [formData.dynamicConfig.fields]);

  const isFormValid = activeFields.length > 0 && formData.name.trim().length > 0;

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setIsSaving(true);

      const payload = {
        id: formData.id,
        workspaceId: formData.workspaceId,
        name: formData.name,
        templatedTemplateId: formData.templatedTemplateId,
        previewImageUrl: formData.previewImageUrl,
        aspectRatio: formData.aspectRatio,
        hasBackgroundPlaceholder: formData.hasBackgroundPlaceholder,
        isConfigured: true,
        dynamicConfig: {
          ...formData.dynamicConfig,
          version: 2,
          isConfigured: true,
        },
        layerMappings: dynamicConfigToLegacyMappings(formData.dynamicConfig),
      };

      const res = await fetch("/api/v1/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchTemplates(false);
        showToast("Template configuration saved successfully!");
        if (returnBannerUrl) {
          window.location.href = returnBannerUrl;
        }
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Failed to save template configuration", "error");
      }
    } catch (err) {
      console.error("Save template error:", err);
      showToast("An unexpected error occurred while saving", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    const targetId = templateToDelete.id;

    try {
      const res = await fetch(`/api/v1/templates?id=${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchTemplates(false);
        showToast("Template deleted successfully");
      }
    } catch (err) {
      console.error("Failed to delete template:", err);
      showToast("Failed to delete template", "error");
    } finally {
      setTemplateToDelete(null);
    }
  };

  // Filtered lists
  const filteredTemplates = useMemo(() => {
    if (selectedRatio === "ALL") return templates;
    return templates.filter((t) => t.aspectRatio === selectedRatio);
  }, [templates, selectedRatio]);

  const filteredStarters = useMemo(() => {
    if (selectedRatio === "ALL") return starterTemplates;
    return starterTemplates.filter((s) => s.aspectRatio === selectedRatio);
  }, [starterTemplates, selectedRatio]);

  const renderAddAttributeButton = () => (
    <div className="pt-2 relative">
      <button
        type="button"
        onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
        className="w-full py-2.5 px-4 rounded-xl border border-dashed border-blue-500/40 hover:border-blue-500/70 bg-blue-500/5 hover:bg-blue-500/10 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Add Content Attribute / Function</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAddMenuOpen ? "rotate-180" : ""}`} />
      </button>

      {isAddMenuOpen && (
        <div className="mt-2 p-3.5 rounded-2xl glass-panel-elevated border border-white/10 shadow-2xl space-y-2 animate-in fade-in slide-in-from-top-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
            Select an Attribute to Add:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_ATTRIBUTES.map((attr) => (
              <button
                key={`add-attr-${attr.role}`}
                type="button"
                onClick={() => handleAddAttribute(attr)}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-blue-500/15 border border-white/[0.06] hover:border-blue-500/30 flex items-start gap-2.5 text-left transition-all cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-blue-500/20 text-cyan-400 shrink-0">
                  {attr.type === "image" ? (
                    <ImageIcon className="w-3.5 h-3.5" />
                  ) : attr.type === "counter" ? (
                    <Hash className="w-3.5 h-3.5" />
                  ) : (
                    <Type className="w-3.5 h-3.5" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-semibold text-white group-hover:text-cyan-300 block">
                    {attr.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    {attr.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200 text-xs font-semibold ${
            toastMessage.type === "error"
              ? "bg-rose-950/80 border-rose-500/40 text-rose-200"
              : "bg-[#0e1017]/90 border-cyan-500/40 text-cyan-300"
          }`}
        >
          {toastMessage.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Return to workflow banner if redirected */}
      {returnBannerUrl && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-cyan-950/40 border border-blue-500/30 flex items-center justify-between shadow-lg shadow-blue-500/10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-sm font-semibold text-white">Configuring Template for Workflow</h4>
              <p className="text-xs text-slate-300 font-sans">Save changes below to immediately resume building your campaign.</p>
            </div>
          </div>
          <Link
            href={returnBannerUrl}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold hover:from-blue-500 hover:to-cyan-400 transition-all shadow-md shadow-blue-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Workflow</span>
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#08090d] rounded-[15px] flex items-center justify-center">
                <LayoutTemplate className="w-5 h-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-display">
                Brand Templates &amp; Canvas Studio
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Define visual templates, layer mappings, and aspect ratio profiles for AI content generation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTemplates(true)}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-pill hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Sync templates from Templated.io account"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-cyan-400" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Templated"}</span>
          </button>

          <button
            onClick={() => handleOpenEmbedStudio("gallery", "gallery", false)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-xs font-semibold text-cyan-300 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Gallery</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Template</span>
          </button>
        </div>
      </div>

      {/* Aspect Ratio Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl glass-panel">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 pl-2.5 pr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Format:</span>
          </span>
          {ASPECT_RATIO_OPTIONS.map((opt) => {
            const isSelected = selectedRatio === opt.id;
            return (
              <button
                key={`filter-${opt.id}`}
                onClick={() => setSelectedRatio(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-500 pr-3 font-mono hidden sm:inline">
          Showing {filteredTemplates.length} workspace · {filteredStarters.length} starters
        </span>
      </div>

      {/* 1. Active Workspace Templates Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white font-display">
              Workspace Templates
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-cyan-300 text-xs font-mono">
              {filteredTemplates.length} Active
            </span>
          </div>
          <span className="text-xs text-slate-500 font-sans">
            Click &apos;Configure&apos; for layer bindings or &apos;Studio&apos; to edit visual canvas
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-3xl glass-panel p-5 space-y-4 animate-pulse"
              >
                <div className="aspect-video bg-white/5 rounded-2xl" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="h-3 bg-white/5 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl glass-panel border border-dashed border-white/10">
            <LayoutTemplate className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200 font-display">
              {selectedRatio !== "ALL" ? `No ${selectedRatio} templates found` : "No workspace templates configured"}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6 font-sans">
              {selectedRatio !== "ALL"
                ? "Try switching to 'All Formats' or import a starter template in this aspect ratio below."
                : "Add a template from your Templated.io account, import one of our pre-built master starters below, or launch the Studio."}
            </p>
            <div className="flex items-center justify-center gap-3">
              {selectedRatio !== "ALL" ? (
                <button
                  onClick={() => setSelectedRatio("ALL")}
                  className="px-4 py-2 rounded-full glass-pill text-cyan-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500/20 cursor-pointer"
                >
                  View All Formats
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleOpenEmbedStudio("gallery", "gallery", false)}
                    className="px-4 py-2 rounded-full glass-pill text-cyan-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500/20 cursor-pointer"
                  >
                    Explore Starter Library
                  </button>
                  <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold hover:from-blue-500 hover:to-cyan-400 cursor-pointer shadow-lg shadow-blue-500/20"
                  >
                    Configure Custom Template
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const dyn = normalizeTemplateConfig(template.dynamicConfig || template.layerMappings);
              const activeLayers = dyn.fields.filter((f) => f.role !== "none" && f.layerKey);
              const configured = isTemplateConfigured(template) || isTemplateConfigured(dyn);

              return (
                <div
                  key={template.id}
                  className="group rounded-3xl glass-panel hover:border-blue-500/40 transition-all duration-300 overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  {/* Card Thumbnail / Preview */}
                  <div className="relative aspect-video bg-[#050608] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.previewImageUrl}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-transparent to-black/30" />

                    {/* Aspect Ratio Tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-pill text-[11px] font-mono font-medium text-white shadow-md">
                      <Ratio className="w-3 h-3 text-cyan-400" />
                      <span>{template.aspectRatio}</span>
                    </div>

                    {/* Ready Status */}
                    <div className="absolute top-3 right-3">
                      {configured ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold backdrop-blur-md shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ready</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold backdrop-blur-md shadow-sm">
                          <AlertCircle className="w-3 h-3" />
                          <span>Needs Setup</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 font-display">
                        {template.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        ID: {template.templatedTemplateId}
                      </p>
                    </div>

                    {/* Active Layer Function Summary */}
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                        Assigned Functions ({activeLayers.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeLayers.length === 0 ? (
                          <span className="text-xs text-rose-400/90 italic font-sans">
                            No functions mapped yet
                          </span>
                        ) : (
                          activeLayers.slice(0, 4).map((f, idx) => (
                            <span
                              key={`badge-${template.id}-${f.id || f.layerKey}-${idx}`}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-slate-300"
                            >
                              {f.type === "image" ? (
                                <ImageIcon className="w-2.5 h-2.5 text-blue-400" />
                              ) : f.type === "counter" ? (
                                <Hash className="w-2.5 h-2.5 text-amber-400" />
                              ) : (
                                <Type className="w-2.5 h-2.5 text-cyan-400" />
                              )}
                              <span className="text-slate-400 font-sans capitalize">{f.role === "custom" ? f.label : (SEMANTIC_ROLE_LABELS[f.role] || f.label || f.role)}:</span>
                              <span className="text-white">{f.layerKey}</span>
                            </span>
                          ))
                        )}
                        {activeLayers.length > 4 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 font-mono">
                            +{activeLayers.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Configure Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(template)}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        configured
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/20"
                          : "bg-rose-600/90 hover:bg-rose-500 text-white shadow-rose-500/20"
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>{configured ? "Configure Layer Mappings" : "Configure Layers (Required)"}</span>
                    </button>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenEmbedStudio(template.templatedTemplateId, "studio", false)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl glass-pill hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Canvas Studio</span>
                      </button>

                      <button
                        onClick={() => handleOpenEmbedStudio(template.templatedTemplateId, "preview", false)}
                        className="p-2 rounded-xl glass-pill hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Live Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setTemplateToDelete({ id: template.id, name: template.name })}
                        className="p-2 rounded-xl glass-pill hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Master Starter Templates Gallery */}
      {filteredStarters.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-white font-display">
                Master Starter Templates
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-mono">
                {filteredStarters.length} Pre-Built
              </span>
            </div>
            <span className="text-xs text-slate-500 font-sans">
              One-click import into workspace or customize in canvas editor
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStarters.map((starter) => {
              const starterDyn = normalizeTemplateConfig(starter.dynamicConfig || starter.layerMappings);
              const activeCount = starterDyn.fields.filter((f) => f.role !== "none").length;

              return (
                <div
                  key={starter.id}
                  className="group rounded-3xl glass-panel hover:border-cyan-500/40 transition-all duration-300 overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-[#050608] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={starter.previewImageUrl}
                      alt={starter.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-transparent to-black/30" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-pill text-[11px] font-mono font-medium text-white shadow-md">
                      <Ratio className="w-3 h-3 text-cyan-400" />
                      <span>{starter.aspectRatio}</span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold backdrop-blur-md">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready ({activeCount} layers)</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors font-display">
                        {starter.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        ID: {starter.templatedTemplateId}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleImportStarter(starter.id)}
                        disabled={importingStarterId === starter.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl glass-pill hover:bg-white/10 text-xs font-medium text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {importingStarterId === starter.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        ) : (
                          <DownloadCloud className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>Add to Workspace</span>
                      </button>

                      <button
                        onClick={() => handleOpenEmbedStudio(starter.templatedTemplateId, "studio", true)}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-cyan-300 border border-blue-500/30 text-xs font-semibold transition-colors cursor-pointer"
                        title="Clone & Open in Embedded Studio"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Clone</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Dialog */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-display">Delete Template Configuration?</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  &quot;{templateToDelete.name}&quot; will be removed from your workspace.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              This will unbind this template from your automated carousel workflows. Your design in Templated.io remains safe.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setTemplateToDelete(null)}
                className="px-4 py-2 rounded-full glass-pill hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTemplate}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: 2-Column Feature-First Template Configurator */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0e1017] border border-white/15 rounded-3xl max-w-5xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px]">
                  <div className="w-full h-full bg-[#08090d] rounded-[11px] flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-300" />
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                    {formData.id ? "Configure Template Functions" : "Add & Configure Brand Template"}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Template ID: {formData.templatedTemplateId || "New"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2-Column Layout */}
            <form onSubmit={handleSaveTemplate} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Visual Canvas Preview & Layer Inspector */}
                <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-0">
                  <div className="p-4 rounded-2xl bg-[#08090d] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Canvas Visual Reference</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 text-[10px] font-mono border border-blue-500/30">
                        {formData.aspectRatio}
                      </span>
                    </div>

                    <div className="relative rounded-xl overflow-hidden aspect-video bg-black/40 border border-white/10 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.previewImageUrl}
                        alt="Canvas Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Detected Canvas Layer Tags */}
                    <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Detected Canvas Layers:</span>
                        <span className="text-cyan-300 font-semibold">{modalLayers.length} total</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto">
                        {modalLayers.length === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">No layers loaded</span>
                        ) : (
                          modalLayers.map((l) => {
                            const isAssigned = formData.dynamicConfig.fields.some((f) => f.layerKey === l.key);
                            return (
                              <span
                                key={`layer-tag-${l.key}`}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                                  isAssigned
                                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                                    : "bg-white/[0.02] border-white/[0.06] text-slate-400"
                                }`}
                              >
                                {l.key}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Name, Format, and Function Mapping */}
                <div className="lg:col-span-7 space-y-4">
                  {/* General Metadata Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                        Template Display Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#151824] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                        placeholder="e.g. Modern Tech Carousel (1:1)"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                        Aspect Ratio
                      </label>
                      <select
                        value={formData.aspectRatio}
                        onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#151824] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="1:1">1:1 (Square Carousel)</option>
                        <option value="4:5">4:5 (Portrait Feed)</option>
                        <option value="16:9">16:9 (Landscape Card)</option>
                        <option value="9:16">9:16 (Story / Reel)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Layer Inspection Loader */}
                  {isLoadingModalLayers && (
                    <div className="p-4 rounded-2xl glass-panel flex items-center justify-center gap-2 text-xs text-slate-400">
                      <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span>Inspecting canvas layers...</span>
                    </div>
                  )}

                  {/* Configured Template Functions */}
                  <div className="space-y-3.5">
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                        Configured Template Functions
                      </h3>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Assign which canvas layer receives each AI content element.
                      </p>
                    </div>

                    {/* Function Cards List */}
                    <div className="space-y-2.5">
                      {formData.dynamicConfig.fields.map((field, fIdx) => (
                        <div
                          key={`func-${field.id || fIdx}`}
                          className="p-3.5 rounded-2xl bg-[#131620] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center gap-2 flex-1 flex-wrap">
                            {field.type === "image" ? (
                              <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                            ) : field.type === "counter" ? (
                              <Hash className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <Type className="w-4 h-4 text-cyan-400 shrink-0" />
                            )}
                            <select
                              value={field.role}
                              onChange={(e) => {
                                const newRole = e.target.value as SemanticRole;
                                if (newRole === "custom") {
                                  handleUpdateFieldById(field.id, {
                                    role: "custom",
                                    label: field.label.startsWith("Headline") || field.label.startsWith("Body") ? "Custom Attribute" : field.label,
                                  });
                                } else {
                                  const attrMeta = AVAILABLE_ATTRIBUTES.find((a) => a.role === newRole);
                                  handleUpdateFieldById(field.id, {
                                    role: newRole,
                                    type: attrMeta?.type || field.type,
                                    label: attrMeta?.label || newRole,
                                    promptInstruction: attrMeta?.defaultPrompt,
                                    characterLimit: attrMeta?.defaultCharLimit,
                                    isRequired: newRole === "headline" || newRole === "body",
                                  });
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#0e1017] border border-white/10 text-xs font-semibold text-cyan-300 cursor-pointer"
                            >
                              {AVAILABLE_ATTRIBUTES.map((attr) => (
                                <option key={`role-opt-${field.id}-${attr.role}`} value={attr.role}>
                                  {attr.label}
                                </option>
                              ))}
                            </select>

                            {field.role === "custom" && (
                              <>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => handleUpdateFieldById(field.id, { label: e.target.value })}
                                  placeholder="Custom name (e.g. Sponsor)"
                                  className="px-2.5 py-1.5 rounded-lg bg-[#0e1017] border border-cyan-500/50 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-36"
                                />
                                <select
                                  value={field.type}
                                  onChange={(e) => {
                                    const newType = e.target.value as "text" | "image" | "counter";
                                    const matching = modalLayers.find((l) => (newType === "image" ? l.type === "image" : l.type !== "image"));
                                    handleUpdateFieldById(field.id, {
                                      type: newType,
                                      layerKey: matching?.key || field.layerKey,
                                    });
                                  }}
                                  className="px-2 py-1.5 rounded-lg bg-[#0e1017] border border-white/10 text-xs text-slate-300 font-mono cursor-pointer"
                                >
                                  <option value="text">Text</option>
                                  <option value="image">Image</option>
                                  <option value="counter">Counter</option>
                                </select>
                              </>
                            )}
                          </div>

                          {/* Target Canvas Layer Dropdown */}
                          <div className="flex-1 flex items-center gap-2 min-w-[190px]">
                            <span className="text-[11px] text-slate-400 whitespace-nowrap font-mono">
                              Layer:
                            </span>
                            <select
                              value={field.layerKey}
                              onChange={(e) =>
                                handleUpdateFieldById(field.id, { layerKey: e.target.value })
                              }
                              className="flex-1 px-3 py-1.5 rounded-lg bg-[#0e1017] border border-white/10 text-xs font-mono text-white cursor-pointer focus:outline-none focus:border-cyan-400"
                            >
                              {field.layerKey && !modalLayers.some((l) => l.key === field.layerKey) && (
                                <option key={`current-${field.id}-${field.layerKey}`} value={field.layerKey}>
                                  {field.layerKey} (Current)
                                </option>
                              )}
                              {modalLayers.length > 0 ? (
                                modalLayers.map((l, lIdx) => (
                                  <option key={`layer-opt-${field.id}-${l.key}-${lIdx}`} value={l.key}>
                                    {l.label || l.name || l.key}
                                  </option>
                                ))
                              ) : (
                                !field.layerKey && <option value="">No layers detected</option>
                              )}
                            </select>
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveFunction(field.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer self-end sm:self-center"
                            title="Remove function"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {renderAddAttributeButton()}
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer & Validation Status */}
            <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {activeFields.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-cyan-300 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeFields.length} function{activeFields.length > 1 ? "s" : ""} configured</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Add at least 1 function attribute</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full glass-pill hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={!isFormValid || isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-bold text-white transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? "Saving..." : "Save Configuration"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Official Sandboxed Templated.io Editor */}
      <TemplatedEditor
        isOpen={isEmbedOpen}
        workspaceId={workspace?.id}
        includeAccountTemplates={activeEmbedMode === "gallery" || activeEmbedClone}
        clone={activeEmbedClone}
        initialMode={activeEmbedMode}
        templateId={
          activeEmbedTemplateId === "new" || activeEmbedTemplateId === "gallery"
            ? undefined
            : activeEmbedTemplateId
        }
        onClose={() => setIsEmbedOpen(false)}
        onSaveSuccess={() => {
          fetchTemplates(false);
        }}
      />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400 font-sans">Loading Template Studio...</p>
        </div>
      }
    >
      <TemplatesContent />
    </Suspense>
  );
}
