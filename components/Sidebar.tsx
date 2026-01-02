"use client";

import { useState } from "react";
import { Search, Plus, User, Mic } from "lucide-react";

export function Sidebar() {
    const [activeTab, setActiveTab] = useState<'friends' | 'rooms'>('friends');

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/30">
            {/* Tabs */}
            <div className="grid grid-cols-2 p-2 gap-2">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'friends' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                >
                    Friends
                </button>
                <button
                    onClick={() => setActiveTab('rooms')}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'rooms' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                >
                    Recent Rooms
                </button>
            </div>

            {/* Search */}
            <div className="px-3 pb-3">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 pl-9 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-700"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {activeTab === 'friends' ? (
                    <>
                        <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Online</div>
                        {/* Mock Friend */}
                        <button className="w-full flex items-center p-2 rounded-lg hover:bg-zinc-800/50 transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mr-3">
                                JD
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">John Doe</div>
                                <div className="text-xs text-zinc-500 truncate">Online</div>
                            </div>
                            <Mic className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                        <p className="text-zinc-500 text-sm mb-4">No recent rooms</p>
                        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
                            <Plus className="w-4 h-4" />
                            New Room
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
                <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-md text-sm font-medium transition-colors">
                    <User className="w-4 h-4" />
                    add friend
                </button>
            </div>
        </div>
    );
}
