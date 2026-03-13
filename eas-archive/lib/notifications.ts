import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import * as Device from 'expo-device';
import FileSystem from 'expo-file-system';
import { db } from './firebase';

export const registerNotificationsAsync = async (): Promise<boolean> => {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      } as Notifications.NotificationBehavior),
    });
    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
      });
      await Notifications.setNotificationChannelAsync('calls', {
        name: 'Calls',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 400, 400, 400],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
      });
    }
    return granted;
  } catch (error) {
    console.error('Notification permission error:', error);
    return false;
  }
};

export const notifyMessage = async (fromName: string, text: string) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: fromName,
        body: text || 'New message',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  } catch (e) {
    console.error('Failed to schedule message notification:', e);
  }
};

export const notifyMessageWithImage = async (fromName: string, text: string, imageUrl?: string) => {
  try {
    let attachments: any[] | undefined = undefined;
    if (Platform.OS === 'ios' && imageUrl) {
      try {
        const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
        const local = `${cacheDir}msg-${Date.now()}.jpg`;
        await FileSystem.downloadAsync(imageUrl, local);
        attachments = [{ url: local } as any];
      } catch { }
    }
    const content: Notifications.NotificationContentInput = {
      title: fromName,
      body: text || 'New message',
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
    };
    if (attachments && attachments.length > 0) {
      (content as any).attachments = attachments;
    }
    if (imageUrl) {
      (content as any).data = { imageUrl };
    }
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: null,
    });
  } catch (e) {
    console.error('Failed to schedule rich message notification:', e);
  }
};

export const notifyIncomingCall = async (fromName: string, type: 'voice' | 'video') => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Incoming ${type} call`,
        body: `From ${fromName}`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  } catch (e) {
    console.error('Failed to schedule incoming call notification:', e);
  }
};

export const notifyCallEnded = async (name: string) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Call ended',
        body: `With ${name}`,
        sound: 'default',
      },
      trigger: null,
    });
  } catch (e) {
    console.error('Failed to schedule call end notification:', e);
  }
};

export const registerAndStorePushTokenAsync = async (userId: string) => {
  try {
    if (!Device.isDevice) return null;
    const granted = await registerNotificationsAsync();
    if (!granted) return null;
    const expoToken = await Notifications.getExpoPushTokenAsync();
    const token = expoToken.data;
    if (!token) return null;
    await setDoc(doc(db, 'users', userId), { expoPushToken: token }, { merge: true });
    return token;
  } catch (e) {
    console.error('Push token registration failed:', e);
    return null;
  }
};

export const sendPushToToken = async (token: string, title: string, body: string, data?: any) => {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: token, sound: 'default', title, body, data }),
    });
  } catch (error) {
    console.error('Failed to send push to token:', error);
  }
};

export const notifyProductWithImage = async (title: string, body: string, imageUrl?: string) => {
  try {
    let attachments: any[] | undefined = undefined;
    if (Platform.OS === 'ios' && imageUrl) {
      try {
        const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
        const local = `${cacheDir}product-${Date.now()}.jpg`;
        await FileSystem.downloadAsync(imageUrl, local);
        attachments = [{ url: local } as any];
      } catch { }
    }
    const content: Notifications.NotificationContentInput = {
      title,
      body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
    };
    if (attachments && attachments.length > 0) {
      (content as any).attachments = attachments;
    }
    if (imageUrl) {
      (content as any).data = { imageUrl };
    }
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: null,
    });
  } catch (e) {
    console.error('Failed to schedule product notification:', e);
  }
};
