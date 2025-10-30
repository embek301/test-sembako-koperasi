import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { cartAPI, addressAPI, orderAPI } from '../src/api/apiClient';
import { COLORS, SIZES, formatPrice } from '../src/utils/constants';

export default function CheckoutScreen() {
  const [cartData, setCartData] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('midtrans');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cartRes, addressRes] = await Promise.all([
        cartAPI.getCart(),
        addressAPI.getAll(),
      ]);

      if (cartRes.data.success) {
        setCartData(cartRes.data.data);
      }

      if (addressRes.data.success) {
        const addressList = addressRes.data.data;
        setAddresses(addressList);
        const defaultAddress = addressList.find((addr: any) => addr.is_default);
        setSelectedAddress(defaultAddress || addressList[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    setProcessing(true);
    try {
      const response = await orderAPI.create({
        address_id: selectedAddress.id,
        payment_method: paymentMethod,
      });

      if (response.data.success) {
        const order = response.data.data;
        Alert.alert('Success', 'Order created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              if (paymentMethod === 'midtrans') {
                router.push(`/payment/${order.id}` as any);
              } else {
                router.push(`/order/${order.id}` as any);
              }
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create order');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const shippingCost = 10000;
  const total = (cartData?.subtotal || 0) + shippingCost;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {selectedAddress && (
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>{selectedAddress.recipient_name}</Text>
              <Text style={styles.addressText}>{selectedAddress.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'midtrans' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('midtrans')}>
            <Text>💳 Online Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('cod')}>
            <Text>💵 Cash on Delivery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, processing && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={processing}>
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  section: { backgroundColor: '#fff', padding: SIZES.padding, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  addressCard: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8 },
  addressName: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  addressText: { fontSize: 14, color: COLORS.gray },
  paymentOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  paymentOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: { fontSize: 12, color: COLORS.gray },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  placeOrderButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8 },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});