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
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
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
      await Share.share({
        message: `Use voucher code: ${code}`,
      });
    } catch (error) {
      console.error('Error sharing voucher:', error);
    }
  };

  const getDiscountText = (voucher: Voucher): string => {
    if (voucher.discount_type === 'percentage') {
      const maxText = voucher.max_discount 
        ? ` (max ${formatPrice(voucher.max_discount)})` 
        : '';
      return `${voucher.discount_value}% OFF${maxText}`;
    } else {
      return `${formatPrice(voucher.discount_value)} OFF`;
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

  const renderVoucherCard = ({ item }: { item: Voucher }) => {
    const isExpired = isVoucherExpired(item.valid_until);
    const isLimitReached = item.usage_limit && item.used_count 
      ? item.used_count >= item.usage_limit 
      : false;
    const isInactive = !item.is_active || isExpired || isLimitReached;

    return (
      <View style={[styles.voucherCard, isInactive && styles.voucherCardInactive]}>
        {/* Voucher Header */}
        <View style={styles.voucherHeader}>
          <View style={styles.voucherIconContainer}>
            <Ionicons 
              name="pricetag" 
              size={32} 
              color={isInactive ? COLORS.gray : COLORS.primary} 
            />
          </View>
          <View style={styles.voucherHeaderInfo}>
            <Text style={[styles.voucherName, isInactive && styles.textInactive]}>
              {item.name}
            </Text>
            <Text style={[styles.voucherDiscount, isInactive && styles.textInactive]}>
              {getDiscountText(item)}
            </Text>
          </View>
        </View>

        {/* Voucher Description */}
        <Text style={[styles.voucherDescription, isInactive && styles.textInactive]}>
          {item.description}
        </Text>

        {/* Voucher Details */}
        <View style={styles.voucherDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="cart-outline" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>
              Min. purchase: {formatPrice(item.min_purchase)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>
              Valid until: {formatDate(item.valid_until)}
            </Text>
          </View>
          {item.usage_limit && (
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={16} color={COLORS.gray} />
              <Text style={styles.detailText}>
                Used: {item.used_count || 0}/{item.usage_limit}
              </Text>
            </View>
          )}
        </View>

        {/* Status Badge */}
        {isInactive && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>
              {isExpired ? 'EXPIRED' : isLimitReached ? 'LIMIT REACHED' : 'INACTIVE'}
            </Text>
          </View>
        )}

        {/* Voucher Code */}
        <View style={styles.voucherCodeSection}>
          <View style={styles.voucherCodeContainer}>
            <Text style={[styles.voucherCode, isInactive && styles.textInactive]}>
              {item.code}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.copyButton, isInactive && styles.copyButtonInactive]}
            onPress={() => copyVoucherCode(item.code)}
            disabled={isInactive}>
            <Ionicons 
              name="copy-outline" 
              size={18} 
              color={isInactive ? COLORS.gray : COLORS.primary} 
            />
            <Text style={[styles.copyButtonText, isInactive && styles.textInactive]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
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
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Vouchers</Text>
          <Text style={styles.headerSubtitle}>
            {vouchers.filter(v => v.is_active && !isVoucherExpired(v.valid_until)).length} active vouchers
          </Text>
        </View>
      </View>

      <FlatList
        data={vouchers}
        renderItem={renderVoucherCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={80} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No vouchers available</Text>
            <Text style={styles.emptySubtext}>
              Check back later for special offers
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
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
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
    color: COLORS.text,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  listContent: {
    padding: 15,
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  voucherCardInactive: {
    opacity: 0.6,
    borderLeftColor: COLORS.gray,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  voucherIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  voucherHeaderInfo: {
    flex: 1,
  },
  voucherName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  voucherDiscount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  voucherDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 15,
  },
  voucherDetails: {
    gap: 8,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  inactiveBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: COLORS.error,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  inactiveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  voucherCodeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  voucherCodeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  copyButtonInactive: {
    backgroundColor: COLORS.background,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
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