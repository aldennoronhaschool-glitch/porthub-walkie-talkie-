// Generate unique user IDs/PINs

/**
 * Generates a unique 8-character alphanumeric ID
 * Format: XXXX-XXXX (e.g., A3F7-K9M2)
 */
export const generateUniquePin = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like O, 0, I, 1
    let pin = '';

    for (let i = 0; i < 8; i++) {
        if (i === 4) {
            pin += '-'; // Add separator in the middle
        }
        pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return pin;
};

/**
 * Generates a numeric-only PIN (6 digits)
 * Format: 123456
 */
export const generateNumericPin = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Validates a PIN format
 */
export const isValidPin = (pin: string): boolean => {
    // Check if it's 8 chars with hyphen (XXXX-XXXX)
    const alphanumericPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    // Or 6 digits
    const numericPattern = /^\d{6}$/;

    return alphanumericPattern.test(pin) || numericPattern.test(pin);
};

/**
 * Format a PIN for display (adds hyphen if needed)
 */
export const formatPin = (pin: string): string => {
    if (pin.length === 8 && !pin.includes('-')) {
        return `${pin.slice(0, 4)}-${pin.slice(4)}`;
    }
    return pin;
};
