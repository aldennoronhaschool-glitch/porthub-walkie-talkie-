import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    }, []);

    const stopRecording = useCallback((): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                resolve(null);
                return;
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                chunksRef.current = [];
                setIsRecording(false);

                // Stop all tracks to release microphone
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                resolve(blob);
            };

            mediaRecorderRef.current.stop();
        });
    }, []);

    // Helper to convert Blob to Base64 for Supabase storage
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64String = reader.result as string;
                resolve(base64String);
            };
            reader.onerror = reject;
        });
    };

    return {
        isRecording,
        startRecording,
        stopRecording,
        blobToBase64
    };
};

export const useAudioPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const queueRef = useRef<string[]>([]);
    const [currentlyPlayingSender, setCurrentlyPlayingSender] = useState<string | null>(null);

    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.onended = () => {
            setIsPlaying(false);
            setCurrentlyPlayingSender(null);
            playNext();
        };
    }, []);

    const playNext = () => {
        if (queueRef.current.length > 0) {
            const nextUrl = queueRef.current.shift();
            if (nextUrl && audioRef.current) {
                audioRef.current.src = nextUrl;
                audioRef.current.play()
                    .then(() => setIsPlaying(true))
                    .catch(e => console.error("Playback failed", e));
            }
        }
    };

    const playAudio = (url: string, senderId?: string) => {
        queueRef.current.push(url);
        if (senderId) setCurrentlyPlayingSender(senderId);

        if (!isPlaying && audioRef.current?.paused) {
            playNext();
        }
    };

    return { isPlaying, playAudio, currentlyPlayingSender };
};
