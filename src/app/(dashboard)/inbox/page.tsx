"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Inbox,
  CheckCircle2,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface RenderedSlide {
  slide_index: number;
  headline: string;
  body: string;
  rendered_png_url: string;
  background_image_url?: string | null;
}

interface DraftItem {
  id: string;
  destinationPlatform: string;
  postTitle: string;
  postCaption: string;
  postHashtags: string[];
  slidesData: RenderedSlide[];
  pdfDocumentUrl?: string | null;
  status: "PENDING_APPROVAL" | "APPROVED" | "PUBLISHED" | "REJECTED";
  publishedAt?: string | null;
  createdAt: string;
}

export default function ApprovalInboxPage() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PENDING_APPROVAL" | "APPROVED">("ALL");
  const [activeSlideIndexes, setActiveSlideIndexes] = useState<Record<string, number>>({});
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/inbox");
      if (res.ok) {
        const data = await res.json();
        const rawDrafts: DraftItem[] = data.drafts || [];
        const uniqueDrafts = Array.from(new Map(rawDrafts.map((d) => [d.id, d])).values());
        setDrafts(uniqueDrafts);
      }
    } catch (err) {
      console.error("Failed to fetch drafts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/v1/inbox")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (isMounted) {
          const rawDrafts: DraftItem[] = data.drafts || [];
          const uniqueDrafts = Array.from(new Map(rawDrafts.map((d) => [d.id, d])).values());
          setDrafts(uniqueDrafts);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch drafts:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: DraftItem["status"]) => {
    try {
      const res = await fetch("/api/v1/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setDrafts((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
        );
      }
    } catch (err) {
      console.error("Failed to update draft status:", err);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    try {
      const res = await fetch(`/api/v1/inbox?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete draft:", err);
    }
  };

  const handleCopyCaption = (draft: DraftItem) => {
    const text = `${draft.postCaption}\n\n${draft.postHashtags?.join(" ") || ""}`;
    navigator.clipboard.writeText(text);
    setCopiedDraftId(draft.id);
    setTimeout(() => setCopiedDraftId(null), 2000);
  };

  const setSlideForDraft = (draftId: string, index: number) => {
    setActiveSlideIndexes((prev) => ({ ...prev, [draftId]: index }));
  };

  const filteredDrafts = drafts.filter((d) => {
    if (activeFilter === "ALL") return true;
    return d.status === activeFilter;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">Approval Inbox</h1>
          </div>
          <p className="text-sm text-zinc-400">
            Review, edit, and approve AI-generated carousel presentations and social card drafts before publishing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDrafts()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Refresh inbox drafts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : "text-zinc-400"}`} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === "ALL" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All ({drafts.length})
            </button>
            <button
              onClick={() => setActiveFilter("PENDING_APPROVAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === "PENDING_APPROVAL"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Pending ({drafts.filter((d) => d.status === "PENDING_APPROVAL").length})
            </button>
            <button
              onClick={() => setActiveFilter("APPROVED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === "APPROVED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Approved ({drafts.filter((d) => d.status === "APPROVED" || d.status === "PUBLISHED").length})
            </button>
          </div>
        </div>
      </div>

      {/* Drafts List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
          <p className="text-xs text-zinc-400">Loading inbox drafts...</p>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30 space-y-3">
          <Inbox className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-300">Inbox is Empty</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Run an AI repurpose workflow to generate your first social carousel draft.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredDrafts.map((draft) => {
            const currentSlideIndex = activeSlideIndexes[draft.id] || 0;
            const slidesCount = draft.slidesData?.length || 1;
            const currentSlide = draft.slidesData?.[currentSlideIndex] || draft.slidesData?.[0];

            return (
              <div
                key={draft.id}
                className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/80 transition-all shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Left: Carousel Slide Visual Preview */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Slide {currentSlideIndex + 1} of {slidesCount}
                      </span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setSlideForDraft(
                            draft.id,
                            currentSlideIndex > 0 ? currentSlideIndex - 1 : currentSlideIndex
                          )
                        }
                        disabled={currentSlideIndex === 0}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4 text-zinc-300" />
                      </button>
                      <button
                        onClick={() =>
                          setSlideForDraft(
                            draft.id,
                            currentSlideIndex < slidesCount - 1
                              ? currentSlideIndex + 1
                              : currentSlideIndex
                          )
                        }
                        disabled={currentSlideIndex === slidesCount - 1}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 text-zinc-300" />
                      </button>
                    </div>
                  </div>

                  {/* Active Slide Image */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentSlide?.rendered_png_url}
                      alt={draft.postTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Thumbnail Strip */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {draft.slidesData?.map((slide, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSlideForDraft(draft.id, idx)}
                        className={`relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          currentSlideIndex === idx
                            ? "border-emerald-500 scale-105"
                            : "border-zinc-800 opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slide.rendered_png_url}
                          alt={`Thumb ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Post Details, Caption & Action Bar */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                              draft.status === "APPROVED" || draft.status === "PUBLISHED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {draft.status === "APPROVED" ? "Approved" : "Pending Review"}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">
                            Target: {draft.destinationPlatform}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">{draft.postTitle}</h3>
                      </div>

                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Delete Draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                          Post Caption & Hashtags
                        </span>
                        <button
                          onClick={() => handleCopyCaption(draft)}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium"
                        >
                          {copiedDraftId === draft.id ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedDraftId === draft.id ? "Copied!" : "Copy Caption"}</span>
                        </button>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono whitespace-pre-wrap max-h-[160px] overflow-y-auto leading-relaxed">
                        {draft.postCaption}
                        {"\n\n"}
                        {draft.postHashtags?.join(" ")}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {draft.pdfDocumentUrl && (
                        <a
                          href={draft.pdfDocumentUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Download PDF</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {draft.status !== "APPROVED" && draft.status !== "PUBLISHED" ? (
                        <button
                          onClick={() => handleUpdateStatus(draft.id, "APPROVED")}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Mark Ready</span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <Check className="w-4 h-4" />
                          <span>Approved</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
