import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isEmailWhitelisted } from "@/lib/whitelist";

// Public routes accessible without an approved account
const isWaitlistOrAuthRoute = createRouteMatcher([
  "/waitlist(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/__clerk(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const url = req.nextUrl;
  const isAuthOrWaitlist = isWaitlistOrAuthRoute(req);

  // 1. Unauthenticated users:
  if (!userId) {
    if (isAuthOrWaitlist) {
      return NextResponse.next();
    }
    // Block all other routes and redirect to /waitlist
    const waitlistUrl = new URL("/waitlist", req.url);
    return NextResponse.redirect(waitlistUrl);
  }

  // 2. Authenticated users: resolve primary email
  let userEmail: string | null = null;

  if (sessionClaims) {
    const claims = sessionClaims as Record<string, unknown>;
    if (typeof claims.email === "string") {
      userEmail = claims.email;
    } else if (typeof claims.primary_email === "string") {
      userEmail = claims.primary_email;
    } else if (typeof claims.email_address === "string") {
      userEmail = claims.email_address;
    }
  }

  if (!userEmail) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      userEmail =
        user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        null;
    } catch (e) {
      console.error("[Proxy Auth Error]:", e);
    }
  }

  const isApproved = isEmailWhitelisted(userEmail);

  // 3. User is NOT approved / whitelisted:
  if (!isApproved) {
    if (url.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Access pending: Your account is on the waitlist.", isWaitlisted: true },
        { status: 403 }
      );
    }

    // Only allow /waitlist, /sign-in, /sign-up
    if (url.pathname === "/waitlist" || url.pathname.startsWith("/sign-in") || url.pathname.startsWith("/sign-up")) {
      return NextResponse.next();
    }

    // Strictly redirect any other page to /waitlist
    const waitlistUrl = new URL("/waitlist", req.url);
    return NextResponse.redirect(waitlistUrl);
  }

  // 4. User IS approved / whitelisted:
  // If an approved user visits /waitlist, redirect them to the home page (landing page / full website)
  if (url.pathname === "/waitlist") {
    const homeUrl = new URL("/", req.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
