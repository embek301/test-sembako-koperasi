import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cartAPI, addressAPI, orderAPI, voucherAPI } from '../src/api/apiClient';
import { COLORS, SIZES } from '../src/utils/constants';
import { formatPrice } from '../src/utils/formatters';
import { useNotifications } from '../src/context/NotificationContext';

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
}

export default function CheckoutScreen() {
  const [cartData, setCartData] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('midtrans');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Voucher states
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cartRes, addressRes, voucherRes] = await Promise.all([
        cartAPI.getCart(),
        addressAPI.getAll(),
        voucherAPI.getAll(),
      ]);

      if (cartRes.data.success) {
        const cart = cartRes.data.data;
        
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

      if (voucherRes.data.success) {
        setAvailableVouchers(voucherRes.data.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (voucher: Voucher, subtotal: number): number => {
    if (subtotal < voucher.min_purchase) {
      return 0;
    }

    let discountAmount = 0;
    
    if (voucher.type === 'percentage') {
      discountAmount = (subtotal * voucher.value) / 100;
      
      // Apply max discount if exists
      if (voucher.max_discount && discountAmount > voucher.max_discount) {
        discountAmount = voucher.max_discount;
      }
    } else {
      // Fixed discount
      discountAmount = voucher.value;
    }

    return Math.min(discountAmount, subtotal);
  };

  const applyVoucherCode = async () => {
    if (!voucherCode.trim()) {
      Alert.alert('Error', 'Please enter voucher code');
      return;
    }

    setApplyingVoucher(true);
    try {
      const response = await voucherAPI.validate({
        code: voucherCode,
        subtotal: cartData.subtotal,
      });

      if (response.data.success) {
        const voucher = response.data.data;
        setSelectedVoucher(voucher);
        const discountAmount = calculateDiscount(voucher, cartData.subtotal);
        setDiscount(discountAmount);
        setVoucherModalVisible(false);
        Alert.alert('Success', `Voucher "${voucher.name}" applied!`);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid voucher code';
      Alert.alert('Error', message);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const selectVoucher = (voucher: Voucher) => {
    if (cartData.subtotal < voucher.min_purchase) {
      Alert.alert(
        'Minimum Purchase Not Met',
        `This voucher requires minimum purchase of ${formatPrice(voucher.min_purchase)}`
      );
      return;
    }

    setSelectedVoucher(voucher);
    setVoucherCode(voucher.code);
    const discountAmount = calculateDiscount(voucher, cartData.subtotal);
    setDiscount(discountAmount);
    setVoucherModalVisible(false);
    Alert.alert('Success', `Voucher "${voucher.name}" applied!`);
  };

  const removeVoucher = () => {
    setSelectedVoucher(null);
    setVoucherCode('');
    setDiscount(0);
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
      console.log('📦 Creating order...');
      
      const orderData: any = {
        address_id: selectedAddress.id,
        payment_method: paymentMethod,
      };

      // Add voucher if selected
      if (selectedVoucher) {
        orderData.voucher_code = selectedVoucher.code;
      }

      const orderResponse = await orderAPI.create(orderData);

      if (orderResponse.data.success) {
        const order = orderResponse.data.data;
        console.log('✅ Order created:', order.id);
        await sendOrderNotification(order.order_number, 'pending');
        // Clear cart
        try {
          console.log('🧹 Clearing cart...');
          await cartAPI.clearCart();
          console.log('✅ Cart cleared successfully');
        } catch (clearError) {
          console.error('⚠️ Error clearing cart:', clearError);
        }

        // Show success and navigate
        Alert.alert(
          'Order Created!',
          `Order #${order.order_number} has been created successfully!${
            discount > 0 ? `\n\nDiscount: ${formatPrice(discount)}` : ''
          }`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (paymentMethod === 'midtrans') {
                  router.replace(`/payment/${order.id}` as any);
                } else {
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
  const { sendOrderNotification } = useNotifications();
  const renderVoucherItem = ({ item }: { item: Voucher }) => {
    const isEligible = cartData.subtotal >= item.min_purchase;
    const discountAmount = calculateDiscount(item, cartData.subtotal);

    return (
      <TouchableOpacity
        style={[
          styles.voucherItem,
          !isEligible && styles.voucherItemDisabled,
          selectedVoucher?.id === item.id && styles.voucherItemSelected,
        ]}
        onPress={() => isEligible && selectVoucher(item)}
        disabled={!isEligible}>
        <View style={styles.voucherLeft}>
          <View style={styles.voucherIcon}>
            <Ionicons name="pricetag" size={24} color={isEligible ? COLORS.primary : COLORS.gray} />
          </View>
          <View style={styles.voucherInfo}>
            <Text style={[styles.voucherName, !isEligible && styles.textDisabled]}>
              {item.name}
            </Text>
            <Text style={[styles.voucherCode, !isEligible && styles.textDisabled]}>
              {item.code}
            </Text>
            <Text style={[styles.voucherDesc, !isEligible && styles.textDisabled]}>
              {item.description}
            </Text>
            {isEligible ? (
              <Text style={styles.voucherSave}>
                Save {formatPrice(discountAmount)}
              </Text>
            ) : (
              <Text style={styles.voucherMinPurchase}>
                Min. purchase: {formatPrice(item.min_purchase)}
              </Text>
            )}
          </View>
        </View>
        {selectedVoucher?.id === item.id && (
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
        )}
      </TouchableOpacity>
    );
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
  const subtotalAfterDiscount = cartData.subtotal - discount;
  const total = subtotalAfterDiscount + shippingCost;

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
        </View>

        {/* Voucher Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Voucher</Text>
            <TouchableOpacity onPress={() => setVoucherModalVisible(true)}>
              <Text style={styles.changeText}>
                {selectedVoucher ? 'Change' : 'Select'}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedVoucher ? (
            <View style={styles.selectedVoucherCard}>
              <View style={styles.selectedVoucherLeft}>
                <Ionicons name="pricetag" size={20} color={COLORS.success} />
                <View style={styles.selectedVoucherInfo}>
                  <Text style={styles.selectedVoucherName}>{selectedVoucher.name}</Text>
                  <Text style={styles.selectedVoucherCode}>{selectedVoucher.code}</Text>
                  <Text style={styles.selectedVoucherDiscount}>
                    -{formatPrice(discount)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={removeVoucher}>
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectVoucherButton}
              onPress={() => setVoucherModalVisible(true)}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
              <Text style={styles.selectVoucherText}>Select Voucher</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
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

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{formatPrice(cartData.subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, styles.discountText]}>Voucher Discount</Text>
              <Text style={[styles.priceValue, styles.discountText]}>
                -{formatPrice(discount)}
              </Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping</Text>
            <Text style={styles.priceValue}>{formatPrice(shippingCost)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Payment</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalBottomLabel}>Total Payment</Text>
          {discount > 0 && (
            <Text style={styles.totalOriginal}>
              {formatPrice(cartData.subtotal + shippingCost)}
            </Text>
          )}
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

      {/* Voucher Modal */}
      <Modal
        visible={voucherModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVoucherModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Voucher</Text>
            <TouchableOpacity onPress={() => setVoucherModalVisible(false)}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Voucher Code Input */}
          <View style={styles.voucherInputSection}>
            <Text style={styles.voucherInputLabel}>Have a voucher code?</Text>
            <View style={styles.voucherInputContainer}>
              <TextInput
                style={styles.voucherInput}
                placeholder="Enter voucher code"
                value={voucherCode}
                onChangeText={setVoucherCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  applyingVoucher && styles.buttonDisabled,
                ]}
                onPress={applyVoucherCode}
                disabled={applyingVoucher}>
                {applyingVoucher ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.applyButtonText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Available Vouchers */}
          <Text style={styles.availableVouchersTitle}>Available Vouchers</Text>
          <FlatList
            data={availableVouchers}
            renderItem={renderVoucherItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.voucherList}
            ListEmptyComponent={
              <View style={styles.emptyVouchers}>
                <Text style={styles.emptyVouchersText}>No vouchers available</Text>
              </View>
            }
          />
        </View>
      </Modal>
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
  selectedVoucherCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  selectedVoucherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedVoucherInfo: {
    marginLeft: 12,
    flex: 1,
  },
  selectedVoucherName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  selectedVoucherCode: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  selectedVoucherDiscount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  selectVoucherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  selectVoucherText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.primary,
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  priceValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  discountText: {
    color: COLORS.success,
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
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  totalBottomLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  totalOriginal: {
    fontSize: 14,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginBottom: 2,
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
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  voucherInputSection: {
    backgroundColor: '#fff',
    padding: 20,
  },
  voucherInputLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 10,
    fontWeight: '600',
  },
  voucherInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  voucherInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  availableVouchersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: 20,
    paddingBottom: 10,
  },
  voucherList: {
    padding: 20,
    paddingTop: 10,
  },
  voucherItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voucherItemSelected: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.primaryLight,
  },
  voucherItemDisabled: {
    opacity: 0.5,
  },
  voucherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voucherIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  voucherCode: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  voucherDesc: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  voucherSave: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  voucherMinPurchase: {
    fontSize: 12,
    color: COLORS.warning,
  },
  textDisabled: {
    color: COLORS.lightGray,
  },
  emptyVouchers: {
    padding: 40,
    alignItems: 'center',
  },
  emptyVouchersText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});