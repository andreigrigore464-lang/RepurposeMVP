import { NextResponse } from "next/server";
import { getOrCreateDefaultWorkspace } from "@/lib/workspace";

// GET /api/v1/templated/assets
// Provides external assets for Templated.io embedded editor's External Assets panel
export async function GET() {
  try {
    const workspace = await getOrCreateDefaultWorkspace();

    // Curated high-res brand & presentation background assets
    const assets = [
      {
        id: "asset_bg_gradient_dark",
        name: "Dark Mesh Gradient",
        type: "image",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "asset_bg_neon_abstract",
        name: "Neon Tech Waves",
        type: "image",
        url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "asset_bg_minimalist_geo",
        name: "Minimalist Geometry",
        type: "image",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "asset_bg_cyber_space",
        name: "Cyber Grid Horizon",
        type: "image",
        url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=300&auto=format&fit=crop",
      },
      {
        id: "asset_logo_repurpose",
        name: "RepurposeAI Badge Logo",
        type: "image",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop",
      },
    ];

    return NextResponse.json({
      success: true,
      workspaceId: workspace.id,
      assets,
    });
  } catch (error) {
    console.error("Error serving Templated external assets:", error);
    return NextResponse.json({
      success: true,
      assets: [],
    });
  }
}
