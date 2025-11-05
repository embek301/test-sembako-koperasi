// src/services/notificationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authAPI } from '../api/apiClient';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  /**
   * Request notification permissions
   */
  async requestPermission() {
    try {
      if (!Device.isDevice) {
        console.log('⚠️ Must use physical device for Push Notifications');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push token for push notification!');
        return null;
      }

      const token = await this.getExpoPushToken();
      console.log('✅ Notification permission granted. Token:', token);
      return token;
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      return null;
    }
  },

  /**
   * Get Expo Push Token
   */
  async getExpoPushToken() {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.warn('⚠️ Project ID not found. Using legacy method.');
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId || undefined,
        })
      ).data;

      console.log('📱 Expo Push Token:', token);
      await AsyncStorage.setItem('expo_push_token', token);
      
      // Send to backend
      await this.sendTokenToBackend(token);
      
      return token;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  },

  /**
   * Send token to backend
   */
  async sendTokenToBackend(token: string) {
    try {
      await authAPI.updateProfile({ 
        expo_push_token: token,
        device_type: Platform.OS,
      });
      console.log('✅ Token sent to backend');
    } catch (error) {
      console.error('❌ Error sending token to backend:', error);
    }
  },

  /**
   * Setup notification listeners
   */
  setupListeners() {
    // Handle notifications received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📩 Notification received (foreground):', notification);
      }
    );

    // Handle user interactions with notifications
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
        this.handleNotificationResponse(response);
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  },

  /**
   * Handle notification tap
   */
  handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data?.type === 'order_status' && data?.order_id) {
      // Navigate to order detail
      console.log('Navigate to order:', data.order_id);
      // router.push(`/order/${data.order_id}`);
    } else if (data?.type === 'payment' && data?.order_id) {
      // Navigate to payment
      console.log('Navigate to payment:', data.order_id);
    } else if (data?.type === 'voucher') {
      // Navigate to vouchers
      console.log('Navigate to vouchers');
      // router.push('/vouchers');
    }
  },

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    seconds: number = 0
  ) {
    try {
      const trigger: Notifications.NotificationTriggerInput | null =
        seconds > 0
          ? ({ seconds, repeats: false, type: 'timeInterval' } as Notifications.NotificationTriggerInput)
          : null;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1,
        },
        trigger,
      });
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
    }
  },

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  },

  /**
   * Get badge count
   */
  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  },

  /**
   * Set badge count
   */
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  },

  /**
   * Configure notification channels (Android only)
   */
  async setupAndroidChannels() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('payments', {
        name: 'Payment Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promotions',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });
    }
  },
};