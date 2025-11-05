import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { orderAPI, paymentAPI } from '../../src/api/apiClient';
import { COLORS, SIZES } from '../../src/utils/constants';
import { useFocusEffect } from '@react-navigation/native';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit: string;
  price: number;
  subtotal: number;
}

interface OrderAddress {
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
}

interface Payment {
  id: number;
  payment_gateway: string;
  payment_type?: string; // ← TAMBAHKAN INI
  amount: number;
  status: string;
  transaction_id?: string;
  paid_at?: string;
}
interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: 'midtrans' | 'cod';
  created_at: string;
  items: OrderItem[];
  address?: OrderAddress;
  subtotal: number;
  shipping_cost: number;
  total_price: number;
  payment?: Payment;
}

// Utility functions
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
export default function OrderDetailScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const handleRefreshStatus = async () => {
    if (!order) return;
    
    setRefreshing(true);
    try {
      // Reload order dari server
      await loadOrder();
      
      Alert.alert('Success', 'Order status refreshed');
    } catch (error) {
      console.error('Error refreshing:', error);
      Alert.alert('Error', 'Failed to refresh status');
    } finally {
      setRefreshing(false);
    }
  };
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
useFocusEffect(
  React.useCallback(() => {
    // Auto check status jika order masih pending dengan midtrans payment
    if (order?.status === 'pending' && order?.payment_method === 'midtrans') {
      console.log('🔄 Auto-checking payment status...');
      
      setTimeout(async () => {
        try {
          const response = await paymentAPI.checkStatus(order.id);
          if (response.data.success) {
            const data = response.data.data;
            
            if (data.payment_status === 'paid' || data.order_status === 'paid') {
              // Reload order
              await loadOrder();
              
              Alert.alert(
                'Payment Confirmed!',
                `Your payment has been confirmed.\nMethod: ${
                  data.payment?.payment_type?.replace('_', ' ').toUpperCase() || 'Online Payment'
                }`
              );
            }
          }
        } catch (error) {
          console.error('Error auto-checking status:', error);
        }
      }, 2000); // Check after 2 seconds
    }
  }, [order?.id, order?.status])
);
  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getById(Number(id));
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load order details');
      }
    } catch (error: unknown) {
      console.error('Error loading order:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load order details'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if (!order) return;

    if (order.payment_method === 'midtrans') {
      // Navigate to payment screen with order ID
      router.push({
        pathname: '/payment/[id]',
        params: { id: order.id }
      });
    } else {
      Alert.alert(
        'Cash on Delivery',
        'Please prepare cash payment when the order arrives.'
      );
    }
  };

  const getStatusColor = (status: Order['status']): string => {
    const statusColors = {
      pending: '#FFA500',
      paid: '#4CAF50',
      processing: '#2196F3',
      shipped: '#9C27B0',
      delivered: '#4CAF50',
      cancelled: '#F44336',
    } as const;
    return statusColors[status] || COLORS.gray;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showPaymentButton =
    order.status === 'pending' && order.payment_method === 'midtrans';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}>
            <Text style={styles.statusText}>
              {order.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.orderDate}>
            {formatDate(order.created_at)}
          </Text>
        </View>

{showPaymentButton && (
  <TouchableOpacity
    style={styles.refreshButton}
    onPress={handleRefreshStatus}
    disabled={refreshing}>
    {refreshing ? (
      <ActivityIndicator size="small" color={COLORS.primary} />
    ) : (
      <Text style={styles.refreshButtonText}>🔄 Refresh Status</Text>
    )}
  </TouchableOpacity>
)}

        {/* Payment Method */}
       <View style={styles.section}>
  <Text style={styles.sectionTitle}>Payment Method</Text>
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>
      {order.payment_method === 'midtrans'
        ? `💳 ${order.payment?.payment_type 
            ? order.payment.payment_type.replace('_', ' ').toUpperCase() 
            : 'Online Payment'}`
        : '💵 Cash on Delivery'}
    </Text>
  </View>
  {order.payment?.status && (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        Status: <Text style={[
          styles.infoValue,
          { color: order.payment.status === 'success' ? COLORS.success : COLORS.warning }
        ]}>
          {order.payment.status.toUpperCase()}
        </Text>
      </Text>
    </View>
  )}
</View>

        {/* Delivery Address */}
        {order.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>
                {order.address.recipient_name}
              </Text>
              <Text style={styles.addressPhone}>
                {order.address.phone}
              </Text>
              <Text style={styles.addressText}>
                {order.address.address}
              </Text>
              <Text style={styles.addressText}>
                {order.address.city}, {order.address.province}{' '}
                {order.address.postal_code}
              </Text>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items && order.items.length > 0 ? (
            order.items.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemDetail}>
                    {item.quantity} {item.unit} × {formatPrice(item.price)}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatPrice(item.subtotal)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No items found</Text>
          )}
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>
              {formatPrice(order.subtotal || 0)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping</Text>
            <Text style={styles.priceValue}>
              {formatPrice(order.shipping_cost || 0)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>
              {formatPrice(order.total_price)}
            </Text>
          </View>
        </View>

        {/* Tracking Info */}
        {order.status !== 'pending' && order.status !== 'cancelled' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.trackingButton}
              onPress={() => router.push({
                pathname: '/order/tracking',
                params: { id: order.id }
              })}>
              <Text style={styles.trackingButtonText}>
                📦 Track Order
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Payment Button */}
      {showPaymentButton && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>Total Payment</Text>
            <Text style={styles.bottomPrice}>
              {formatPrice(order.total_price)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.payButton,
              processingPayment && styles.payButtonDisabled,
            ]}
            onPress={handlePayNow}
            disabled={processingPayment}>
            {processingPayment ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>Pay Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    color: COLORS.gray,
  },
  section: {
    backgroundColor: '#fff',
    padding: SIZES.padding,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  infoRow: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  addressCard: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  addressPhone: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 12,
    color: COLORS.gray,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  noItemsText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  priceValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  trackingButton: {
    backgroundColor: COLORS.primaryLight,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackingButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoValue: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  refreshButton: {
  marginTop: 10,
  padding: 10,
  backgroundColor: COLORS.primaryLight,
  borderRadius: 8,
  alignItems: 'center',
},
refreshButtonText: {
  color: COLORS.primary,
  fontWeight: '600',
},
});