// src/context/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notificationService';
import { Alert } from 'react-native';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data: any;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // Request permission and get token
    initializeNotifications();

    // Setup listeners
    const cleanup = NotificationService.setupListeners();

    // Listen to received notifications
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        const newNotification: NotificationItem = {
          id: notification.request.identifier,
          title: notification.request.content.title || '',
          body: notification.request.content.body || '',
          data: notification.request.content.data,
          timestamp: new Date(),
          read: false,
        };

        setNotifications((prev) => [newNotification, ...prev]);

        // Update badge
        NotificationService.setBadgeCount(
          notifications.filter((n) => !n.read).length + 1
        );
      }
    );

    return () => {
      cleanup();
      notificationListener.remove();
    };
  }, []);

  const initializeNotifications = async () => {
    await NotificationService.requestPermission();
    await NotificationService.setupAndroidChannels();
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      const unread = updated.filter((n) => !n.read).length;
      NotificationService.setBadgeCount(unread);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    NotificationService.setBadgeCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    NotificationService.clearAllNotifications();
    NotificationService.setBadgeCount(0);
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      const unread = filtered.filter((n) => !n.read).length;
      NotificationService.setBadgeCount(unread);
      return filtered;
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        deleteNotification,
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