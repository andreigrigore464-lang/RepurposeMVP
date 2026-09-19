import prisma from "./prisma";
import { DynamicTemplateConfig } from "./templated";
import { isEmailWhitelisted } from "./whitelist";
export { isEmailWhitelisted };

// Multi-tenant workspace and account resolution
export const DEFAULT_WORKSPACE_SLUG = "default-workspace";

export interface MockWorkspace {
  id: string;
  name: string;
  slug: string;
}

export interface StarterTemplateConfig {
  id: string;
  name: string;
  templatedTemplateId: string;
  previewImageUrl: string;
  aspectRatio: string;
  hasBackgroundPlaceholder: boolean;
  isConfigured: boolean;
  layerMappings: {
    headline_layer: string;
    body_layer: string;
    background_layer: string;
    logo_layer: string;
    counter_layer: string;
  };
  dynamicConfig: DynamicTemplateConfig;
}

export const STARTER_TEMPLATES: StarterTemplateConfig[] = [];

// In-memory fallback if PostgreSQL is not active
export const fallbackStore: {
  workspace: MockWorkspace;
  templates: Array<{
    id: string;
    workspaceId: string;
    name: string;
    templatedTemplateId: string;
    previewImageUrl: string;
    aspectRatio: string;
    hasBackgroundPlaceholder: boolean;
    isConfigured?: boolean;
    layerMappings: Record<string, unknown>;
    dynamicConfig?: DynamicTemplateConfig;
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
  },
  templates: [],
  workflows: [],
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

export interface ResolvedUserWorkspace {
  user: {
    id: string;
    clerkId: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    isWhitelisted: boolean;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Gets or creates a personalized workspace for a Clerk user.
 */
export async function getOrCreateUserWorkspace(clerkUser: {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}): Promise<ResolvedUserWorkspace> {
  const isWhitelisted = isEmailWhitelisted(clerkUser.email);
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    const mockUserId = `user-${clerkUser.id}`;
    const mockWorkspaceId = `ws-${clerkUser.id}`;
    return {
      user: {
        id: mockUserId,
        clerkId: clerkUser.id,
        email: clerkUser.email,
        fullName: clerkUser.fullName || "Studio Creator",
        avatarUrl: clerkUser.avatarUrl || null,
        isWhitelisted,
      },
      workspace: {
        id: mockWorkspaceId,
        name: `${clerkUser.fullName || "My"} Workspace`,
        slug: `ws-${clerkUser.id.slice(0, 12)}`,
      },
    };
  }

  try {
    // 1. Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ clerkId: clerkUser.id }, { email: clerkUser.email.toLowerCase() }],
      },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.email.toLowerCase(),
          fullName: clerkUser.fullName || "Studio Creator",
          avatarUrl: clerkUser.avatarUrl || null,
          isWhitelisted,
        },
        include: {
          memberships: {
            include: {
              workspace: true,
            },
          },
        },
      });
    } else if (!user.clerkId || user.clerkId !== clerkUser.id) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          clerkId: clerkUser.id,
          fullName: clerkUser.fullName || user.fullName,
          avatarUrl: clerkUser.avatarUrl || user.avatarUrl,
          isWhitelisted: user.isWhitelisted || isWhitelisted,
        },
        include: {
          memberships: {
            include: {
              workspace: true,
            },
          },
        },
      });
    }

    // 2. Resolve or create user's workspace
    let workspace = user.memberships[0]?.workspace;

    if (!workspace) {
      const slug = `ws-${clerkUser.id.slice(0, 8)}-${Date.now().toString(36)}`;
      workspace = await prisma.workspace.create({
        data: {
          name: `${user.fullName || "My"} Workspace`,
          slug,
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
        },
      });
    }

    return {
      user: {
        id: user.id,
        clerkId: clerkUser.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        isWhitelisted: user.isWhitelisted || isWhitelisted,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
    };
  } catch (error) {
    console.error("[getOrCreateUserWorkspace Error]:", error);
    const mockUserId = `user-${clerkUser.id}`;
    const mockWorkspaceId = `ws-${clerkUser.id}`;
    return {
      user: {
        id: mockUserId,
        clerkId: clerkUser.id,
        email: clerkUser.email,
        fullName: clerkUser.fullName || "Studio Creator",
        avatarUrl: clerkUser.avatarUrl || null,
        isWhitelisted,
      },
      workspace: {
        id: mockWorkspaceId,
        name: `${clerkUser.fullName || "My"} Workspace`,
        slug: `ws-${clerkUser.id.slice(0, 12)}`,
      },
    };
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
    });

    if (!workspace) {
      const defaultUser = await prisma.user.upsert({
        where: { email: "founder@repurposemvp.local" },
        update: {},
        create: {
          email: "founder@repurposemvp.local",
          fullName: "Workspace Owner",
          isWhitelisted: true,
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
        },
      });
    }

    return workspace;
  } catch {
    return fallbackStore.workspace;
  }
}

/**
 * Resolves the authenticated user and their isolated workspace for the current request.
 * Falls back to default workspace if no user is signed in (e.g. during local tests without auth).
 */
export async function getCurrentWorkspace(): Promise<ResolvedUserWorkspace> {
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();

    if (clerkUser) {
      const primaryEmail = clerkUser.emailAddresses?.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "";

      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || "Studio Creator";

      return await getOrCreateUserWorkspace({
        id: clerkUser.id,
        email: primaryEmail,
        fullName,
        avatarUrl: clerkUser.imageUrl,
      });
    }
  } catch (error) {
    console.error("[getCurrentWorkspace Error]:", error);
  }

  // Fallback to default workspace for development or unauthenticated contexts
  const defaultWs = await getOrCreateDefaultWorkspace();
  return {
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      clerkId: "default-user",
      email: "founder@repurposemvp.local",
      fullName: "Workspace Owner",
      avatarUrl: null,
      isWhitelisted: true,
    },
    workspace: {
      id: defaultWs.id,
      name: defaultWs.name,
      slug: defaultWs.slug,
    },
  };
}
