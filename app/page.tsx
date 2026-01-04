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
      <div className="relative z-10 w-full h-full flex flex-col justify-end items-center pb-20 pointer-events-none">

        {/* Glass Card for Buttons */}
        <div className="pointer-events-auto bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-2xl max-w-sm w-[90%] mx-4 animate-in slide-in-from-bottom-20 fade-in duration-1000">
          <div className="text-center space-y-1">
            <h1 className="text-5xl font-black text-white tracking-tighter italic">PORTHUB</h1>
            <p className="text-zinc-400 text-sm font-medium tracking-wide uppercase">Walkie Talkie Reimagined</p>
          </div>

          <div className="flex flex-col w-full gap-3 pt-4">
            <Link
              href="/sign-up"
              className="w-full py-4 rounded-2xl bg-white text-black font-black text-lg hover:scale-[1.02] active:scale-95 transition-all text-center shadow-xl shadow-white/10"
            >
              GET STARTED
            </Link>
            <Link
              href="/sign-in"
              className="w-full py-4 rounded-2xl bg-white/5 text-white border border-white/5 font-bold text-lg hover:bg-white/10 active:scale-95 transition-all text-center"
            >
              LOG IN
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
