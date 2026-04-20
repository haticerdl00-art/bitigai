
/**
 * Utility for browser-level notifications and permission management.
 */

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Bu tarayıcı bildirimleri desteklemiyor.');
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

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png', // Fallback to a placeholder or icon if exists
      ...options
    });
  }
};

/**
 * Check if a notification has already been sent today for a specific key
 */
export const shouldNotify = (key: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  const storageKey = `notification_sent_${key}_${today}`;
  
  if (localStorage.getItem(storageKey)) {
    return false;
  }
  
  localStorage.setItem(storageKey, 'true');
  return true;
};
