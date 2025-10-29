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
import * as Clipboard from 'expo-clipboard';
import { orderAPI, paymentAPI } from '../../src/api/apiClient';

const PAYMENT_METHODS = [
  {
    id: 'bank_transfer',
    name: 'Transfer Bank',
    icon: 'card-outline',
    banks: [
      { code: 'bca', name: 'BCA', account: '1234567890' },
      { code: 'mandiri', name: 'Mandiri', account: '0987654321' },
      { code: 'bni', name: 'BNI', account: '1122334455' },
    ],
  },
  {
    id: 'ewallet',
    name: 'E-Wallet',
    icon: 'wallet-outline',
    options: ['GoPay', 'OVO', 'DANA', 'ShopeePay'],
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    icon: 'cash-outline',
  },
];

export default function PaymentScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await orderAPI.getById(Number(id));
      const orderData = response.data.data || response.data;
      setOrder(orderData);

      // Check payment status
      if (orderData.status !== 'pending') {
        Alert.alert(
          'Info',
          'Pesanan ini sudah diproses',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccount = async (account: string) => {
    await Clipboard.setStringAsync(account);
    Alert.alert('Berhasil', 'Nomor rekening berhasil disalin');
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Pilih metode pembayaran terlebih dahulu');
      return;
    }

    if (selectedMethod === 'bank_transfer' && !selectedBank) {
      Alert.alert('Error', 'Pilih bank terlebih dahulu');
      return;
    }

    Alert.alert(
      'Konfirmasi Pembayaran',
      selectedMethod === 'cod'
        ? 'Anda akan membayar saat pesanan diterima'
        : 'Lanjutkan pembayaran?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Lanjut',
          onPress: async () => {
            setProcessing(true);
            try {
              const paymentData = {
                order_id: Number(id),
                payment_method: selectedMethod,
                ...(selectedBank && { bank_code: selectedBank.code }),
              };

              await paymentAPI.create(paymentData);

              Alert.alert(
                'Berhasil',
                selectedMethod === 'cod'
                  ? 'Pesanan akan segera diproses'
                  : 'Silakan lakukan pembayaran sesuai instruksi',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (selectedMethod === 'cod') {
                        router.replace('/(tabs)/orders');
                      } else {
                        router.replace(`/payment/instruction/${id}`);
                      }
                    },
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Pembayaran gagal'
              );
            } finally {
              setProcessing(false);
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
        <Text style={styles.headerTitle}>Pembayaran</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order Summary */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>Order #{order.id}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Menunggu Pembayaran</Text>
            </View>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalAmount}>
              Rp {order.total?.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih Metode Pembayaran</Text>

          {PAYMENT_METHODS.map((method) => (
            <View key={method.id} style={styles.methodContainer}>
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.methodCardActive,
                ]}
                onPress={() => {
                  setSelectedMethod(method.id);
                  setSelectedBank(null);
                }}
              >
                <View style={styles.methodLeft}>
                  <View
                    style={[
                      styles.methodIcon,
                      selectedMethod === method.id && styles.methodIconActive,
                    ]}
                  >
                    <Ionicons
                      name={method.icon as any}
                      size={24}
                      color={
                        selectedMethod === method.id ? '#007AFF' : '#8E8E93'
                      }
                    />
                  </View>
                  <Text style={styles.methodName}>{method.name}</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selectedMethod === method.id && styles.radioOuterActive,
                  ]}
                >
                  {selectedMethod === method.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Bank Options */}
              {selectedMethod === method.id && method.banks && (
                <View style={styles.bankOptions}>
                  {method.banks.map((bank) => (
                    <TouchableOpacity
                      key={bank.code}
                      style={[
                        styles.bankCard,
                        selectedBank?.code === bank.code && styles.bankCardActive,
                      ]}
                      onPress={() => setSelectedBank(bank)}
                    >
                      <View style={styles.bankInfo}>
                        <Text style={styles.bankName}>{bank.name}</Text>
                        <View style={styles.accountContainer}>
                          <Text style={styles.accountNumber}>{bank.account}</Text>
                          <TouchableOpacity
                            onPress={() => handleCopyAccount(bank.account)}
                          >
                            <Ionicons name="copy-outline" size={16} color="#007AFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          selectedBank?.code === bank.code &&
                            styles.radioOuterActive,
                        ]}
                      >
                        {selectedBank?.code === bank.code && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* E-Wallet Options */}
              {selectedMethod === method.id && method.options && (
                <View style={styles.bankOptions}>
                  <Text style={styles.infoText}>
                    Anda akan diarahkan ke aplikasi e-wallet setelah konfirmasi
                  </Text>
                </View>
              )}

              {/* COD Info */}
              {selectedMethod === method.id && method.id === 'cod' && (
                <View style={styles.bankOptions}>
                  <Text style={styles.infoText}>
                    Bayar saat pesanan diterima. Pastikan uang pas tersedia.
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotal}>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomAmount}>
            Rp {order.total?.toLocaleString('id-ID')}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedMethod ||
              (selectedMethod === 'bank_transfer' && !selectedBank) ||
              processing) &&
              styles.buttonDisabled,
          ]}
          onPress={handlePayment}
          disabled={
            !selectedMethod ||
            (selectedMethod === 'bank_transfer' && !selectedBank) ||
            processing
          }
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Bayar Sekarang</Text>
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
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  methodContainer: {
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIconActive: {
    backgroundColor: '#E3F2FD',
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  bankOptions: {
    marginTop: 8,
    paddingLeft: 16,
  },
  bankCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  bankCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  accountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountNumber: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  bottomBar: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  bottomTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bottomLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bottomAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});