import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Configuration for STUN servers (free ones from Google)
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // OpenRelay Project (Free TURN) - Fixes Firewall blocks
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
        }
    ],
    iceCandidatePoolSize: 0,
};

export const useWebRTC = (userId: string | undefined, activeFriendId: string | undefined) => {
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false); // Am I speaking?
    const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false); // Is friend speaking?
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const signalingChannel = useRef<RealtimeChannel | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null); // Helper to auto-play

    // Initialize Local Audio Stream (Mic)
    useEffect(() => {
        const initMic = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Start Muted (mic track disabled)
                stream.getAudioTracks().forEach(track => track.enabled = false);
                setLocalStream(stream);
            } catch (err) {
                console.error("Failed to access microphone:", err);
            }
        };
        initMic();

        return () => {
            localStream?.getTracks().forEach(t => t.stop());
        };
    }, []);

    // Effect: Handle Connection when Active Friend Changes
    // Effect: Handle Connection when Active Friend Changes
    useEffect(() => {
        if (!userId || !activeFriendId) {
            cleanupConnection();
            return;
        }

        // Wait for Mic
        if (!localStream) {
            console.log("Waiting for microphone...");
            return;
        }

        const roomId = [userId, activeFriendId].sort().join('-');
        console.log(`📡 Connecting to signaling room: ${roomId}`);

        setConnectionStatus('connecting');
        setupSignaling(roomId);

        return () => {
            cleanupConnection();
        };
    }, [userId, activeFriendId, localStream]);

    // Cleanup function
    const cleanupConnection = () => {
        if (signalingChannel.current) {
            supabase.removeChannel(signalingChannel.current);
            signalingChannel.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setConnectionStatus('disconnected');
        setRemoteStream(null);
        setIsRemoteSpeaking(false);
    };

    // --- Signaling & WebRTC Setup ---
    const setupSignaling = async (roomId: string) => {
        const channel = supabase.channel(`signaling:${roomId}`);
        signalingChannel.current = channel;

        channel
            .on('broadcast', { event: 'signal' }, async ({ payload }) => {
                if (payload.userId === userId) return; // Ignore own messages

                await handleSignalMessage(payload);
            })
            .on('broadcast', { event: 'speaking-status' }, ({ payload }) => {
                if (payload.userId !== userId) {
                    setIsRemoteSpeaking(payload.isSpeaking);
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("✅ Joined signaling channel");
                    // Assuming the "caller" is the one who sorts first alphabetically? 
                    // Or just politely try to create an offer if we are the initiator.
                    // To keep it simple: Both join. We need a way to trigger the Offer.
                    // Strategy: sending a "ready" signal. The one with lower ID offers.
                    channel.send({
                        type: 'broadcast',
                        event: 'signal',
                        payload: { type: 'ready', userId }
                    });
                }
            });
    };

    const createPeerConnection = () => {
        if (peerConnection.current) return peerConnection.current;

        console.log("🛠️ Creating RTCPeerConnection");
        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnection.current = pc;

        // Add local tracks (muted)
        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        // Handle remote tracks
        pc.ontrack = (event) => {
            console.log("🎧 Received remote track");
            const stream = event.streams[0];
            setRemoteStream(stream);
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.play().catch(e => console.error("Auto-play failed", e));
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && signalingChannel.current) {
                signalingChannel.current.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'candidate', candidate: event.candidate, userId }
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log("🔄 Connection state:", pc.connectionState);
            if (pc.connectionState === 'connected') setConnectionStatus('connected');
            if (pc.connectionState === 'disconnected') setConnectionStatus('connecting');
            if (pc.connectionState === 'failed') setConnectionStatus('disconnected'); // Retry?
        };

        return pc;
    };

    const handleSignalMessage = async (payload: any) => {
        const { type, sdp, candidate } = payload;
        const pc = peerConnection.current || createPeerConnection(); // Ensure PC exists

        try {
            if (type === 'ready') {
                // Determine who makes the offer (e.g., alphabetical sort of IDs to avoid collision)
                const isInitiator = userId! < activeFriendId!;
                if (isInitiator) {
                    console.log("👋 I am the initiator. Creating Offer...");
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    signalingChannel.current?.send({
                        type: 'broadcast',
                        event: 'signal',
                        payload: { type: 'offer', sdp: offer, userId }
                    });
                }
            } else if (type === 'offer') {
                console.log("📩 Received Offer");
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                signalingChannel.current?.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'answer', sdp: answer, userId }
                });
            } else if (type === 'answer') {
                console.log("📩 Received Answer");
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            } else if (type === 'candidate') {
                console.log("🧊 Received ICE Candidate");
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error("Signal handling error:", error);
        }
    };

    // --- Interaction ---

    const startSpeaking = useCallback(() => {
        if (!localStream) return;
        setIsSpeaking(true);
        // Unmute audio track
        localStream.getAudioTracks().forEach(t => t.enabled = true);

        // Notify peer for visual feedback
        signalingChannel.current?.send({
            type: 'broadcast',
            event: 'speaking-status',
            payload: { isSpeaking: true, userId }
        });
    }, [userId, localStream]);

    const stopSpeaking = useCallback(() => {
        if (!localStream) return;
        setIsSpeaking(false);
        // Mute audio track
        localStream.getAudioTracks().forEach(t => t.enabled = false);

        // Notify peer
        signalingChannel.current?.send({
            type: 'broadcast',
            event: 'speaking-status',
            payload: { isSpeaking: false, userId }
        });
    }, [userId, localStream]);

    return {
        connectionStatus,
        isSpeaking,
        isRemoteSpeaking,
        startSpeaking,
        stopSpeaking,
        remoteAudioRef
    };
};
