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
        const cart = cartRes.data.data;
        
        // Check if cart is empty
        if (!cart.items || cart.items.length === 0) {
          Alert.alert('Cart Empty', 'Your cart is empty', [
            { text: 'OK', onPress: () => router.back() }
          ]);
          return;
        }
        
        setCartData(cart);
      }

      if (addressRes.data.success) {
        const addressList = addressRes.data.data;
        setAddresses(addressList);
        const defaultAddress = addressList.find((addr: any) => addr.is_default);
        setSelectedAddress(defaultAddress || addressList[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!cartData || !cartData.items || cartData.items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    setProcessing(true);
    try {
      // Step 1: Create order
      console.log('📦 Creating order...');
      const orderResponse = await orderAPI.create({
        address_id: selectedAddress.id,
        payment_method: paymentMethod,
      });

      if (orderResponse.data.success) {
        const order = orderResponse.data.data;
        console.log('✅ Order created:', order.id);

        // Step 2: Clear cart after successful order
        try {
          console.log('🧹 Clearing cart...');
          await cartAPI.clearCart();
          console.log('✅ Cart cleared successfully');
        } catch (clearError) {
          console.error('⚠️ Error clearing cart:', clearError);
          // Don't fail the whole process if cart clear fails
        }

        // Step 3: Show success and navigate
        Alert.alert(
          'Order Created!',
          `Order #${order.order_number} has been created successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (paymentMethod === 'midtrans') {
                  // Navigate to payment page
                  router.replace(`/payment/${order.id}` as any);
                } else {
                  // Navigate to order detail
                  router.replace(`/order/${order.id}` as any);
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error creating order:', error);
      
      let errorMessage = 'Failed to create order';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join('\n');
      }
      
      Alert.alert('Error', errorMessage);
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

  if (!cartData || !cartData.items || cartData.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const shippingCost = 10000;
  const total = (cartData?.subtotal || 0) + shippingCost;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items:</Text>
            <Text style={styles.summaryValue}>{cartData.items.length} items</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatPrice(cartData.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>{formatPrice(shippingCost)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push('/profile/addresses' as any)}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
          
          {selectedAddress ? (
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>{selectedAddress.recipient_name}</Text>
              <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
              <Text style={styles.addressText}>{selectedAddress.address}</Text>
              <Text style={styles.addressText}>
                {selectedAddress.district}, {selectedAddress.city}
              </Text>
              <Text style={styles.addressText}>
                {selectedAddress.province}, {selectedAddress.postal_code}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => router.push('/profile/addresses/new' as any)}>
              <Text style={styles.addAddressText}>+ Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'midtrans' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('midtrans')}>
            <View style={styles.paymentOptionContent}>
              <View style={styles.radioOuter}>
                {paymentMethod === 'midtrans' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.paymentTitle}>💳 Online Payment</Text>
                <Text style={styles.paymentDesc}>Credit Card, Debit, E-wallet, etc.</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('cod')}>
            <View style={styles.paymentOptionContent}>
              <View style={styles.radioOuter}>
                {paymentMethod === 'cod' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.paymentTitle}>💵 Cash on Delivery</Text>
                <Text style={styles.paymentDesc}>Pay when you receive the order</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Payment</Text>
          <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.placeOrderButton, processing && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={processing || !selectedAddress}>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    color: COLORS.gray,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: SIZES.padding,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  changeText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  addressCard: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 2,
  },
  addAddressButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addAddressText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  paymentOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentDesc: {
    fontSize: 12,
    color: COLORS.gray,
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
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  placeOrderButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});