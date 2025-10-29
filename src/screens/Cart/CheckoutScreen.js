// src/screens/Cart/CheckoutScreen.js
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
import { cartAPI, addressAPI, orderAPI } from '../../api/apiClient';

const CheckoutScreen = ({ navigation }) => {
  const [cartData, setCartData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
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
        
        // Auto-select default address
        const defaultAddress = addressList.find(addr => addr.is_default);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        } else if (addressList.length > 0) {
          setSelectedAddress(addressList[0]);
        }
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

    if (!cartData || cartData.items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
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
        
        Alert.alert(
          'Success',
          'Order created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                if (paymentMethod === 'midtrans') {
                  navigation.navigate('Payment', { orderId: order.id });
                } else {
                  navigation.navigate('OrderDetail', { orderId: order.id });
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create order';
      Alert.alert('Error', message);
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
      </View>
    );
  }

  const shippingCost = 10000;
  const total = cartData.subtotal + shippingCost;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddressList')}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View style={styles.addressCard}>
              <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
              <Text style={styles.addressName}>{selectedAddress.recipient_name}</Text>
              <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
              <Text style={styles.addressText}>{selectedAddress.address}</Text>
              <Text style={styles.addressText}>
                {selectedAddress.district}, {selectedAddress.city}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => navigation.navigate('AddAddress')}
            >
              <Text style={styles.addAddressText}>+ Add Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          {cartData.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName} numberOfLines={1}>
                {item.product.name} x{item.quantity}
              </Text>
              <Text style={styles.orderItemPrice}>
                {formatPrice(item.product.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'midtrans' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('midtrans')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'midtrans' && <View style={styles.radioButtonSelected} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Online Payment</Text>
              <Text style={styles.paymentDesc}>Credit Card, Bank Transfer, E-wallet</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'cod' && <View style={styles.radioButtonSelected} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Cash on Delivery</Text>
              <Text style={styles.paymentDesc}>Pay when you receive</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Price Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{formatPrice(cartData.subtotal)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping Cost</Text>
            <Text style={styles.priceValue}>{formatPrice(shippingCost)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotal}>Total</Text>
          <Text style={styles.bottomAmount}>{formatPrice(total)}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.placeOrderButton, processing && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
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
    color: '#333',
  },
  changeText: {
    fontSize: 14,
    color: '#2E7D32',
  },
  addressCard: {
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#E8F5E9',
  },
  addressLabel: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  addAddressButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
  },
  addAddressText: {
    color: '#2E7D32',
    fontSize: 14,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  paymentOptionSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2E7D32',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  paymentDesc: {
    fontSize: 12,
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bottomTotal: {
    fontSize: 12,
    color: '#666',
  },
  bottomAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  placeOrderButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#ccc',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;