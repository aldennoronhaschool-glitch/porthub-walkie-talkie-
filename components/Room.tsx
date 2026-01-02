"use client";

import { Mic, MicOff, Radio, Plus, Settings, UserPlus, X, Search, ChevronRight, Moon, Globe, Lock, Unlock, MessageSquare, Bell, Volume2, Shield, LogOut, Users, Smile, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { requestNotificationPermission, notifyUserJoined, notifyUserLeft } from "@/lib/notifications";
import { setupBackgroundAudio, cleanupBackgroundAudio } from "@/lib/wakeLock";

type ViewState = 'DASHBOARD' | 'SETTINGS' | 'ADD_FRIEND' | 'CALL' | 'EDIT_PROFILE';

export function Room() {
    const { user } = useUser();
    const [view, setView] = useState<ViewState>('DASHBOARD');
    const [roomID, setRoomID] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const zpRef = useRef<any>(null);
    const isMicOnRef = useRef(false);
    const [isTalking, setIsTalking] = useState(false);
    const [isSilentMode, setIsSilentMode] = useState(false);

    // Hands-free mode state
    const [isHandsFree, setIsHandsFree] = useState(false);

    // Track if Zego is already initializing/initialized
    const isInitializingRef = useRef(false);

    // Notification permission state
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    // Request notification permission on mount
    useEffect(() => {
        const checkNotificationPermission = async () => {
            const granted = await requestNotificationPermission();
            setNotificationsEnabled(granted);
        };
        checkNotificationPermission();
    }, []);

    // Fetch user PIN on mount
    useEffect(() => {
        const fetchUserPin = async () => {
            try {
                const response = await fetch('/api/user-pin');
                if (response.ok) {
                    const data = await response.json();
                    setUserPin(data.pin);
                }
            } catch (error) {
                console.error('Error fetching user PIN:', error);
            }
        };
        fetchUserPin();
    }, []);

    // Background audio cleanup ref
    const backgroundAudioCleanupRef = useRef<(() => void) | null>(null);

    // Emoji reactions state
    const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; x: number }>>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiIdCounter = useRef(0);

    // User PIN state
    const [userPin, setUserPin] = useState<string>('');

    // --- Zego Logic ---
    const startCall = (element: HTMLDivElement | null) => {
        if (!element || !user || !roomID) return;

        // Prevent duplicate initialization
        if (zpRef.current || isInitializingRef.current) {
            console.log('Zego already initialized or initializing, skipping...');
            return;
        }

        const initMeeting = async () => {
            try {
                isInitializingRef.current = true;

                const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
                const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";

                if (!appID || !serverSecret) {
                    console.error('Missing Zego credentials');
                    isInitializingRef.current = false;
                    return;
                }

                const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                    appID,
                    serverSecret,
                    roomID,
                    user.id,
                    user.fullName || user.id
                );

                const zp = ZegoUIKitPrebuilt.create(kitToken);
                zpRef.current = zp;

                await zp.joinRoom({
                    container: element,
                    sharedLinks: [{ name: 'Copy Link', url: window.location.href }],
                    scenario: { mode: (ZegoUIKitPrebuilt as any).GroupVoiceCall },
                    turnOnMicrophoneWhenJoining: false,
                    turnOnCameraWhenJoining: false,
                    showMyCameraToggleButton: false,
                    showMyMicrophoneToggleButton: true, // Needed for logic, hidden via CSS
                    showAudioVideoSettingsButton: false,
                    showTextChat: false,
                    showUserList: false,
                    showPreJoinView: false,
                    onMicrophoneStateUpdated: (state: any) => {
                        isMicOnRef.current = state === 1 || state === true || state === 'ON';
                        // Sync UI state if external change happens
                        if (isMicOnRef.current !== isTalking) {
                            setIsTalking(isMicOnRef.current);
                        }
                    },
                    onUserJoin: (userList: any[]) => {
                        setUsers(prev => [...prev, ...userList]);
                        // Notify about new users
                        if (notificationsEnabled && !isSilentMode) {
                            userList.forEach(u => notifyUserJoined(u.userName || 'Someone'));
                        }
                    },
                    onUserLeave: (userList: any[]) => {
                        setUsers(prev => prev.filter(u => !userList.some(left => left.userID === u.userID)));
                        // Notify about users leaving
                        if (notificationsEnabled && !isSilentMode) {
                            userList.forEach(u => notifyUserLeft(u.userName || 'Someone'));
                        }
                    },
                    onLeaveRoom: () => {
                        endCall();
                    }
                });

                // Setup background audio support (wake lock + audio context)
                const cleanup = await setupBackgroundAudio();
                backgroundAudioCleanupRef.current = cleanup;

                isInitializingRef.current = false;
            } catch (error) {
                console.error('Error initializing Zego:', error);
                isInitializingRef.current = false;
                zpRef.current = null;
            }
        };

        setTimeout(initMeeting, 100);
    };

    const toggleMic = (forceState?: boolean) => {
        const micBtn = document.querySelector('.myCallContainer button') as HTMLButtonElement;
        if (!micBtn) return;

        // Zego's button toggles. We rely on isMicOnRef to know current state.
        if (forceState !== undefined) {
            // Only click if the current state differs from desired state
            if (forceState !== isMicOnRef.current) micBtn.click();
        } else {
            micBtn.click();
        }
    };

    const startTalk = () => {
        if (isHandsFree) return; // Ignore hold if locked on
        toggleMic(true);
        setIsTalking(true);
    };

    const stopTalk = () => {
        if (isHandsFree) return; // Ignore release if locked on
        toggleMic(false);
        setIsTalking(false);
    };

    const toggleHandsFree = () => {
        const newState = !isHandsFree;
        setIsHandsFree(newState);

        if (newState) {
            // Enabling hands-free
            toggleMic(true);
            setIsTalking(true);
        } else {
            // Disabling hands-free
            toggleMic(false);
            setIsTalking(false);
        }
    };

    const endCall = () => {
        // Cleanup background audio
        if (backgroundAudioCleanupRef.current) {
            backgroundAudioCleanupRef.current();
            backgroundAudioCleanupRef.current = null;
        }
        cleanupBackgroundAudio();

        if (zpRef.current) zpRef.current.destroy();
        zpRef.current = null;
        setUsers([]);
        setRoomID("");
        setIsHandsFree(false);
        setIsTalking(false);
        setView('DASHBOARD');
    };

    const handleCreateGroup = () => {
        const newRoomID = Math.floor(Math.random() * 10000) + "";
        setRoomID(newRoomID);
        setView('CALL');
    };

    const handleSendFriendRequest = (pin: string) => {
        if (!pin) return;
        // logic to send request would go here
        alert(`Friend request sent to ${pin}!`);
        setView('DASHBOARD');
    };

    // Emoji reaction handler
    const sendEmoji = (emoji: string) => {
        const id = emojiIdCounter.current++;
        const x = Math.random() * 60 - 30; // Random x offset between -30 and 30
        setFloatingEmojis(prev => [...prev, { id, emoji, x }]);

        // Remove emoji after animation completes
        setTimeout(() => {
            setFloatingEmojis(prev => prev.filter(e => e.id !== id));
        }, 3000);

        setShowEmojiPicker(false);
    };

    // --- Sub-Components ---

    // 1. Dashboard
    const Dashboard = () => (
        <div className="flex flex-col h-full p-6 pt-12 relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <button className="p-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800"><Search className="w-6 h-6" /></button>
                <button onClick={() => setView('SETTINGS')} className="p-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800"><Settings className="w-6 h-6" /></button>
            </div>

            {/* Profile */}
            <div className="flex flex-col items-center mb-10">
                <div className="w-32 h-32 rounded-full border-4 border-zinc-900 overflow-hidden mb-4 shadow-2xl">
                    <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">{user?.firstName || "User"}</h1>
                <div className="bg-zinc-800 px-4 py-1.5 rounded-full flex items-center gap-2">
                    <span className="text-zinc-500 font-bold text-xs tracking-widest uppercase">MY PIN</span>
                    <span className="text-white font-mono font-bold select-all">{userPin || 'Loading...'}</span>
                </div>
            </div>

            {/* Actions Row */}
            <div className="flex justify-center gap-6 mb-12">
                {/* Silent Mode */}
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={() => setIsSilentMode(!isSilentMode)}
                        className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center transition-all ${isSilentMode ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500'}`}
                    >
                        <div className="flex items-center gap-1">
                            {isSilentMode ? <div className="w-8 h-8 rounded-full bg-black"></div> : <Smile className="w-8 h-8" />}
                        </div>
                    </button>
                    <span className="text-zinc-600 text-xs font-bold">silent mode</span>
                </div>

                {/* Add Friends */}
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={() => setView('ADD_FRIEND')}
                        className="w-20 h-20 rounded-[2.5rem] bg-zinc-900 text-white flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        <Plus className="w-8 h-8" />
                    </button>
                    <span className="text-zinc-600 text-xs font-bold">add friends</span>
                </div>

                {/* New Group */}
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={handleCreateGroup}
                        className="w-20 h-20 rounded-[2.5rem] bg-zinc-900 text-white flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        <Users className="w-8 h-8" />
                    </button>
                    <span className="text-zinc-600 text-xs font-bold">new group</span>
                </div>
            </div>

            {/* Friends / Rooms List */}
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-800">
                <p className="font-bold text-lg">No friends yet</p>
                <p className="text-sm">Share your PIN to connect!</p>
            </div>
        </div>
    );

    // 2. Settings
    const SettingsView = () => (
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

    const SettingsItem = ({ icon, label, onClick }: any) => (
        <button onClick={onClick} className="w-full flex items-center gap-4 p-5 rounded-3xl bg-zinc-900/50 text-white hover:bg-zinc-900 transition-colors">
            {icon && <div className="text-white">{icon}</div>}
            <span className="font-bold text-lg">{label}</span>
            <ChevronRight className="ml-auto w-5 h-5 text-zinc-500" />
        </button>
    );

    const ToggleItem = ({ label, defaultChecked }: any) => {
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

    // 3. Edit Profile
    const EditProfileView = () => {
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
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Failed to upload image');
            } finally {
                setUploading(false);
            }
        };

        const handleSaveUsername = async () => {
            if (!user || !username.trim()) return;

            try {
                setSaving(true);
                await user.update({ firstName: username.trim() });
                alert('Username updated!');
                setView('SETTINGS');
            } catch (error) {
                console.error('Error updating username:', error);
                alert('Failed to update username');
            } finally {
                setSaving(false);
            }
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
                    {/* Profile Picture */}
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
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Username Input */}
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

                    {/* PIN Display */}
                    <div className="bg-zinc-900 px-6 py-3 rounded-full flex items-center gap-3 mb-8">
                        <span className="text-zinc-500 font-bold text-xs tracking-widest uppercase">MY PIN</span>
                        <span className="text-white font-mono font-bold text-lg">{userPin || 'Loading...'}</span>
                    </div>
                </div>

                {/* Save Button */}
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

    // 4. Add Friend (Updated)
    const AddFriendView = () => {
        const [pin, setPin] = useState("");
        return (
            <div className="flex flex-col h-full bg-black p-6 pt-12">
                <div className="flex justify-between items-center mb-12">
                    <button onClick={() => setView('DASHBOARD')} className="p-2 bg-zinc-900 rounded-full text-white">
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-white font-black text-xl">add by #pin</h2>
                    <div className="w-10"></div>
                </div>

                <div className="flex-1 flex flex-col items-center">
                    <p className="text-zinc-500 font-medium mb-6">ask your friend for their pin</p>

                    <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-4 flex items-center gap-2 mb-8 border border-zinc-800">
                        <span className="text-zinc-500 text-2xl font-bold pl-4">#</span>
                        <input
                            type="text"
                            autoFocus
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="bg-transparent border-none outline-none text-white text-2xl font-bold w-full placeholder-zinc-700 uppercase"
                            placeholder=""
                        />
                    </div>

                    <div className="bg-zinc-900 px-6 py-3 rounded-full flex items-center gap-3">
                        <span className="text-zinc-500 font-bold text-xs tracking-widest uppercase">MY PIN</span>
                        <span className="text-white font-mono font-bold text-lg">{userPin || 'Loading...'}</span>
                    </div>
                </div>

                <div className="mt-auto flex justify-end pb-8">
                    <button
                        onClick={() => handleSendFriendRequest(pin)}
                        disabled={!pin}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${pin ? 'bg-white text-black hover:scale-110' : 'bg-zinc-800 text-zinc-600'}`}
                    >
                        <Send className="w-8 h-8" />
                    </button>
                </div>
            </div>
        );
    };

    // 5. Call (Walkie Talkie UI)
    const CallView = () => (
        <div className="flex-1 flex flex-col relative h-full bg-black overflow-hidden font-sans select-none">
            {/* Hidden Zego Container */}
            <div
                className="myCallContainer opacity-0 pointer-events-none absolute inset-0"
                ref={startCall}
            ></div>

            {/* Main Surface */}
            <div className="relative z-10 flex flex-col h-full p-6">

                {/* Header */}
                <div className="flex justify-between items-start">
                    <button
                        onClick={endCall}
                        className="w-10 h-10 bg-zinc-900/50 rounded-full flex items-center justify-center text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="bg-zinc-900/50 px-4 py-1 rounded-full">
                        <span className="text-zinc-400 text-xs font-bold tracking-widest">CHANNEL: {roomID.slice(0, 6)}...</span>
                    </div>
                </div>

                {/* Top: Users Cloud */}
                <div className="flex-1 relative w-full max-w-md mx-auto mt-10">
                    <AnimatePresence>
                        {users.map((u, i) => (
                            <motion.div
                                key={u.userID}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1, y: [0, -10, 0] }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ y: { repeat: Infinity, duration: 3 + i, ease: "easeInOut" } }}
                                className="absolute flex flex-col items-center gap-2"
                                style={{
                                    left: '50%',
                                    top: '20%',
                                    marginLeft: `${(i % 3 - 1) * 100}px`,
                                    marginTop: `${Math.floor(i / 3) * 120}px`
                                }}
                            >
                                <div className="w-20 h-20 rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-xl overflow-hidden relative">
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-2xl">
                                        {u.userName?.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="absolute inset-0 ring-4 ring-black/20 rounded-full"></div>
                                </div>
                                <span className="text-white font-bold text-lg drop-shadow-md">{u.userName}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {users.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 mt-20">
                            <p className="text-lg font-medium">Waiting for others...</p>
                        </div>
                    )}
                </div>

                {/* Bottom: Controls */}
                <div className="mt-auto flex flex-col items-center gap-8 pb-12">
                    <h2 className="text-2xl font-black text-white tracking-tight">{user?.firstName}</h2>
                    <div className="w-full max-w-xs flex items-center justify-center px-4 relative">

                        {/* Lock Button (Hands-free) */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <button
                                onClick={toggleHandsFree}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 ${isHandsFree ? 'bg-green-500 border-green-500 text-black' : 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'}`}
                                title={isHandsFree ? "Unlock Mic" : "Lock Mic (Hands-free)"}
                            >
                                {isHandsFree ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* PTT Button */}
                        <div className="relative group">
                            <div className={`absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-sm font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200 ${isTalking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                {isTalking ? (isHandsFree ? 'Mic Locked Open' : 'Transmitting...') : 'hold to talk'}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                            </div>
                            {isTalking && (
                                <motion.div
                                    initial={{ scale: 1, opacity: 0.5 }}
                                    animate={{ scale: 1.5, opacity: 0 }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="absolute inset-0 bg-green-500 rounded-full z-0"
                                />
                            )}
                            <button
                                onMouseDown={startTalk}
                                onMouseUp={stopTalk}
                                onMouseLeave={stopTalk}
                                onTouchStart={startTalk}
                                onTouchEnd={stopTalk}
                                className={`relative z-10 w-28 h-28 rounded-full border-[6px] transition-all transform active:scale-95 shadow-2xl overflow-hidden ${isTalking ? 'border-green-500 scale-105' : 'border-white hover:border-zinc-200'}`}
                            >
                                <img src={user?.imageUrl} alt="Me" className="w-full h-full object-cover" />
                            </button>
                            <div className={`absolute bottom-2 right-2 z-20 w-6 h-6 rounded-full border-4 border-black ${isTalking ? 'bg-green-500' : 'bg-zinc-500'}`}></div>
                        </div>

                        {/* Emoji Button (Right side) */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-zinc-700 text-white flex items-center justify-center hover:border-zinc-500 transition-all text-3xl"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Floating Emojis */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <AnimatePresence>
                            {floatingEmojis.map(({ id, emoji, x }) => (
                                <motion.div
                                    key={id}
                                    initial={{ y: 0, x: `calc(50% + ${x}px)`, opacity: 1, scale: 1 }}
                                    animate={{ y: -400, opacity: 0, scale: 1.5 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 3, ease: "easeOut" }}
                                    className="absolute bottom-32 text-6xl"
                                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                                >
                                    {emoji}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Emoji Picker Modal */}
                    <AnimatePresence>
                        {showEmojiPicker && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-zinc-900 rounded-3xl p-4 shadow-2xl border border-zinc-800 z-50"
                            >
                                <div className="grid grid-cols-4 gap-3">
                                    {['👋', '👍', '❤️', '😂', '🔥', '👏', '🎉', '😍'].map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => sendEmoji(emoji)}
                                            className="w-14 h-14 text-4xl hover:scale-125 transition-transform active:scale-95"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 h-full bg-black overflow-hidden font-sans select-none text-white">
            <AnimatePresence mode="wait">
                {view === 'DASHBOARD' && (
                    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                        <Dashboard />
                    </motion.div>
                )}
                {view === 'SETTINGS' && (
                    <motion.div key="settings" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="h-full absolute inset-0 z-20">
                        <SettingsView />
                    </motion.div>
                )}
                {view === 'EDIT_PROFILE' && (
                    <motion.div key="edit_profile" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="h-full absolute inset-0 z-20">
                        <EditProfileView />
                    </motion.div>
                )}
                {view === 'ADD_FRIEND' && (
                    <motion.div key="add_friend" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="h-full absolute inset-0 z-20">
                        <AddFriendView />
                    </motion.div>
                )}
                {view === 'CALL' && (
                    <motion.div key="call" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="h-full absolute inset-0 z-50">
                        <CallView />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
