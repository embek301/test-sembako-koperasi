import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { addressAPI, cartAPI, orderAPI, voucherAPI } from '../src/api/apiClient';

export default function CheckoutScreen() {
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cartRes, addressesRes] = await Promise.all([
        cartAPI.getCart(),
        addressAPI.getAll(),
      ]);

      const cart = cartRes.data.data || cartRes.data;
      const addr = addressesRes.data.data || addressesRes.data;

      setCartItems(cart);
      setAddresses(addr);
      
      // Set default address
      const defaultAddr = addr.find((a: any) => a.is_default);
      setSelectedAddress(defaultAddr || addr[0]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;

    try {
      const response = await voucherAPI.validate({
        code: voucherCode,
        total: calculateSubtotal(),
      });

      setAppliedVoucher(response.data.data || response.data);
      Alert.alert('Berhasil', 'Voucher berhasil diterapkan');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Voucher tidak valid');
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    );
  };

  const calculateDiscount = () => {
    if (!appliedVoucher) return 0;
    
    const subtotal = calculateSubtotal();
    if (appliedVoucher.type === 'percentage') {
      return (subtotal * appliedVoucher.value) / 100;
    }
    return appliedVoucher.value;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const shipping = 15000; // Fixed shipping cost
    return subtotal - discount + shipping;
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Pilih alamat pengiriman terlebih dahulu');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Keranjang kosong');
      return;
    }

    Alert.alert(
      'Konfirmasi Pesanan',
      'Lanjutkan ke pembayaran?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Lanjut',
          onPress: async () => {
            setSubmitting(true);
            try {
              const orderData = {
                address_id: selectedAddress.id,
                notes,
                voucher_code: appliedVoucher?.code,
                items: cartItems.map((item: any) => ({
                  product_id: item.product_id,
                  quantity: item.quantity,
                  price: item.price,
                })),
              };

              const response = await orderAPI.create(orderData);
              const order = response.data.data || response.data;

              Alert.alert('Berhasil', 'Pesanan berhasil dibuat', [
                {
                  text: 'OK',
                  onPress: () => router.replace(`/payment/${order.id}`),
                },
              ]);
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Gagal membuat pesanan'
              );
            } finally {
              setSubmitting(false);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Shipping Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
            <TouchableOpacity
              onPress={() => (router as any).push('/profile/addresses')}
            >
              <Text style={styles.changeText}>Ubah</Text>
            </TouchableOpacity>
          </View>
          {selectedAddress ? (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressName}>{selectedAddress.name}</Text>
                {selectedAddress.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
              <Text style={styles.addressDetail}>
                {selectedAddress.address}, {selectedAddress.city},{' '}
                {selectedAddress.province} {selectedAddress.postal_code}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => (router as any).push('/profile/addresses/new')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
              <Text style={styles.addAddressText}>Tambah Alamat</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pesanan ({cartItems.length} item)</Text>
          {cartItems.map((item: any) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.product?.name || item.name}
              </Text>
              <View style={styles.itemFooter}>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Voucher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voucher</Text>
          <View style={styles.voucherContainer}>
            <TextInput
              style={styles.voucherInput}
              placeholder="Masukkan kode voucher"
              value={voucherCode}
              onChangeText={setVoucherCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyVoucher}
            >
              <Text style={styles.applyButtonText}>Pakai</Text>
            </TouchableOpacity>
          </View>
          {appliedVoucher && (
            <View style={styles.appliedVoucher}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.appliedVoucherText}>
                Voucher {appliedVoucher.code} diterapkan
              </Text>
              <TouchableOpacity onPress={() => setAppliedVoucher(null)}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catatan (Opsional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Tambahkan catatan untuk penjual"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>
              Rp {calculateSubtotal().toLocaleString('id-ID')}
            </Text>
          </View>
          {appliedVoucher && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Diskon</Text>
              <Text style={[styles.priceValue, { color: '#34C759' }]}>
                -Rp {calculateDiscount().toLocaleString('id-ID')}
              </Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Ongkir</Text>
            <Text style={styles.priceValue}>Rp 15.000</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              Rp {calculateTotal().toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.bottomTotal}>Total</Text>
          <Text style={styles.bottomTotalValue}>
            Rp {calculateTotal().toLocaleString('id-ID')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutButton, submitting && styles.buttonDisabled]}
          onPress={handleCheckout}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutButtonText}>Buat Pesanan</Text>
          )}
        </TouchableOpacity>
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  changeText: {
    fontSize: 14,
    color: '#007AFF',
  },
  addressCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
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
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    gap: 8,
  },
  addAddressText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#8E8E93',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  voucherContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  voucherInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  appliedVoucher: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    gap: 8,
  },
  appliedVoucherText: {
    flex: 1,
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
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
  bottomBar: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bottomTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bottomTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});