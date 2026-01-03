// Wake Lock and Audio Context utilities for keeping app active

let wakeLock: WakeLockSentinel | null = null;
let audioContext: AudioContext | null = null;

/**
 * Request a wake lock to keep the screen on and prevent the device from sleeping
 */
export const requestWakeLock = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
        return false;
    }

    // Wake Lock can only be acquired when page is visible
    if (document.visibilityState !== 'visible') {
        return false;
    }

    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock acquired');

        // Re-acquire wake lock when visibility changes
        wakeLock.addEventListener('release', () => {
            console.log('Wake Lock released');
        });

        return true;
    } catch (err: any) {
        // Ignore common errors
        if (err.name === 'NotAllowedError') {
            return false;
        }
        console.error('Failed to acquire wake lock:', err);
        return false;
    }
};

/**
 * Release the wake lock
 */
export const releaseWakeLock = async () => {
    if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
        console.log('Wake Lock manually released');
    }
};

/**
 * Initialize Audio Context to ensure audio plays even when device is locked
 */
export const initializeAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Resume audio context if suspended (required for iOS)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    return audioContext;
};

/**
 * Keep audio context active by creating a silent oscillator
 * This prevents the browser from suspending audio when in background
 */
export const keepAudioContextAlive = () => {
    const context = initializeAudioContext();

    // Create a silent oscillator to keep audio context alive
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    gainNode.gain.value = 0; // Silent
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();

    return () => {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
    };
};

/**
 * Handle visibility change to maintain wake lock
 */
export const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && !wakeLock) {
        await requestWakeLock();
    }
};

/**
 * Setup background audio support
 * Call this when entering a call/room
 */
export const setupBackgroundAudio = async () => {
    // Request wake lock
    await requestWakeLock();

    // Initialize audio context
    initializeAudioContext();

    // Keep audio context alive
    const cleanup = keepAudioContextAlive();

    // Handle visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        cleanup();
        releaseWakeLock();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
};

/**
 * Cleanup background audio support
 * Call this when leaving a call/room
 */
export const cleanupBackgroundAudio = async () => {
    await releaseWakeLock();
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    if (audioContext) {
        await audioContext.close();
        audioContext = null;
    }
};
