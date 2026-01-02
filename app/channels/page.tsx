import { UserButton } from "@clerk/nextjs";
import { Room } from "@/components/Room";

export default function ChannelsPage() {
    return (
        <div className="flex h-screen bg-zinc-950 text-white overflow-hidden relative">
            {/* User Button - Top Right */}
            <div className="absolute top-4 right-4 z-50">
                <UserButton afterSignOutUrl="/"
                    appearance={{
                        elements: {
                            avatarBox: "w-10 h-10"
                        }
                    }}
                />
            </div>

            {/* Main Content - Full Screen Room */}
            <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950">
                <Room />
            </div>
        </div>
    );
}
