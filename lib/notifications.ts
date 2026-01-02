// Notification utility functions

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const showNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/icon-192x192.png', // You can add your app icon
            badge: '/badge-72x72.png',
            ...options,
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        return notification;
    }
};

export const notifyFriendRequest = (friendName: string) => {
    showNotification('New Friend Request', {
        body: `${friendName} wants to connect with you!`,
        tag: 'friend-request',
    });
};

export const notifyUserJoined = (userName: string) => {
    showNotification('User Joined', {
        body: `${userName} joined the channel`,
        tag: 'user-joined',
    });
};

export const notifyUserLeft = (userName: string) => {
    showNotification('User Left', {
        body: `${userName} left the channel`,
        tag: 'user-left',
    });
};

export const notifyIncomingCall = (userName: string, roomID: string) => {
    showNotification('Incoming Call', {
        body: `${userName} is calling you in room ${roomID}`,
        tag: 'incoming-call',
        requireInteraction: true, // Keeps notification until user interacts
    });
};
