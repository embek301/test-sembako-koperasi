import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI } from '../../src/api/apiClient';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await orderAPI.getById(Number(id));
      setOrder(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'Gagal memuat detail pesanan');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'processing':
        return '#007AFF';
      case 'shipped':
        return '#5856D6';
      case 'delivered':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu Pembayaran';
      case 'processing':
        return 'Diproses';
      case 'shipped':
        return 'Dikirim';
      case 'delivered':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Batalkan Pesanan',
      'Yakin ingin membatalkan pesanan ini?',
      [
        { text: 'Tidak', style: 'cancel' },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderAPI.cancel(Number(id), {
                reason: 'Dibatalkan oleh pembeli',
              });
              Alert.alert('Berhasil', 'Pesanan berhasil dibatalkan', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Gagal membatalkan pesanan'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pesanan tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: getStatusColor(order.status) + '20' },
            ]}
          >
            <Ionicons
              name={
                order.status === 'delivered'
                  ? 'checkmark-circle'
                  : order.status === 'cancelled'
                  ? 'close-circle'
                  : 'time'
              }
              size={32}
              color={getStatusColor(order.status)}
            />
          </View>
          <Text style={styles.statusTitle}>{getStatusText(order.status)}</Text>
          <Text style={styles.orderNumber}>Order #{order.id}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
          </View>
          <View style={styles.addressCard}>
            <Text style={styles.addressName}>{order.address?.name}</Text>
            <Text style={styles.addressPhone}>{order.address?.phone}</Text>
            <Text style={styles.addressDetail}>
              {order.address?.address}, {order.address?.city},{' '}
              {order.address?.province} {order.address?.postal_code}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cart" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Produk Pesanan</Text>
          </View>
          {order.items?.map((item: any) => (
            <View key={item.id} style={styles.itemCard}>
              <Image
                source={{
                  uri: item.product?.image || 'https://via.placeholder.com/80',
                }}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product?.name || item.name}
                </Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  Rp {item.price?.toLocaleString('id-ID')}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                Rp {(item.price * item.quantity).toLocaleString('id-ID')}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          </View>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>
                Rp {order.subtotal?.toLocaleString('id-ID')}
              </Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Diskon</Text>
                <Text style={[styles.priceValue, { color: '#34C759' }]}>
                  -Rp {order.discount?.toLocaleString('id-ID')}
                </Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Ongkir</Text>
              <Text style={styles.priceValue}>
                Rp {order.shipping_cost?.toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                Rp {order.total?.toLocaleString('id-ID')}
              </Text>
            </View>
            {order.payment_method && (
              <View style={[styles.priceRow, { marginTop: 8 }]}>
                <Text style={styles.priceLabel}>Metode Pembayaran</Text>
                <Text style={styles.priceValue}>
                  {order.payment_method === 'bank_transfer'
                    ? 'Transfer Bank'
                    : order.payment_method === 'ewallet'
                    ? 'E-Wallet'
                    : 'Cash on Delivery'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbox" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Catatan</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        {order.status === 'pending' && (
          <>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelOrder}
            >
              <Text style={styles.cancelButtonText}>Batalkan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => router.push(`/payment/${order.id}`)}
            >
              <Text style={styles.payButtonText}>Bayar</Text>
            </TouchableOpacity>
          </>
        )}
        {order.status === 'shipped' && (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.push(`/order/tracking/${order.id}`)}
          >
            <Ionicons name="location-outline" size={20} color="#fff" />
            <Text style={styles.trackButtonText}>Lacak Pesanan</Text>
          </TouchableOpacity>
        )}
        {order.status === 'delivered' && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => router.push(`/order/${order.id}/review`)}
          >
            <Ionicons name="star-outline" size={20} color="#fff" />
            <Text style={styles.reviewButtonText}>Beri Ulasan</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addressCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  itemCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#8E8E93',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  priceCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  notesCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#fff',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  payButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#34C759',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trackButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});