import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-950">
            <SignUp appearance={{
                elements: {
                    rootBox: "mx-auto",
                    card: "bg-zinc-900 border border-zinc-800 text-white",
                    headerTitle: "text-white",
                    headerSubtitle: "text-zinc-400",
                    socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700",
                    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
                    footerActionLink: "text-indigo-400 hover:text-indigo-300"
                }
            }} />
        </div>
    );
}
