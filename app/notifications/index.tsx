// app/notifications/index.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../../src/context/NotificationContext';

export default function NotificationsScreen() {
  const { notifications, markAsRead, clearAll } = useNotifications();

  const renderNotification = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.notifItem, !item.read && styles.unread]}
      onPress={() => markAsRead(item.id)}>
      <Ionicons
        // icon name mapping returns a string; cast to any to satisfy Icon prop types
        name={getNotificationIcon(item.data?.type) as any}
        size={24}
        color="#007AFF"
      />
      <View style={styles.notifContent}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifBody}>{item.body}</Text>
        <Text style={styles.notifTime}>
          {formatTimeAgo(item.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={clearAll}>
          <Text style={styles.clearAll}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>No notifications</Text>
          </View>
        }
      />
    </View>
  );
}

function getNotificationIcon(type?: string) {
  const icons = {
    order_status: 'cube-outline',
    payment: 'card-outline',
    voucher: 'pricetag-outline',
    stock: 'alert-circle-outline',
    promo: 'megaphone-outline',
  };
  return icons[(type || '') as keyof typeof icons] || 'notifications-outline';
}

function formatTimeAgo(date?: Date | string) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  clearAll: { color: '#007AFF' },
  notifItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  unread: { backgroundColor: '#E3F2FD' },
  notifContent: { flex: 1, marginLeft: 12 },
  notifTitle: { fontWeight: '600', marginBottom: 4 },
  notifBody: { color: '#666', fontSize: 14 },
  notifTime: { color: '#999', fontSize: 12, marginTop: 4 },
  empty: { padding: 40, alignItems: 'center' },
});