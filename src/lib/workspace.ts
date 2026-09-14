import prisma from "./prisma";

export const DEFAULT_WORKSPACE_SLUG = "default-workspace";

export interface MockBrandKit {
  id: string;
  workspaceId: string;
  name: string;
  logoCloudinaryUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockWorkspace {
  id: string;
  name: string;
  slug: string;
  brandKits: MockBrandKit[];
}

export const STARTER_TEMPLATES = [
  {
    id: "tmpl-starter-1",
    name: "Modern Carousel Hook (1:1)",
    templatedTemplateId: "tmpl_hook_square_01",
    previewImageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    aspectRatio: "1:1",
    hasBackgroundPlaceholder: true,
    layerMappings: {
      headline_layer: "headline_text",
      body_layer: "body_text",
      background_layer: "background_image",
      logo_layer: "brand_logo",
      counter_layer: "slide_counter",
    },
  },
  {
    id: "tmpl-starter-2",
    name: "LinkedIn Deep-Dive Slide (4:5)",
    templatedTemplateId: "tmpl_content_portrait_02",
    previewImageUrl:
      "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop",
    aspectRatio: "4:5",
    hasBackgroundPlaceholder: true,
    layerMappings: {
      headline_layer: "headline_text",
      body_layer: "body_text",
      background_layer: "background_image",
      logo_layer: "brand_logo",
      counter_layer: "slide_counter",
    },
  },
  {
    id: "tmpl-starter-3",
    name: "Viral Social Card / Quote (16:9)",
    templatedTemplateId: "tmpl_quote_landscape_03",
    previewImageUrl:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop",
    aspectRatio: "16:9",
    hasBackgroundPlaceholder: false,
    layerMappings: {
      headline_layer: "headline_text",
      body_layer: "body_text",
      background_layer: "background_image",
      logo_layer: "brand_logo",
      counter_layer: "slide_counter",
    },
  },
];

// In-memory fallback if PostgreSQL is not active
export const fallbackStore: {
  workspace: MockWorkspace;
  templates: Array<{
    id: string;
    workspaceId: string;
    brandKitId?: string;
    name: string;
    templatedTemplateId: string;
    previewImageUrl: string;
    aspectRatio: string;
    hasBackgroundPlaceholder: boolean;
    layerMappings: {
      headline_layer: string;
      body_layer: string;
      background_layer: string;
      logo_layer: string;
      counter_layer: string;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  workflows: Array<{
    id: string;
    workspaceId: string;
    name: string;
    isActive: boolean;
    sourcePlatform: string;
    sourceRssFeedUrl?: string | null;
    destinationPlatform: string;
    brandTemplateId?: string | null;
    outputFormat: string;
    backgroundStrategy: string;
    isAutopilot: boolean;
    filterRules: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }>;
  drafts: Array<{
    id: string;
    workspaceId: string;
    executionId?: string | null;
    destinationPlatform: string;
    postTitle: string;
    postCaption: string;
    postHashtags: string[];
    slidesData: Array<{
      slide_index: number;
      headline: string;
      body: string;
      rendered_png_url: string;
      background_image_url?: string | null;
    }>;
    pdfDocumentUrl?: string | null;
    status: string;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
} = {
  workspace: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "My Workspace",
    slug: DEFAULT_WORKSPACE_SLUG,
    brandKits: [
      {
        id: "00000000-0000-0000-0000-000000000002",
        workspaceId: "00000000-0000-0000-0000-000000000001",
        name: "Default Brand Kit",
        logoCloudinaryUrl: null,
        primaryColor: "#0F172A",
        secondaryColor: "#F8FAFC",
        accentColor: "#00FF66",
        fontFamily: "Inter",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
  templates: [],
  workflows: [
    {
      id: "wf-default-1",
      workspaceId: "00000000-0000-0000-0000-000000000001",
      name: "Blog Article to LinkedIn Carousel Deck",
      isActive: true,
      sourcePlatform: "CUSTOM_URL",
      sourceRssFeedUrl: null,
      destinationPlatform: "LINKEDIN",
      brandTemplateId: "tmpl_hook_square_01",
      outputFormat: "MULTI_SLIDE_CAROUSEL",
      backgroundStrategy: "ARTICLE_IMAGE_FIRST",
      isAutopilot: false,
      filterRules: { min_word_count: 150, keywords_include: [], keywords_exclude: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "wf-default-2",
      workspaceId: "00000000-0000-0000-0000-000000000001",
      name: "Viral Quote Card for Twitter / X",
      isActive: true,
      sourcePlatform: "BLOG_RSS",
      sourceRssFeedUrl: "https://techcrunch.com/feed/",
      destinationPlatform: "TWITTER_X",
      brandTemplateId: "tmpl_quote_landscape_03",
      outputFormat: "SINGLE_IMAGE_CARD",
      backgroundStrategy: "STOCK_SEARCH_ONLY",
      isAutopilot: false,
      filterRules: { min_word_count: 200, keywords_include: [], keywords_exclude: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  drafts: [],
};

let isDbOnline: boolean | null = null;
let lastDbCheck = 0;
const DB_CHECK_INTERVAL_MS = 20000; // Cache check result for 20s

/**
 * Rapidly checks if PostgreSQL is reachable (max 800ms probe) and caches status
 * to prevent hanging TCP connection timeouts on every API request.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  const now = Date.now();
  if (isDbOnline !== null && now - lastDbCheck < DB_CHECK_INTERVAL_MS) {
    return isDbOnline;
  }

  try {
    const probe = Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB Connection Timeout")), 800)),
    ]);
    await probe;
    isDbOnline = true;
    lastDbCheck = now;
    return true;
  } catch {
    isDbOnline = false;
    lastDbCheck = now;
    return false;
  }
}

/**
 * Gets or creates the default workspace and user for single-tenant / development context.
 */
export async function getOrCreateDefaultWorkspace() {
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return fallbackStore.workspace;
  }

  try {
    let workspace = await prisma.workspace.findUnique({
      where: { slug: DEFAULT_WORKSPACE_SLUG },
      include: {
        brandKits: true,
      },
    });

    if (!workspace) {
      const defaultUser = await prisma.user.upsert({
        where: { email: "founder@repurposemvp.local" },
        update: {},
        create: {
          email: "founder@repurposemvp.local",
          fullName: "Workspace Owner",
        },
      });

      workspace = await prisma.workspace.create({
        data: {
          name: "My Workspace",
          slug: DEFAULT_WORKSPACE_SLUG,
          members: {
            create: {
              userId: defaultUser.id,
              role: "OWNER",
            },
          },
          brandKits: {
            create: {
              name: "Default Brand Kit",
              primaryColor: "#0F172A",
              secondaryColor: "#F8FAFC",
              accentColor: "#00FF66",
              fontFamily: "Inter",
            },
          },
        },
        include: {
          brandKits: true,
        },
      });
    }

    return workspace;
  } catch {
    return fallbackStore.workspace;
  }
}
