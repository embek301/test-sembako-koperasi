// src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { NotificationService } from '../services/notificationService';

interface StoredNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: StoredNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<StoredNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  sendOrderNotification: (orderNumber: string, status: string, userRole?: string) => Promise<void>;
  sendPaymentNotification: (amount: number, status: string) => Promise<void>;
  sendVoucherNotification: (code: string, discount: string) => Promise<void>;
  sendCartReminderNotification: (itemCount: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = '@notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    setupNotifications();
    loadNotifications();

    // Setup notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 Notification received:', notification);
      handleIncomingNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      handleNotificationTap(response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Save notifications whenever they change
  useEffect(() => {
    saveNotifications();
  }, [notifications]);

  const setupNotifications = async () => {
    await NotificationService.requestPermission();
    await NotificationService.setupAndroidChannels();
  };

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const handleIncomingNotification = (notification: any) => {
    const newNotif: StoredNotification = {
      id: notification.request.identifier,
      title: notification.request.content.title || '',
      body: notification.request.content.body || '',
      data: notification.request.content.data,
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleNotificationTap = (response: any) => {
    const data = response.notification.request.content.data;
    
    try {
      if (data?.type === 'order_status' && data?.order_id) {
        router.push(`/order/${data.order_id}` as any);
      } else if (data?.type === 'payment') {
        router.push('/(tabs)/orders');
      } else if (data?.type === 'voucher') {
        router.push('/vouchers' as any);
      } else if (data?.type === 'cart_reminder') {
        router.push('/(tabs)/cart');
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
    }
    
    markAsRead(response.notification.request.identifier);
  };

  const addNotification = (notification: Omit<StoredNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: StoredNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    NotificationService.clearAllNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ✅ Send order notification with userRole support
  const sendOrderNotification = async (orderNumber: string, status: string, userRole?: string) => {
    // Member/Customer messages
    const memberMessages: { [key: string]: { title: string; body: string } } = {
      pending: {
        title: '🛒 Order Placed',
        body: `Your order #${orderNumber} has been placed successfully!`,
      },
      paid: {
        title: '✅ Payment Confirmed',
        body: `Payment for order #${orderNumber} has been confirmed!`,
      },
      processing: {
        title: '📦 Order Processing',
        body: `Your order #${orderNumber} is being prepared.`,
      },
      shipped: {
        title: '🚚 Order Shipped',
        body: `Your order #${orderNumber} has been shipped!`,
      },
      delivered: {
        title: '🎉 Order Delivered',
        body: `Order #${orderNumber} has been delivered!`,
      },
      cancelled: {
        title: '❌ Order Cancelled',
        body: `Order #${orderNumber} has been cancelled.`,
      },
    };

    // Merchant-specific messages
    const merchantMessages: { [key: string]: { title: string; body: string } } = {
      pending: {
        title: '🆕 New Order!',
        body: `New order #${orderNumber} needs your approval!`,
      },
      paid: {
        title: '💰 Order Paid',
        body: `Order #${orderNumber} payment confirmed. Review now!`,
      },
      approved: {
        title: '✅ Order Approved',
        body: `You approved order #${orderNumber}`,
      },
      rejected: {
        title: '❌ Order Rejected',
        body: `You rejected order #${orderNumber}`,
      },
      processing: {
        title: '📦 Order Processing',
        body: `Order #${orderNumber} is being prepared.`,
      },
    };

    const message = userRole === 'merchant' 
      ? (merchantMessages[status] || memberMessages[status] || memberMessages.pending)
      : (memberMessages[status] || memberMessages.pending);

    try {
      await NotificationService.scheduleLocalNotification(
        message.title,
        message.body,
        { type: 'order_status', order_id: orderNumber, status },
        0
      );

      addNotification({
        title: message.title,
        body: message.body,
        data: { type: 'order_status', order_id: orderNumber, status },
      });

      console.log(`📦 Order notification sent: ${orderNumber} - ${status} (${userRole || 'member'})`);
    } catch (error) {
      console.error('Error sending order notification:', error);
    }
  };

  // Send payment notification
  const sendPaymentNotification = async (amount: number, status: string) => {
    const formatPrice = (price: number) => `Rp ${price.toLocaleString('id-ID')}`;

    const messages: { [key: string]: { title: string; body: string } } = {
      success: {
        title: '✅ Payment Successful',
        body: `Payment of ${formatPrice(amount)} completed successfully!`,
      },
      pending: {
        title: '⏳ Payment Pending',
        body: `Payment of ${formatPrice(amount)} is being processed...`,
      },
      failed: {
        title: '❌ Payment Failed',
        body: `Payment of ${formatPrice(amount)} failed. Please try again.`,
      },
    };

    const message = messages[status] || messages.pending;

    try {
      await NotificationService.scheduleLocalNotification(
        message.title,
        message.body,
        { type: 'payment', amount, status },
        0
      );

      addNotification({
        title: message.title,
        body: message.body,
        data: { type: 'payment', amount, status },
      });

      console.log(`💳 Payment notification sent: ${formatPrice(amount)} - ${status}`);
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  };

  // Send voucher notification
  const sendVoucherNotification = async (code: string, discount: string) => {
    const title = '🎁 Voucher Applied!';
    const body = `Voucher ${code} applied! You saved ${discount}`;

    try {
      await NotificationService.scheduleLocalNotification(
        title,
        body,
        { type: 'voucher', code, discount },
        0
      );

      addNotification({
        title,
        body,
        data: { type: 'voucher', code, discount },
      });

      console.log(`🎁 Voucher notification sent: ${code}`);
    } catch (error) {
      console.error('Error sending voucher notification:', error);
    }
  };

  // Send cart reminder notification
  const sendCartReminderNotification = async (itemCount: number) => {
    const title = '🛒 Items in Cart';
    const body = `You have ${itemCount} items waiting in your cart!`;

    try {
      await NotificationService.scheduleLocalNotification(
        title,
        body,
        { type: 'cart_reminder', item_count: itemCount },
        0
      );

      addNotification({
        title,
        body,
        data: { type: 'cart_reminder', item_count: itemCount },
      });

      console.log(`🛒 Cart reminder sent: ${itemCount} items`);
    } catch (error) {
      console.error('Error sending cart reminder:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        sendOrderNotification,
        sendPaymentNotification,
        sendVoucherNotification,
        sendCartReminderNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}