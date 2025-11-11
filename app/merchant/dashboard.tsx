// app/(merchant)/dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { merchantAPI } from '../../src/api/apiClient';
import { COLORS } from '../../src/utils/constants';
import { formatPrice } from '../../src/utils/formatters';
import { useAuth } from '../../src/context/AuthContext';

export default function MerchantDashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await merchantAPI.getProfile();
      if (response.data.success) {
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };    

 const menuItems = [
    {
      icon: 'receipt',
      title: 'Orders',
      description: `${stats?.pending_orders || 0} pending`,
      color: '#E91E63',
      onPress: () => router.push('/merchant/orders' as any),
    },
    {
      icon: 'cube',
      title: 'My Products',
      description: `${stats?.total_products || 0} products`,
      color: '#4CAF50',
      onPress: () => router.push('/merchant/products' as any),
    },
    {
      icon: 'card',
      title: 'Payments',
      description: 'View payment history',
      color: '#2196F3',
      onPress: () => router.push('/merchant/payments' as any),
    },
    {
      icon: 'wallet',
      title: 'Balance & Withdrawal',
      description: formatPrice(stats?.available_balance || 0),
      color: '#FF9800',
      onPress: () => router.push('/merchant/balance' as any),
    },
    {
      icon: 'settings',
      title: 'Store Settings',
      description: 'Manage store info',
      color: '#9E9E9E',
      onPress: () => router.push('/merchant/settings' as any),
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.storeName}>{user?.store_name || 'Merchant'}</Text>
        </View>
        {!user?.is_verified && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>⏳ Pending Verification</Text>
          </View>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.statValue}>
            {formatPrice(stats?.total_sales || 0)}
          </Text>
          <Text style={styles.statLabel}>Total Sales</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="cash" size={24} color="#2196F3" />
          </View>
          <Text style={styles.statValue}>
            {formatPrice(stats?.total_earnings || 0)}
          </Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="cube-outline" size={24} color="#FF9800" />
          </View>
          <Text style={styles.statValue}>{stats?.total_products || 0}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#9C27B0" />
          </View>
          <Text style={styles.statValue}>{stats?.active_products || 0}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            disabled={!user?.is_verified && index !== 3}>
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.lightGray} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Info Banner */}
      {!user?.is_verified && (
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color="#FF9800" />
          <Text style={styles.infoBannerText}>
            Your account is pending verification. Some features are limited until approved.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  menuContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 3,
  },
  menuDescription: {
    fontSize: 13,
    color: COLORS.gray,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 10,
    lineHeight: 18,
  },
});