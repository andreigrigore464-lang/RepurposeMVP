import prisma from "./prisma";

export const DEFAULT_WORKSPACE_SLUG = "default-workspace";

/**
 * Gets or creates the default workspace and user for single-tenant / development context.
 */
export async function getOrCreateDefaultWorkspace() {
  let workspace = await prisma.workspace.findUnique({
    where: { slug: DEFAULT_WORKSPACE_SLUG },
    include: {
      brandKits: true,
    },
  });

  if (!workspace) {
    // Create default user and workspace
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
            accentColor: "#10B981",
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
}
