"use client";

import { Mic, MicOff, Radio, Plus, Settings, UserPlus, X, Search, ChevronRight, Moon, Globe, Lock, Unlock, MessageSquare, Bell, Volume2, Shield, LogOut, Users, Smile, Send, CheckCheck, Image as ImageIcon, Timer, Eye } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useClerk } from "@clerk/nextjs";
import { requestNotificationPermission, notifyUserJoined, notifyUserLeft } from "@/lib/notifications";
import { setupBackgroundAudio, cleanupBackgroundAudio } from "@/lib/wakeLock";
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
    const [mode, setMode] = useState<'input' | 'scan' | 'myqr'>('input');
    const QRCode = require('qrcode.react').QRCodeSVG;

    const handleShare = async () => {
        const qrCanvas = document.getElementById('my-qr-code');
        if (!qrCanvas) return;

        try {
            // Convert SVG to canvas for sharing
            const svg = qrCanvas.querySelector('svg');
            if (!svg) return;

            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = async () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);

                canvas.toBlob(async (blob) => {
                    if (!blob) return;

                    const file = new File([blob], 'qr-code.png', { type: 'image/png' });

                    if (navigator.share && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: 'My Friend QR Code',
                            text: `Add me on PortHub! My PIN: ${userPin}`,
                            files: [file]
                        });
                    } else {
                        // Fallback: download the image
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'my-qr-code.png';
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                });
            };

            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        } catch (error) {
            console.error('Share failed:', error);
            alert('Failed to share QR code');
        }
    };

    if (mode === 'scan') {
        const { QRCodeScanner } = require('@/components/QRCodeScanner');
        return (
            <QRCodeScanner
                onScan={(decodedText: string) => {
                    setPin(decodedText);
                    setMode('input');
                    onSend(decodedText);
                }}
                onClose={() => setMode('input')}
            />
        );
    }

    if (mode === 'myqr') {
        return (
            <div key="my-qr-view" className="flex flex-col h-full bg-black p-6 pt-12">
                <div className="flex justify-between items-center mb-12">
                    <button onClick={() => setMode('input')} className="p-2 bg-zinc-900 rounded-full text-white">
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-white font-black text-xl">my qr code</h2>
                    <div className="w-10"></div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-8">
                    <div id="my-qr-code" className="bg-white p-8 rounded-3xl shadow-2xl">
                        <QRCode value={userPin} size={256} level="H" />
                    </div>

                    <div className="text-center">
                        <p className="text-zinc-500 text-sm mb-2">Your PIN</p>
                        <span className="text-white font-mono font-bold text-2xl tracking-wider">{userPin}</span>
                    </div>

                    <p className="text-zinc-600 text-sm text-center max-w-md">
                        Share this QR code with friends to let them add you instantly
                    </p>
                </div>

                <div className="mt-auto pb-8 space-y-3">
                    <button
                        onClick={handleShare}
                        className="w-full py-4 rounded-full font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                        Share QR Code
                    </button>
                    <button
                        onClick={() => setMode('input')}
                        className="w-full py-4 rounded-full font-bold text-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div key="add-friend-view" className="flex flex-col h-full bg-black p-6 pt-12">
            <div className="flex justify-between items-center mb-12">
                <button onClick={() => setView('DASHBOARD')} className="p-2 bg-zinc-900 rounded-full text-white">
                    <X className="w-6 h-6" />
                </button>
                <h2 className="text-white font-black text-xl">add friend</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-8">
                {/* Manual PIN Input */}
                <div className="w-full max-w-md">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3 text-center">
                        Enter Friend's PIN
                    </p>
                    <div className="bg-zinc-900 rounded-3xl p-6 flex items-center gap-2 border-2 border-zinc-800">
                        <span className="text-zinc-500 text-3xl font-bold">#</span>
                        <input
                            type="text"
                            autoFocus
                            value={pin}
                            onChange={(e) => setPin(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && onSend(pin)}
                            className="bg-transparent border-none outline-none text-white text-3xl font-bold w-full uppercase"
                            placeholder="XXXX-XXXX"
                            maxLength={9}
                        />
                    </div>
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-4 w-full max-w-md">
                    <div className="flex-1 h-px bg-zinc-800"></div>
                    <span className="text-zinc-600 text-xs font-bold uppercase">or</span>
                    <div className="flex-1 h-px bg-zinc-800"></div>
                </div>

                {/* QR Code Options */}
                <div className="w-full max-w-md grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setMode('scan')}
                        className="aspect-square bg-zinc-900 border-2 border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-zinc-800 hover:border-indigo-500 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <span className="text-zinc-500 font-bold text-sm group-hover:text-white transition-colors">
                            Scan QR
                        </span>
                    </button>

                    <button
                        onClick={() => setMode('myqr')}
                        className="aspect-square bg-zinc-900 border-2 border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-zinc-800 hover:border-indigo-500 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </div>
                        <span className="text-zinc-500 font-bold text-sm group-hover:text-white transition-colors">
                            My QR
                        </span>
                    </button>
                </div>

                {/* Your PIN Display */}
                <div className="text-center mt-4">
                    <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">Your PIN</p>
                    <span className="text-white font-mono font-bold text-xl tracking-wider">{userPin}</span>
                </div>
            </div>

            <div className="mt-auto pb-8">
                <button
                    onClick={() => onSend(pin)}
                    disabled={!pin.trim() || loading}
                    className={`w-full py-4 rounded-full font-bold text-lg transition-all ${!pin.trim() || loading
                            ? 'bg-zinc-800 text-zinc-600'
                            : 'bg-white text-black hover:bg-zinc-200'
                        }`}
                >
                    {loading ? 'Sending...' : 'Send Friend Request'}
                </button>
            </div>
        </div>
    );
};

const EditProfileView = ({ user, setView }: { user: any, setView: any }) => {
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
            // 1. Update Clerk
            await user.update({ firstName: username.trim() });

            // 2. Update Supabase (so friends see the new name)
            await fetch('/api/user-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim() })
            });

            alert('Username updated!');
            setView('SETTINGS');
        } catch (error) { console.error('Error updating username:', error); alert('Failed to update username'); }
        finally { setSaving(false); }
    };

    return (
        <div key="edit-profile-view" className="flex flex-col h-full bg-black p-6 pt-12">
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

export function Room() {
    console.log("🚀 Ten Ten UI Loaded v2.1 (Desktop Fix)");
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
        stopSpeaking,
        remoteAudioRef
    } = useWebRTC(user?.id, activeFriend?.clerk_user_id);

    // UI State
    const [userPin, setUserPin] = useState<string>('');
    const [friends, setFriends] = useState<any[]>([]);
    const friendsRef = useRef<any[]>([]); // Ref to access friends inside effect without trigger
    useEffect(() => { friendsRef.current = friends; }, [friends]);

    const [friendRequests, setFriendRequests] = useState<{ received: any[], sent: any[] }>({ received: [], sent: [] });
    const [addFriendPin, setAddFriendPin] = useState("");
    const [loadingFriends, setLoadingFriends] = useState(false);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Image Message State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isViewOnce, setIsViewOnce] = useState(false);
    const [viewingImage, setViewingImage] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isChatOpen]);

    // Chat Subscription
    useEffect(() => {
        if (!activeFriend || !user) return;

        const fetchHistory = async () => {
            const { data } = await supabase.from('messages')
                .select('*')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: true }); // optimize query later if needed

            // Client-side filter for strict pair (since .or query is broad)
            const conversation = data?.filter((m: any) =>
                (m.sender_id === user.id && m.receiver_id === activeFriend.clerk_user_id) ||
                (m.sender_id === activeFriend.clerk_user_id && m.receiver_id === user.id)
            ) || [];
            setChatMessages(conversation);
        };
        fetchHistory();

        const channel = supabase.channel(`chat_room`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const m = payload.new;
                    if (
                        (m.sender_id === user.id && m.receiver_id === activeFriend.clerk_user_id) ||
                        (m.sender_id === activeFriend.clerk_user_id && m.receiver_id === user.id)
                    ) {
                        setChatMessages(prev => [...prev, m]);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    setChatMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeFriend, user]);

    // Mark messages as read when chat is open
    useEffect(() => {
        if (isChatOpen && chatMessages.length > 0 && user) {
            const unreadIds = chatMessages
                .filter((m: any) => m.receiver_id === user.id && !m.is_read)
                .map((m: any) => m.id);

            if (unreadIds.length > 0) {
                // Determine valid UUIDs to avoid errors
                supabase.from('messages').update({ is_read: true }).in('id', unreadIds).then(({ error }) => {
                    if (error) console.error("Failed to mark read", error);
                });
            }
        }
    }, [chatMessages, isChatOpen, user]); // Re-run when messages update or chat opens

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !imageFile) || !user || !activeFriend) return;

        let type = 'text';
        let mediaUrl = null;

        if (imageFile) {
            type = 'image';

            // Upload to ImageKit via our API route
            try {
                const formData = new FormData();
                formData.append('file', imageFile);

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Upload failed');
                }

                const data = await res.json();
                mediaUrl = data.url;
            } catch (error) {
                console.error("Upload failed", error);
                // Ideally show toast error
                return;
            }
        }

        const msg = {
            sender_id: user.id,
            receiver_id: activeFriend.clerk_user_id,
            content: newMessage,
            type,
            media_url: mediaUrl,
            is_view_once: isViewOnce,
            is_read: false,
            created_at: new Date().toISOString()
        };

        // Optimistic update
        // setChatMessages(prev => [...prev, { ...msg, id: 'temp-' + Date.now() }]); 

        const { error } = await supabase.from('messages').insert(msg);
        if (error) console.error("Send failed", error);

        setNewMessage("");
        setImageFile(null);
        setIsViewOnce(false);
    };

    const handleFileSelect = (e: any) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const openImage = (msg: any) => {
        setViewingImage(msg);
        if (msg.is_view_once && user && msg.receiver_id === user.id && !msg.is_viewed) {
            supabase.from('messages').update({ is_viewed: true }).eq('id', msg.id).then();
        }
    };

    // Auto-Answer / Global Call Signaling
    const sendCallSignal = async (targetId: string) => {
        const channel = supabase.channel('global-calls');
        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'incoming',
                    payload: { targetId, callerId: user?.id }
                });
                // Keep channel open briefly or rely on auto-cleanup? 
                // Better to simple remove after short delay or let it persist if reused.
                // For now, simple send & forget.
                setTimeout(() => supabase.removeChannel(channel), 1000);
            }
        });
    };

    useEffect(() => {
        if (!user) return;
        const channel = supabase.channel('global-calls');
        channel
            .on('broadcast', { event: 'incoming' }, ({ payload }) => {
                if (payload.targetId === user.id) {
                    console.log("📞 Incoming call auto-answer:", payload.callerId);
                    const caller = friendsRef.current.find((f: any) => f.clerk_user_id === payload.callerId);
                    if (caller) {
                        setActiveFriend(caller);
                        setView('CALL');
                        setIsChatOpen(false);
                    }
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user]);


    // Presence State
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    const [isHandsFree, setIsHandsFree] = useState(false);

    // Presence Subscription
    useEffect(() => {
        if (!user) return;
        const channel = supabase.channel('global-presence');
        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const ids = new Set<string>();
                Object.values(newState).forEach((users: any) => {
                    users.forEach((u: any) => {
                        if (u.userId) ids.add(u.userId);
                    });
                });
                setOnlineUsers(ids);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ userId: user.id });
                }
            });
        return () => { supabase.removeChannel(channel); };
    }, [user]);

    // Initial Setup
    useEffect(() => {
        const init = async () => {
            const granted = await requestNotificationPermission();
            await setupBackgroundAudio();
        };
        init();
        return () => { cleanupBackgroundAudio(); };
    }, []);

    // Fetch User PIN & Friends & Auto-Sync Name
    useEffect(() => {
        if (!user) return;

        const syncProfile = async () => {
            // Auto-sync publicly visible name & image to Supabase
            // Use fullName > firstName > username > 'Anonymous'
            const displayName = user.fullName || user.firstName || user.username || 'Anonymous';

            if (displayName) {
                try {
                    await fetch('/api/user-pin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: displayName,
                            image_url: user.imageUrl
                        })
                    });
                } catch (e) { console.error("Auto-sync failed", e); }
            }
        };

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
            try {
                const [fRes, rRes] = await Promise.all([
                    fetch('/api/friends'),
                    fetch('/api/friend-request')
                ]);

                if (fRes.ok) {
                    const fData = await fRes.json();
                    setFriends(fData.friends || []);
                }

                if (rRes.ok) {
                    const rData = await rRes.json();
                    setFriendRequests(rData);
                }
            } catch (e) { console.error("❌ Error polling:", e); }
        };

        syncProfile();
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
        <div className="flex flex-col h-full bg-black relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="flex-1 flex flex-col p-6 pt-12 z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="bg-zinc-900/80 backdrop-blur rounded-2xl px-4 py-2 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase block mb-0.5">MY PIN</span>
                        <span className="text-white font-black text-lg tracking-wider font-mono select-all">{userPin || '...'}</span>
                    </div>
                    <button onClick={() => setView('SETTINGS')} className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                {/* Friend Requests (Horizontal Scroll if many, or compact stack) */}
                {friendRequests.received.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-3 ml-2">INBOX</h3>
                        <div className="flex flex-col gap-2">
                            {friendRequests.received.map((req: any) => (
                                <div key={req.id} className="bg-zinc-900/80 backdrop-blur-md rounded-3xl p-4 flex justify-between items-center border border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center font-bold">?</div>
                                        <span className="text-white font-bold">{req.sender?.username || 'Unknown'}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleFriendAction(req.id, 'accept')} className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all">✓</button>
                                        <button onClick={() => handleFriendAction(req.id, 'reject')} className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Grid */}
                <div className="flex-1 overflow-y-auto overscroll-y-contain">
                    <div className="grid grid-cols-2 gap-4 pb-32">
                        {/* Add Friend Card */}
                        <button
                            onClick={() => setView('ADD_FRIEND')}
                            className="aspect-square bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:text-black transition-colors">
                                <Plus className="w-8 h-8" />
                            </div>
                            <span className="text-zinc-500 font-bold text-sm tracking-wide group-hover:text-white">ADD</span>
                        </button>

                        {/* Friend Cards */}
                        {friends.map((friend: any) => {
                            const isActive = activeFriend?.clerk_user_id === friend.clerk_user_id;
                            const isOnline = onlineUsers.has(friend.clerk_user_id);
                            const showSpeaking = isActive && isRemoteSpeaking;

                            return (
                                <button
                                    key={friend.clerk_user_id}
                                    onClick={() => {
                                        setActiveFriend(friend);
                                        setView('CALL');
                                        setIsChatOpen(false);
                                        sendCallSignal(friend.clerk_user_id);
                                    }}
                                    className={`relative aspect-square rounded-[2rem] p-4 flex flex-col items-center justify-between transition-all overflow-hidden
                                        ${showSpeaking ? 'bg-indigo-600 ring-4 ring-indigo-400 ring-offset-4 ring-offset-black scale-105 z-10' : 'bg-zinc-900 hover:bg-zinc-800'}
                                    `}
                                >
                                    {/* Status Dot */}
                                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-zinc-700'}`}></div>

                                    {/* Avatar */}
                                    <div className="w-20 h-20 rounded-[1.2rem] bg-zinc-800 shadow-lg mt-2 overflow-hidden ring-2 ring-white/10">
                                        {friend.image_url ? (
                                            <img src={friend.image_url} alt={friend.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl">
                                                {(friend.username || friend.pin || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="w-full text-center">
                                        <p className="text-white font-bold text-sm truncate px-2">
                                            {friend.username || `User ${friend.pin}` || 'Unnamed'}
                                        </p>
                                        {showSpeaking && (
                                            <p className="text-white/80 text-[10px] font-bold animate-pulse mt-1 tracking-widest uppercase">TALKING</p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );



    return (
        <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
            {/* Desktop Container Wrapper */}
            <div className="w-full max-w-md h-full bg-black text-white relative shadow-2xl overflow-hidden border-x border-zinc-800">
                <AnimatePresence mode="wait">
                    {view === 'DASHBOARD' && <Dashboard />}
                    {view === 'CALL' && (
                        <div className="flex-1 flex flex-col h-full bg-black relative overflow-hidden">
                            {/* 1. Full Screen Background Image (Blurred/Darkened) */}
                            {activeFriend?.image_url ? (
                                <div className="absolute inset-0 z-0">
                                    <img src={activeFriend.image_url} className="w-full h-full object-cover opacity-60 blur-2xl scale-110" alt="bg" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90"></div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 z-0 bg-gradient-to-b from-zinc-900 to-black"></div>
                            )}

                            {/* 2. Top Controls */}
                            <div className="relative z-50 p-6 pt-12 flex justify-between items-start">
                                <button onClick={() => { setActiveFriend(null); setView('DASHBOARD'); setIsChatOpen(false); }} className="p-3 bg-zinc-900/50 backdrop-blur-md rounded-full text-white hover:bg-zinc-800 transition-all border border-white/10">
                                    <ChevronRight className="w-6 h-6 rotate-180" />
                                </button>
                                <div className="flex flex-col items-center">
                                    <div className={`px-4 py-1 rounded-full backdrop-blur-md border ${connectionStatus === 'connected' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'} font-bold text-[10px] tracking-widest uppercase mb-2`}>
                                        {connectionStatus === 'connected' ? 'LIVE' : 'CONNECTING...'}
                                    </div>
                                </div>
                                <button onClick={toggleHandsFree} className={`p-3 rounded-full backdrop-blur-md transition-all border border-white/10 ${isHandsFree ? 'bg-red-500 text-white border-red-500' : 'bg-zinc-900/50 text-white hover:bg-zinc-800'}`}>
                                    {isHandsFree ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                </button>
                            </div>

                            {/* 3. Center Content (Friend Info) */}
                            <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-10">
                                <div className="relative w-[35vw] h-[35vw] max-w-[200px] max-h-[200px] mb-6">
                                    {isRemoteSpeaking && (
                                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-50"></div>
                                    )}
                                    <div className={`w-full h-full rounded-full overflow-hidden border-4 shadow-2xl ${isRemoteSpeaking ? 'border-indigo-500 shadow-indigo-500/50' : 'border-white/10'}`}>
                                        {activeFriend?.image_url ? (
                                            <img src={activeFriend.image_url} className="w-full h-full object-cover" alt="friend" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-6xl shadow-inner">
                                                {(activeFriend?.username || activeFriend?.pin || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h1 className="text-white font-black text-4xl mb-2 text-center drop-shadow-xl tracking-tight max-w-[80vw] truncate">{activeFriend?.username || 'Unknown'}</h1>
                                <p className={`font-bold tracking-[0.2em] text-xs uppercase ${onlineUsers.has(activeFriend?.clerk_user_id) ? 'text-green-400' : 'text-zinc-500'}`}>
                                    {isRemoteSpeaking
                                        ? 'IS SPEAKING...'
                                        : (onlineUsers.has(activeFriend?.clerk_user_id) ? 'ONLINE' : 'OFFLINE')}
                                </p>
                                {connectionStatus !== 'connected' && (
                                    <p className="text-zinc-600 text-[8px] font-bold mt-4 uppercase animate-pulse">
                                        Wait for them to join...
                                    </p>
                                )}
                            </div>

                            {/* 4. Bottom PTT Button (Ten Ten Style) */}
                            <div className="relative z-10 pb-4 flex flex-col items-center justify-end w-full">

                                <div className="relative w-[50vw] max-w-[200px] aspect-square touch-none">
                                    {isSpeaking && (
                                        <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-30 delay-75"></div>
                                    )}
                                    {isSpeaking && (
                                        <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-50"></div>
                                    )}

                                    {/* Button */}
                                    <button
                                        onMouseDown={handleStartTalk}
                                        onMouseUp={handleStopTalk}
                                        onMouseLeave={handleStopTalk}
                                        onTouchStart={handleStartTalk}
                                        onTouchEnd={handleStopTalk}
                                        onTouchCancel={handleStopTalk}
                                        onContextMenu={(e) => e.preventDefault()}
                                        style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
                                        className={`relative w-full h-full rounded-full transition-all duration-100 flex items-center justify-center shadow-2xl overflow-hidden select-none
                                            ${isSpeaking
                                                ? 'bg-indigo-600 scale-95 border-8 border-indigo-400/50 ring-4 ring-indigo-500/30'
                                                : 'bg-zinc-800 hover:bg-zinc-700 border-8 border-zinc-700 ring-4 ring-black/40'}
                                        `}
                                    >
                                        {isSpeaking ? (
                                            <div className="w-24 h-24 bg-white/20 rounded-full animate-pulse blur-xl"></div>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-b from-white/5 to-transparent"></div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Chat Button (Bottom Left Floating) */}
                            <button
                                onClick={() => setIsChatOpen(true)}
                                className="absolute bottom-8 left-8 z-30 w-14 h-14 bg-zinc-800/80 backdrop-blur rounded-full flex items-center justify-center text-white border border-white/10 shadow-xl hover:bg-zinc-700 transition-all"
                            >
                                <MessageSquare className="w-6 h-6" />
                            </button>

                            {/* Chat Overlay */}
                            <AnimatePresence>
                                {isChatOpen && (
                                    <motion.div
                                        initial={{ y: "100%" }}
                                        animate={{ y: 0 }}
                                        exit={{ y: "100%" }}
                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                        className="fixed inset-0 z-[100] bg-black flex flex-col overscroll-none"
                                    >
                                        {/* Header */}
                                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900 shadow-md">
                                            <h3 className="font-bold text-white flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 text-indigo-400" />
                                                {activeFriend?.username}
                                            </h3>
                                            <button onClick={() => setIsChatOpen(false)} className="p-2 bg-zinc-800 rounded-full text-white">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Messages */}
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain pb-safe">
                                            {chatMessages.map((msg) => {
                                                const isMe = msg.sender_id === user?.id;
                                                const isImage = msg.type === 'image';

                                                return (
                                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <div className={`max-w-[75%] rounded-2xl p-2 text-sm font-medium ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-zinc-800 text-zinc-200 rounded-bl-none'}`}>
                                                            {isImage ? (
                                                                <div className="relative">
                                                                    {msg.is_view_once ? (
                                                                        <div
                                                                            onClick={() => {
                                                                                if (isMe || !msg.is_viewed) openImage(msg);
                                                                            }}
                                                                            className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer ${msg.is_viewed && !isMe ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/20'}`}
                                                                        >
                                                                            <Timer className="w-5 h-5 text-pink-400" />
                                                                            <span>{msg.is_viewed && !isMe ? 'Opened' : 'View Photo'}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <img
                                                                            src={msg.media_url}
                                                                            alt="Shared"
                                                                            className="rounded-lg max-w-full h-auto cursor-pointer"
                                                                            onClick={() => openImage(msg)}
                                                                        />
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="px-2 py-1">{msg.content}</div>
                                                            )}
                                                        </div>
                                                        {isMe && (
                                                            <div className="flex items-center gap-1 mt-1 mr-1">
                                                                <span className="text-[10px] text-zinc-500">
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <CheckCheck className={`w-3 h-3 ${msg.is_read ? 'text-blue-400' : 'text-zinc-500'}`} />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <div ref={chatEndRef} />
                                        </div>

                                        {/* Input */}
                                        <div className="p-4 border-t border-white/10 bg-black/50">
                                            {imageFile && (
                                                <div className="flex items-center gap-2 mb-2 p-2 bg-zinc-800 rounded-lg">
                                                    <span className="text-xs text-zinc-300 truncate max-w-[150px]">{imageFile.name}</span>
                                                    <button onClick={() => setIsViewOnce(!isViewOnce)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${isViewOnce ? 'bg-pink-500/20 text-pink-400 border border-pink-500' : 'bg-zinc-700 text-zinc-400'}`}>
                                                        <Timer className="w-3 h-3" />
                                                        {isViewOnce ? 'View Once' : 'Keep'}
                                                    </button>
                                                    <button onClick={() => setImageFile(null)} className="ml-auto text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
                                                </div>
                                            )}
                                            <form
                                                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                                className="flex gap-2 items-center"
                                            >
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    ref={fileInputRef}
                                                    onChange={handleFileSelect}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="p-3 bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
                                                >
                                                    <ImageIcon className="w-5 h-5" />
                                                </button>

                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Type a message..."
                                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={(!newMessage.trim() && !imageFile)}
                                                    className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:bg-zinc-800"
                                                >
                                                    <Send className="w-5 h-5" />
                                                </button>
                                            </form>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Image Viewer */}
                            <AnimatePresence>
                                {viewingImage && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4"
                                        onContextMenu={(e) => e.preventDefault()} // Prevent context menu
                                        onClick={() => setViewingImage(null)}
                                    >
                                        <img
                                            src={viewingImage.media_url}
                                            alt="Full View"
                                            className="max-w-full max-h-full rounded shadow-2xl pointer-events-none select-none" // Hard to save
                                        />
                                        {viewingImage.is_view_once && (
                                            <div className="absolute top-10 left-0 right-0 text-center pointer-events-none">
                                                <span className="bg-red-500/80 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                                                    Screenshot Detection Enabled
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
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
                    {view === 'EDIT_PROFILE' && (
                        <EditProfileView
                            user={user}
                            setView={setView}
                        />
                    )}
                </AnimatePresence>
                <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
            </div>
        </div>
    );

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
                    <SettingsItem icon={<LogOut />} label="sign out" onClick={() => useClerk().signOut({ redirectUrl: '/' })} />
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
}
