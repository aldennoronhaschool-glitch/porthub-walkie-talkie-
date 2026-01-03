"use client";

import { Mic, MicOff, Radio, Plus, Settings, UserPlus, X, Search, ChevronRight, Moon, Globe, Lock, Unlock, MessageSquare, Bell, Volume2, Shield, LogOut, Users, Smile, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { requestNotificationPermission, notifyUserJoined, notifyUserLeft } from "@/lib/notifications";
import { setupBackgroundAudio, cleanupBackgroundAudio } from "@/lib/wakeLock";
// import { useAudioRecorder, useAudioPlayer } from "@/hooks/useAudio"; // Deprecated
import { useWebRTC } from "@/hooks/useWebRTC";
import { supabase } from "@/lib/supabase";

type ViewState = 'DASHBOARD' | 'SETTINGS' | 'ADD_FRIEND' | 'CALL' | 'EDIT_PROFILE';

// --- Extracted Components ---

const AddFriendView = ({
    setView,
    pin,
    setPin,
    onSend,
    loading,
    userPin
}: {
    setView: any,
    pin: string,
    setPin: any,
    onSend: any,
    loading: boolean,
    userPin: string
}) => {
    return (
        <div key="add-friend-view" className="flex flex-col h-full bg-black p-6 pt-12">
            <div className="flex justify-between items-center mb-12">
                <button onClick={() => setView('DASHBOARD')} className="p-2 bg-zinc-900 rounded-full text-white"><X className="w-6 h-6" /></button>
                <h2 className="text-white font-black text-xl">add friend</h2>
                <div className="w-10"></div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-8">
                <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-6 flex items-center gap-2 border-2 border-zinc-800">
                    <span className="text-zinc-500 text-3xl font-bold">#</span>
                    <input
                        type="text" autoFocus value={pin}
                        onChange={(e) => setPin(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && onSend(pin)}
                        className="bg-transparent border-none outline-none text-white text-3xl font-bold w-full uppercase"
                        placeholder="XXXX-XXXX" maxLength={9}
                    />
                </div>
                <div className="text-center">
                    <p className="text-zinc-600 text-sm mb-2">Your PIN:</p>
                    <span className="text-white font-mono font-bold text-2xl tracking-wider">{userPin}</span>
                </div>
            </div>
            <div className="mt-auto pb-8">
                <button onClick={() => onSend(pin)} disabled={!pin.trim() || loading} className="w-full py-4 rounded-full font-bold text-lg bg-white text-black">
                    {loading ? 'Sending...' : 'Send Friend Request'}
                </button>
            </div>
        </div>
    );
};

export function Room() {
    const { user } = useUser();
    const [view, setView] = useState<ViewState>('DASHBOARD');

    // Core Walkie Talkie State (WebRTC)
    const [activeFriend, setActiveFriend] = useState<any>(null);

    // WebRTC Hook
    const {
        connectionStatus,
        isSpeaking,
        isRemoteSpeaking,
        startSpeaking,
        stopSpeaking
    } = useWebRTC(user?.id, activeFriend?.clerk_user_id);

    // UI State
    const [userPin, setUserPin] = useState<string>('');
    const [friends, setFriends] = useState<any[]>([]);
    const [friendRequests, setFriendRequests] = useState<{ received: any[], sent: any[] }>({ received: [], sent: [] });
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [addFriendPin, setAddFriendPin] = useState(""); // Lifted state for Add Friend input

    // Emoji & Misc
    const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; x: number }>>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiIdCounter = useRef(0);
    const emojiIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isSilentMode, setIsSilentMode] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isHandsFree, setIsHandsFree] = useState(false);

    // Initial Setup
    useEffect(() => {
        const init = async () => {
            const granted = await requestNotificationPermission();
            setNotificationsEnabled(granted);
            await setupBackgroundAudio(); // Keep audio context alive
        };
        init();
        return () => { cleanupBackgroundAudio(); };
    }, []);

    // Fetch User PIN & Friends
    useEffect(() => {
        if (!user) return;

        const fetchPin = async () => {
            try {
                const res = await fetch('/api/user-pin');
                if (res.ok) {
                    const data = await res.json();
                    setUserPin(data.pin);
                } else if (user.id) {
                    // Fallback
                    const fallback = user.id.slice(-8).toUpperCase();
                    setUserPin(`${fallback.slice(0, 4)}-${fallback.slice(4)}`);
                }
            } catch (e) { console.error(e); }
        };

        const fetchFriends = async () => {
            console.log("🔄 Polling friends/requests...");
            try {
                const [fRes, rRes] = await Promise.all([
                    fetch('/api/friends'),
                    fetch('/api/friend-request')
                ]);

                if (fRes.ok) {
                    const fData = await fRes.json();
                    // console.log("👥 Friends Data:", fData);
                    setFriends(fData.friends || []);
                }

                if (rRes.ok) {
                    const rData = await rRes.json();
                    // console.log("📩 Requests Data:", rData);
                    setFriendRequests(rData);
                }
            } catch (e) { console.error("❌ Error polling:", e); }
        };

        fetchPin();
        fetchFriends();

        // Refresh friends every 3s to keep list fast
        const interval = setInterval(fetchFriends, 3000);
        return () => clearInterval(interval);
    }, [user]);

    // --- Actions ---

    const handleStartTalk = async () => {
        if (isHandsFree) return;
        startSpeaking();
    };

    const handleStopTalk = async () => {
        if (isHandsFree) return;
        stopSpeaking();
    };

    const toggleHandsFree = () => {
        const newState = !isHandsFree;
        setIsHandsFree(newState);

        if (newState) {
            startSpeaking();
        } else {
            stopSpeaking();
        }
    };

    // --- Friend Management Handlers ---
    const handleSendFriendRequest = async (pin: string) => {
        if (!pin) return;
        setLoadingFriends(true);
        try {
            const res = await fetch('/api/friend-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pin.toUpperCase() })
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message || "Request sent!");
                setView('DASHBOARD');
            } else {
                alert(`Failed: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to send request (Network Error)");
        } finally {
            setLoadingFriends(false);
        }
    };

    const handleFriendAction = async (requestId: string, action: 'accept' | 'reject') => {
        try {
            const res = await fetch('/api/friend-request', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action })
            });

            if (res.ok) {
                // Quick refresh
                const [fRes, rRes] = await Promise.all([
                    fetch('/api/friends'),
                    fetch('/api/friend-request')
                ]);
                if (fRes.ok) setFriends((await fRes.json()).friends || []);
                if (rRes.ok) setFriendRequests(await rRes.json());
                alert(`Request ${action}ed!`);
            } else {
                alert("Action failed");
            }
        } catch (e) { alert("Action failed (Network Error)"); }
    };

    // --- Views ---

    const Dashboard = () => (
        <div className="flex flex-col h-full p-6 pt-12 relative">
            <div className="flex justify-between items-center mb-8">
                <div className="w-10"></div>
                <h1 className="text-white font-black text-2xl tracking-wider">CHANNELS</h1>
                <button onClick={() => setView('SETTINGS')} className="p-2 bg-zinc-900 rounded-full text-white transition-colors hover:bg-zinc-800">
                    <Settings className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-24">
                <button
                    onClick={() => setView('ADD_FRIEND')}
                    className="w-full bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-2xl p-4 flex items-center gap-3 mb-6 hover:bg-zinc-900 transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white transition-colors">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-zinc-500 font-bold group-hover:text-zinc-300 transition-colors">ADD NEW FRIEND</span>
                </button>

                {friendRequests.received.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Requests</h3>
                        {friendRequests.received.map((req: any) => (
                            <div key={req.id} className="bg-zinc-900 rounded-2xl p-4 flex justify-between mb-2">
                                <span className="text-white font-bold">{req.sender?.username}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleFriendAction(req.id, 'accept')} className="text-green-500 font-bold">✓</button>
                                    <button onClick={() => handleFriendAction(req.id, 'reject')} className="text-red-500 font-bold">✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Friends ({friends.length})</h3>
                <div className="space-y-2">
                    {friends.map((friend: any) => {
                        // For now, only show speaking status if connected
                        const isActive = activeFriend?.clerk_user_id === friend.clerk_user_id;
                        const showSpeaking = isActive && isRemoteSpeaking;
                        return (
                            <button
                                key={friend.clerk_user_id}
                                onClick={() => { setActiveFriend(friend); setView('CALL'); }}
                                className={`w-full rounded-2xl p-4 flex items-center gap-3 transition-all ${showSpeaking ? 'bg-indigo-900/50 border-2 border-indigo-500' : 'bg-zinc-900 hover:bg-zinc-800'}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                    {friend.username?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-white font-bold">{friend.username}</p>
                                    {showSpeaking && <p className="text-indigo-400 text-xs font-bold animate-pulse">Speaking...</p>}
                                </div>
                                <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const CallView = () => (
        <div className="flex-1 flex flex-col h-full bg-black p-6 relative">
            <div className="flex justify-between items-start mb-8">
                <button onClick={() => { setActiveFriend(null); setView('DASHBOARD'); }} className="p-2 bg-zinc-900 rounded-full text-white"><ChevronRight className="w-6 h-6 rotate-180" /></button>
                <div className="flex flex-col items-center">
                    <h2 className="text-zinc-500 font-bold text-sm tracking-widest uppercase">TALKING TO</h2>
                    <h1 className="text-white font-black text-2xl">{activeFriend?.username}</h1>
                    <span className={`text-xs font-bold mt-1 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {connectionStatus === 'connected' ? 'CONNECTED' : 'CONNECTING...'}
                    </span>
                    {isRemoteSpeaking && (
                        <span className="text-indigo-400 text-xs font-bold animate-pulse mt-1">THEY ARE SPEAKING...</span>
                    )}
                </div>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                {/* Main PTT Button */}
                <div className="relative w-64 h-64">
                    {isSpeaking && (
                        <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                    )}
                    <button
                        onMouseDown={handleStartTalk}
                        onMouseUp={handleStopTalk}
                        onMouseLeave={handleStopTalk}
                        onTouchStart={handleStartTalk}
                        onTouchEnd={handleStopTalk}
                        className={`relative w-full h-full rounded-full border-8 transition-all flex items-center justify-center
                            ${isSpeaking ? 'border-indigo-500 bg-indigo-500/10 scale-95' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}
                            ${isHandsFree ? 'border-red-500 bg-red-500/10' : ''}
                        `}
                    >
                        {isSpeaking ? (
                            <div className="flex flex-col items-center gap-2">
                                <Radio className="w-20 h-20 text-indigo-500 animate-pulse" />
                                <span className="text-indigo-400 font-bold tracking-wider">ON AIR</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Mic className="w-20 h-20 text-white" />
                                <span className="text-zinc-500 font-bold tracking-wider">HOLD TO TALK</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            <div className="h-20 flex justify-center items-center">
                <button
                    onClick={toggleHandsFree}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all ${isHandsFree ? 'bg-red-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}
                >
                    {isHandsFree ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {isHandsFree ? 'HANDS FREE ON' : 'HANDS FREE'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-full w-full bg-black text-white relative">
            <AnimatePresence mode="wait">
                {view === 'DASHBOARD' && <Dashboard />}
                {view === 'CALL' && <CallView />}
                {view === 'ADD_FRIEND' && (
                    <AddFriendView
                        setView={setView}
                        pin={addFriendPin}
                        setPin={setAddFriendPin}
                        onSend={handleSendFriendRequest}
                        loading={loadingFriends}
                        userPin={userPin}
                    />
                )}
                {view === 'SETTINGS' && <SettingsView />}
                {view === 'EDIT_PROFILE' && <EditProfileView />}
            </AnimatePresence>
        </div>
    );

    // --- Auxiliary Views ---

    function SettingsView() {
        return (
            <div className="flex flex-col h-full bg-black p-6 pt-12">
                <div className="flex items-center mb-8 relative">
                    <button onClick={() => setView('DASHBOARD')} className="absolute left-0 p-2 bg-zinc-900 rounded-full text-white">
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <div className="mx-auto flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full overflow-hidden mb-2 border-2 border-zinc-800">
                            <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-xl font-bold text-white">{user?.firstName}</h2>
                    </div>
                </div>

                <div className="space-y-2">
                    <SettingsItem icon={<MessageSquare />} label="edit profile" onClick={() => setView('EDIT_PROFILE')} />
                    <SettingsItem icon={<Shield />} label="legal stuff" />
                    <SettingsItem icon={<LogOut />} label="sign out" onClick={() => window.location.reload()} />
                </div>

                <div className="mt-8 space-y-6">
                    <ToggleItem label="vibrations" defaultChecked />
                    <ToggleItem label="sync with phone dnd" defaultChecked={false} />
                </div>
            </div>
        );
    }

    function SettingsItem({ icon, label, onClick }: any) {
        return (
            <button onClick={onClick} className="w-full flex items-center gap-4 p-5 rounded-3xl bg-zinc-900/50 text-white hover:bg-zinc-900 transition-colors">
                {icon && <div className="text-white">{icon}</div>}
                <span className="font-bold text-lg">{label}</span>
                <ChevronRight className="ml-auto w-5 h-5 text-zinc-500" />
            </button>
        );
    }

    function ToggleItem({ label, defaultChecked }: any) {
        const [isChecked, setIsChecked] = useState(defaultChecked);
        return (
            <div className="flex items-center justify-between px-2">
                <span className="text-white font-bold text-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Volume2 className="w-5 h-5" />
                    </div>
                    {label}
                </span>
                <button
                    onClick={() => setIsChecked(!isChecked)}
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${isChecked ? 'bg-white' : 'bg-zinc-800'}`}
                >
                    <div className={`w-6 h-6 rounded-full bg-black transition-transform ${isChecked ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
            </div>
        );
    };

    function EditProfileView() {
        const [username, setUsername] = useState(user?.firstName || "");
        const [uploading, setUploading] = useState(false);
        const [saving, setSaving] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);

        const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file || !user) return;
            try {
                setUploading(true);
                await user.setProfileImage({ file });
                alert('Profile picture updated!');
            } catch (error) { console.error('Error uploading image:', error); alert('Failed to upload image'); }
            finally { setUploading(false); }
        };

        const handleSaveUsername = async () => {
            if (!user || !username.trim()) return;
            try {
                setSaving(true);
                await user.update({ firstName: username.trim() });
                alert('Username updated!');
                setView('SETTINGS');
            } catch (error) { console.error('Error updating username:', error); alert('Failed to update username'); }
            finally { setSaving(false); }
        };

        return (
            <div className="flex flex-col h-full bg-black p-6 pt-12">
                <div className="flex items-center mb-8 relative">
                    <button onClick={() => setView('SETTINGS')} className="absolute left-0 p-2 bg-zinc-900 rounded-full text-white">
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <h2 className="mx-auto text-xl font-bold text-white">Edit Profile</h2>
                </div>

                <div className="flex-1 flex flex-col items-center">
                    <div className="relative mb-8">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800">
                            <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
                        >
                            {uploading ? '...' : '📷'}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>

                    <div className="w-full max-w-md mb-4">
                        <label className="text-zinc-500 text-sm font-bold mb-2 block">USERNAME</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white text-lg font-bold outline-none focus:border-white transition-colors"
                            placeholder="Enter your name"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSaveUsername}
                    disabled={saving || !username.trim()}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${saving || !username.trim()
                        ? 'bg-zinc-800 text-zinc-600'
                        : 'bg-white text-black hover:bg-zinc-200'
                        }`}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        );
    };
}
