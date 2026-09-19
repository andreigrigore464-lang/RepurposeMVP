import React from "react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { SignIn, SignUp, UserButton } from "@clerk/nextjs";
import { isEmailWhitelisted } from "@/lib/workspace";
import { AmbientGlow } from "@/components/ui/ambient-glow";
import {
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { redirect } from "next/navigation";

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode = "sign-up" } = await searchParams;
  const user = await currentUser();

  const userEmail =
    user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    null;

  const isApproved = isEmailWhitelisted(userEmail);

  // If already approved, direct directly to the main application
  if (user && isApproved) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">
      {/* Ambient background glows */}
      <AmbientGlow variant="combo" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-blue-600/15 via-cyan-500/10 to-emerald-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#08090d] rounded-[15px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
          </div>
          <div>
            <span className="font-bold tracking-tight text-white flex items-center gap-1 text-lg">
              Repurpose<span className="text-cyan-400">Studio</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              AI Content Transformer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-white/[0.05] border border-white/10 px-3.5 py-1.5 rounded-full">
              <span className="text-xs text-slate-300 font-medium max-w-[150px] sm:max-w-[200px] truncate">
                {userEmail}
              </span>
              <UserButton />
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-semibold text-cyan-300">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>Private Beta Access</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col items-center justify-center z-20">
        {user && !isApproved ? (
          /* ======================================================== */
          /* STATE: SIGNED IN BUT PENDING WHITELIST APPROVAL          */
          /* ======================================================== */
          <div className="max-w-xl w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-semibold text-amber-300 shadow-lg shadow-amber-500/10">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
              <span>Priority Waitlist # Active</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              You&apos;re on the early access waitlist!
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg mx-auto">
              Your account for <span className="text-cyan-300 font-medium">{userEmail}</span> has been registered. We are onboarding new creators in small batches to preserve ultra-fast GPU rendering speeds.
            </p>

            {/* Status Card */}
            <div className="p-6 rounded-3xl bg-[#0c0e15]/90 border border-white/10 backdrop-blur-xl shadow-2xl text-left space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-white">
                    Account Verification Complete
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    We will notify you at <strong className="text-slate-200">{userEmail}</strong> the moment your studio environment is provisioned.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-4 space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Upcoming Features In Your Studio:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Multi-Slide LinkedIn PDF Decks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Templated.io Dynamic Layers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Automated RSS &amp; Blog Scraping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Personal Brand Kits &amp; Palettes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Switcher */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2">
              <span>Need to switch accounts?</span>
              <div className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors">
                <UserButton showName />
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STATE: GUEST / SIGN-IN & SIGN-UP FLOW                   */
          /* ======================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full max-w-5xl">
            {/* Left Column: Product Value & Teaser */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-300 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Private Early Access Studio</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Turn Any Article into High-Converting Social Slides.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Connect your blog or paste any URL. RepurposeStudio extracts hooks, summarizes takeaways, designs pixel-perfect slide decks, and builds downloadable PDF carousels in seconds.
              </p>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Instant Repurposing</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Scrapes articles &amp; generates 5-slide carousels automatically.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Automated PDFs</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Multi-page stitched PDFs ready for LinkedIn document posts.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Authorized test accounts receive instant access upon sign-in.</span>
              </div>
            </div>

            {/* Right Column: Clerk Auth Card */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-md p-1 rounded-3xl bg-gradient-to-b from-cyan-500/30 via-white/[0.08] to-transparent shadow-2xl">
                <div className="p-6 sm:p-7 rounded-[23px] bg-[#0c0e15]/95 backdrop-blur-2xl border border-white/10 space-y-5">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {mode === "sign-in" ? "Sign In to Studio" : "Claim Your Early Access"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {mode === "sign-in"
                        ? "Enter your approved credentials to continue"
                        : "Sign up to join the waitlist or unlock approved tester access"}
                    </p>
                  </div>

                  {/* Auth Mode Toggle */}
                  <div className="flex p-1 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                    <Link
                      href="/waitlist?mode=sign-up"
                      className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                        mode !== "sign-in"
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Join Waitlist
                    </Link>
                    <Link
                      href="/waitlist?mode=sign-in"
                      className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                        mode === "sign-in"
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Sign In
                    </Link>
                  </div>

                  {/* Clerk Auth Component */}
                  <div className="clerk-auth-container flex justify-center pt-1">
                    {mode === "sign-in" ? (
                      <SignIn
                        routing="hash"
                        fallbackRedirectUrl="/"
                        signUpUrl="/waitlist?mode=sign-up"
                      />
                    ) : (
                      <SignUp
                        routing="hash"
                        fallbackRedirectUrl="/"
                        signInUrl="/waitlist?mode=sign-in"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-6 text-center text-xs text-slate-500 border-t border-white/[0.05] z-20">
        <p>&copy; {new Date().getFullYear()} RepurposeStudio. All rights reserved.</p>
      </footer>
    </div>
  );
}
