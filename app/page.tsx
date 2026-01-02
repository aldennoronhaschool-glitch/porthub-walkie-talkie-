import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/channels");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4 text-center">
      <div className="max-w-md space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            PortHub
          </h1>
          <p className="text-zinc-400 text-lg">
            Real-time voice channels for your browser.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/sign-in"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-all"
          >
            Get Started
          </Link>
          <Link
            href="/sign-up"
            className="text-zinc-500 hover:text-zinc-300 text-sm"
          >
            Create an account
          </Link>
        </div>

        <div className="pt-8 grid grid-cols-3 gap-4 text-center text-sm text-zinc-500">
          <div>
            <div className="text-2xl mb-2">🎙️</div>
            Push to Talk
          </div>
          <div>
            <div className="text-2xl mb-2">🔒</div>
            Private Rooms
          </div>
          <div>
            <div className="text-2xl mb-2">🎉</div>
            Emoji Bursts
          </div>
        </div>
      </div>
    </div>
  );
}
