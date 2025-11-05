// app/vouchers/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { voucherAPI } from '../../src/api/apiClient';
import { COLORS, SIZES } from '../../src/utils/constants';
import { formatPrice } from '../../src/utils/formatters';

interface Voucher {
  id: number;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase: number;
  max_discount?: number;
  valid_until: string;
  usage_limit?: number;
  used_count?: number;
  is_active: boolean;
}

export default function VouchersScreen() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active');

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const response = await voucherAPI.getAll();
      if (response.data.success) {
        setVouchers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading vouchers:', error);
      Alert.alert('Error', 'Failed to load vouchers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVouchers();
  };

  const copyVoucherCode = async (code: string) => {
    try {
      Alert.alert(
        'Voucher Code',
        code,
        [
          {
            text: 'Share Code',
            onPress: async () => {
              try {
                await Share.share({
                  message: `🎁 Use my voucher code: ${code}\n\nGet discount on your next purchase!`,
                });
              } catch (error) {
                console.error('Error sharing:', error);
              }
            }
          },
          { text: 'Close', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error with voucher code:', error);
    }
  };

  const getDiscountText = (voucher: Voucher): string => {
    if (voucher.type === 'percentage') {
      const maxText = voucher.max_discount 
        ? ` (max ${formatPrice(voucher.max_discount)})` 
        : '';
      return `${voucher.value}% OFF${maxText}`;
    } else {
      return `${formatPrice(voucher.value)} OFF`;
    }
  };

  const isVoucherExpired = (validUntil: string): boolean => {
    return new Date(validUntil) < new Date();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeVouchers = vouchers.filter(v => 
    v.is_active && !isVoucherExpired(v.valid_until) && 
    (!v.usage_limit || !v.used_count || v.used_count < v.usage_limit)
  );

  const expiredVouchers = vouchers.filter(v => 
    !v.is_active || isVoucherExpired(v.valid_until) || 
    (v.usage_limit && v.used_count && v.used_count >= v.usage_limit)
  );

  const displayedVouchers = activeTab === 'active' ? activeVouchers : expiredVouchers;

  const renderVoucherCard = ({ item }: { item: Voucher }) => {
    const isExpired = isVoucherExpired(item.valid_until);
    const isLimitReached = item.usage_limit && item.used_count 
      ? item.used_count >= item.usage_limit 
      : false;
    const isInactive = !item.is_active || isExpired || isLimitReached;

    return (
      <View style={[styles.voucherCard, isInactive && styles.voucherCardInactive]}>
        {/* Top Badge - Discount */}
        <View style={[styles.discountBadge, isInactive && styles.discountBadgeInactive]}>
          <Text style={styles.discountBadgeText}>
            {getDiscountText(item)}
          </Text>
        </View>

        {/* Voucher Content */}
        <View style={styles.voucherContent}>
          {/* Icon */}
          <View style={[styles.voucherIcon, isInactive && styles.voucherIconInactive]}>
            <Ionicons 
              name="gift" 
              size={36} 
              color={isInactive ? COLORS.gray : '#fff'} 
            />
          </View>

          {/* Info */}
          <View style={styles.voucherInfo}>
            <Text style={[styles.voucherName, isInactive && styles.textInactive]}>
              {item.name}
            </Text>
            <Text style={[styles.voucherDescription, isInactive && styles.textInactive]} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Details Row */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="cart-outline" size={14} color={COLORS.gray} />
                <Text style={styles.detailItemText}>
                  Min. {formatPrice(item.min_purchase)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.gray} />
                <Text style={styles.detailItemText}>
                  {formatDate(item.valid_until)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dashed Line Separator */}
        <View style={styles.separator}>
          <View style={styles.dashedLine} />
        </View>

        {/* Bottom Section - Code */}
        <View style={styles.codeSection}>
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>CODE:</Text>
            <Text style={[styles.code, isInactive && styles.textInactive]}>
              {item.code}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.useButton, isInactive && styles.useButtonInactive]}
            onPress={() => copyVoucherCode(item.code)}
            disabled={isInactive}>
            <Ionicons 
              name={isInactive ? "lock-closed" : "copy"} 
              size={18} 
              color={isInactive ? COLORS.gray : '#fff'} 
            />
            <Text style={[styles.useButtonText, isInactive && styles.useButtonTextInactive]}>
              {isInactive ? 'Inactive' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Badge for Inactive */}
        {isInactive && (
          <View style={styles.statusOverlay}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {isExpired ? '⏰ EXPIRED' : isLimitReached ? '🔒 LIMIT REACHED' : '❌ INACTIVE'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading vouchers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Vouchers</Text>
          <Text style={styles.headerSubtitle}>
            {activeVouchers.length} active • {expiredVouchers.length} expired
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({activeVouchers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expired' && styles.tabActive]}
          onPress={() => setActiveTab('expired')}>
          <Text style={[styles.tabText, activeTab === 'expired' && styles.tabTextActive]}>
            Expired ({expiredVouchers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedVouchers}
        renderItem={renderVoucherCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={80} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>
              {activeTab === 'active' ? 'No active vouchers' : 'No expired vouchers'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'active' 
                ? 'Check back later for special offers' 
                : 'Your expired vouchers will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.gray,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  voucherCardInactive: {
    opacity: 0.6,
  },
  discountBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  discountBadgeInactive: {
    backgroundColor: COLORS.gray,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  voucherContent: {
    flexDirection: 'row',
    padding: 20,
  },
  voucherIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  voucherIconInactive: {
    backgroundColor: COLORS.lightGray,
    shadowColor: '#000',
  },
  voucherInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  voucherName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  voucherDescription: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailItemText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  separator: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  dashedLine: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  codeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  codeContainer: {
    flex: 1,
    marginRight: 15,
  },
  codeLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
    marginBottom: 4,
  },
  code: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  useButtonInactive: {
    backgroundColor: COLORS.lightGray,
    shadowColor: '#000',
  },
  useButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  useButtonTextInactive: {
    color: COLORS.gray,
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  textInactive: {
    color: COLORS.lightGray,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray,
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
});