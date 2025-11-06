// src/services/notificationService.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../api/apiClient";

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
        console.log("⚠️ Must use physical device for Push Notifications");
        return null;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("❌ Failed to get push token for push notification!");
        return null;
      }

      const token = await this.getExpoPushToken();
      console.log("✅ Notification permission granted. Token:", token);
      return token;
    } catch (error) {
      console.error("❌ Error requesting permission:", error);
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
        console.warn("⚠️ Project ID not found. Using legacy method.");
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId || undefined,
        })
      ).data;

      console.log("📱 Expo Push Token:", token);
      await AsyncStorage.setItem("expo_push_token", token);

      // Send to backend
      await this.sendTokenToBackend(token);

      return token;
    } catch (error) {
      console.error("❌ Error getting push token:", error);
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
      console.log("✅ Token sent to backend");
    } catch (error) {
      console.error("❌ Error sending token to backend:", error);
    }
  },

  /**
   * Setup notification listeners
   */
  setupListeners() {
    // Handle notifications received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📩 Notification received (foreground):", notification);
      }
    );

    // Handle user interactions with notifications
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification tapped:", response);
        this.handleNotificationResponse(response);
      });

    // Return cleanup function
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
    if (data?.type === "order_status" && data?.order_id) {
      console.log("Navigate to order:", data.order_id);
      // router.push(`/order/${data.order_id}`);
    } else if (data?.type === "payment" && data?.order_id) {
      console.log("Navigate to payment:", data.order_id);
    } else if (data?.type === "voucher") {
      console.log("Navigate to vouchers");
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
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1,
        },
        trigger:
          seconds > 0
            ? {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds,
              }
            : null,
      });
    } catch (error) {
      console.error("❌ Error scheduling notification:", error);
    }
  },

  /**
   * Send test notification
   */
  async sendTestNotification() {
    try {
      // Test different notification types
      const notifications = [
        {
          title: "Tes Notif",
          body: "HIDUP JOKOWI!!!",
          data: { type: "test" },
        },
        {
          title: "📦 Order Update",
          body: "Your order #12345 has been shipped!",
          data: { type: "order_status", order_id: "12345" },
        },
        {
          title: "💳 Payment Confirmed",
          body: "Your payment of Rp 150,000 has been confirmed",
          data: { type: "payment" },
        },
        {
          title: "🎁 New Voucher",
          body: "Get 20% OFF with code DISKON20!",
          data: { type: "voucher" },
        },
      ];

      // Send random notification
      const randomNotif =
        notifications[Math.floor(Math.random() * notifications.length)];

      await this.scheduleLocalNotification(
        randomNotif.title,
        randomNotif.body,
        randomNotif.data,
        1 // 1 second delay
      );

      console.log("✅ Test notification scheduled");
    } catch (error) {
      console.error("❌ Error sending test notification:", error);
    }
  },

  /**
   * Send order status notification
   */
  async sendOrderNotification(orderNumber: string, status: string) {
    const notifications: { [key: string]: { title: string; body: string } } = {
      pending: {
        title: "⏳ Order Pending",
        body: `Order #${orderNumber} is waiting for payment`,
      },
      paid: {
        title: "✅ Payment Confirmed",
        body: `Your payment for order #${orderNumber} has been confirmed!`,
      },
      processing: {
        title: "📦 Order Processing",
        body: `Your order #${orderNumber} is being processed`,
      },
      shipped: {
        title: "🚚 Order Shipped",
        body: `Your order #${orderNumber} has been shipped!`,
      },
      delivered: {
        title: "🎉 Order Delivered",
        body: `Your order #${orderNumber} has been delivered!`,
      },
      cancelled: {
        title: "❌ Order Cancelled",
        body: `Your order #${orderNumber} has been cancelled`,
      },
    };

    const notification = notifications[status];
    if (notification) {
      await this.scheduleLocalNotification(
        notification.title,
        notification.body,
        { type: "order_status", order_id: orderNumber, status },
        0
      );
    }
  },

  /**
   * Send payment notification
   */
  async sendPaymentNotification(amount: number, status: string) {
    // ← FIX: Format price properly
    const formatPrice = (price: number) => {
      return `Rp ${price.toLocaleString("id-ID")}`;
    };

    const notifications: { [key: string]: { title: string; body: string } } = {
      success: {
        title: "✅ Payment Success",
        body: `Payment of ${formatPrice(amount)} has been confirmed`,
      },
      pending: {
        title: "⏳ Payment Pending",
        body: `Waiting for payment confirmation of ${formatPrice(amount)}`,
      },
      failed: {
        title: "❌ Payment Failed",
        body: "Payment failed. Please try again",
      },
    };

    const notification = notifications[status];
    if (notification) {
      console.log(
        "📤 Sending payment notification:",
        notification.title,
        notification.body
      );

      await this.scheduleLocalNotification(
        notification.title,
        notification.body,
        { type: "payment", amount, status },
        0
      );
    }
  },

  /**
   * Send voucher notification
   */
  async sendVoucherNotification(voucherCode: string, discount: string) {
    await this.scheduleLocalNotification(
      "🎁 New Voucher Available",
      `Use code ${voucherCode} to get ${discount} discount!`,
      { type: "voucher", code: voucherCode },
      0
    );
  },

  /**
   * Send stock alert notification
   */
  async sendStockAlertNotification(productName: string) {
    await this.scheduleLocalNotification(
      "✅ Product Back in Stock",
      `${productName} is now available!`,
      { type: "stock", product_name: productName },
      0
    );
  },

  /**
   * Send cart reminder notification
   */
  async sendCartReminderNotification(itemCount: number) {
    await this.scheduleLocalNotification(
      "🛒 Items in Cart",
      `You have ${itemCount} items waiting in your cart. Complete your purchase now!`,
      { type: "cart_reminder", item_count: itemCount },
      0
    );
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
   * Clear badge
   */
  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  },

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Configure notification channels (Android only)
   */
  async setupAndroidChannels() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("orders", {
        name: "Order Updates",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("payments", {
        name: "Payment Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("promotions", {
        name: "Promotions",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("test", {
        name: "Test Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("stock", {
        name: "Stock Alerts",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("cart", {
        name: "Cart Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
      });
    }
  },
};
