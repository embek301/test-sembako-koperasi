// src/context/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notificationService';
import { router } from 'expo-router';

interface StoredNotification {
  id: string;
  title: string;
  body: string;
  data: any;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: StoredNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  sendOrderNotification: (orderNumber: string, status: string) => Promise<void>;
  sendPaymentNotification: (amount: number, status: string) => Promise<void>;
  sendVoucherNotification: (voucherCode: string, discount: string) => Promise<void>;
  sendCartReminderNotification: (itemCount: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    setupNotifications();

    // Setup listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 Notification received:', notification);
      addNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      handleNotificationTap(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const setupNotifications = async () => {
    await NotificationService.requestPermission();
    await NotificationService.setupAndroidChannels();
  };

  const addNotification = (notification: any) => {
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
    
    // Navigate based on notification type
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
    
    // Mark as read
    markAsRead(response.notification.request.identifier);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const clearAll = () => {
    setNotifications([]);
    NotificationService.clearAllNotifications();
  };

  // Wrapper functions untuk trigger notifikasi
  const sendOrderNotification = async (orderNumber: string, status: string) => {
    try {
      await NotificationService.sendOrderNotification(orderNumber, status);
      console.log(`📦 Order notification sent: ${orderNumber} - ${status}`);
    } catch (error) {
      console.error('Error sending order notification:', error);
    }
  };

  const sendPaymentNotification = async (amount: number, status: string) => {
    try {
      await NotificationService.sendPaymentNotification(amount, status);
      console.log(`💳 Payment notification sent: ${amount} - ${status}`);
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  };

  const sendVoucherNotification = async (voucherCode: string, discount: string) => {
    try {
      await NotificationService.sendVoucherNotification(voucherCode, discount);
      console.log(`🎁 Voucher notification sent: ${voucherCode}`);
    } catch (error) {
      console.error('Error sending voucher notification:', error);
    }
  };

  const sendCartReminderNotification = async (itemCount: number) => {
    try {
      await NotificationService.sendCartReminderNotification(itemCount);
      console.log(`🛒 Cart reminder sent: ${itemCount} items`);
    } catch (error) {
      console.error('Error sending cart reminder:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        clearAll,
        sendOrderNotification,
        sendPaymentNotification,
        sendVoucherNotification,
        sendCartReminderNotification,
      }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};