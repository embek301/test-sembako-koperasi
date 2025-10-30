import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { orderAPI } from '../../src/api/apiClient';
import { COLORS, SIZES, formatPrice, formatDate } from '../../src/utils/constants';

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
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statusCard}>
        <Text style={styles.orderNumber}>#{order.order_number}</Text>
        <Text style={styles.status}>{order.status.toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items?.map((item: any) => (
          <View key={item.id} style={styles.orderItem}>
            <Text style={styles.itemName}>{item.product_name}</Text>
            <Text style={styles.itemPrice}>{formatPrice(item.subtotal)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Total</Text>
        <Text style={styles.totalPrice}>{formatPrice(order.total_price)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusCard: { backgroundColor: '#fff', padding: 20, alignItems: 'center' },
  orderNumber: { fontSize: 18, fontWeight: 'bold' },
  status: { fontSize: 14, color: COLORS.primary, marginTop: 5 },
  section: { backgroundColor: '#fff', padding: SIZES.padding, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  itemName: { fontSize: 14 },
  itemPrice: { fontSize: 14, fontWeight: 'bold' },
  totalPrice: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
});