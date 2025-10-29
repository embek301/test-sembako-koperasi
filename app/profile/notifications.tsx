// app/profile/notifications.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    promotions: true,
    orderUpdates: true,
    stockAlerts: false,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const notificationSettings = [
    {
      icon: 'notifications-outline',
      title: 'Push Notifications',
      description: 'Terima notifikasi di perangkat ini',
      key: 'push' as keyof typeof notifications,
    },
    {
      icon: 'mail-outline',
      title: 'Email Notifications',
      description: 'Terima notifikasi via email',
      key: 'email' as keyof typeof notifications,
    },
    {
      icon: 'chatbubble-outline',
      title: 'SMS Notifications',
      description: 'Terima notifikasi via SMS',
      key: 'sms' as keyof typeof notifications,
    },
    {
      icon: 'pricetag-outline',
      title: 'Promotions',
      description: 'Info promo dan diskon spesial',
      key: 'promotions' as keyof typeof notifications,
    },
    {
      icon: 'cart-outline',
      title: 'Order Updates',
      description: 'Update status pemesanan',
      key: 'orderUpdates' as keyof typeof notifications,
    },
    {
      icon: 'alert-circle-outline',
      title: 'Stock Alerts',
      description: 'Notifikasi ketika produk kembali tersedia',
      key: 'stockAlerts' as keyof typeof notifications,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.settingsContainer}>
        {notificationSettings.map((setting, index) => (
          <View key={index} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name={setting.icon as any} size={24} color="#007AFF" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingDescription}>
                  {setting.description}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications[setting.key]}
              onValueChange={() => handleToggle(setting.key)}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Atur preferensi notifikasi sesuai kebutuhan Anda
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  settingsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});