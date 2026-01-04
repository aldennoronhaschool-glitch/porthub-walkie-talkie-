import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingScene from "@/components/LandingScene";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/channels");
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* 3D Scene Background */}
      <LandingScene />

      {/* Overlay Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center pointer-events-none">

        {/* Minimalist Overlay (No Card) */}
        <div className="pointer-events-auto flex flex-col items-center gap-8 w-full max-w-sm mx-4 animate-in fade-in zoom-in duration-1000">
          <div className="text-center space-y-2">
            <h1 className="text-7xl font-thin text-white tracking-wide">Porthub</h1>
            <p className="text-zinc-400 text-lg font-light tracking-[0.2em] font-sans">For everyday</p>
          </div>

          <div className="flex flex-col w-full gap-4">
            <Link
              href="/sign-up"
              className="w-full py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform text-center shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              Get Started
            </Link>
            <Link
              href="/sign-in"
              className="w-full py-4 rounded-full bg-transparent text-white border border-white/20 font-medium text-lg hover:bg-white/10 transition-all text-center backdrop-blur-sm"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
