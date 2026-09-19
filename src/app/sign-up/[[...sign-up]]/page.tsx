import { SignUp } from "@clerk/nextjs";
import { AmbientGlow } from "@/components/ui/ambient-glow";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <AmbientGlow variant="combo" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-blue-600/20 via-cyan-500/15 to-emerald-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Brand Header */}
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
            <div className="w-full h-full bg-[#08090d] rounded-[15px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform duration-200" />
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
        </Link>
      </div>

      <div className="z-10">
        <SignUp fallbackRedirectUrl="/" signInUrl="/waitlist?mode=sign-in" />
      </div>
    </div>
  );
}
