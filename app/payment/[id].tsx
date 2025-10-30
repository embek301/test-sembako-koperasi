import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { paymentAPI } from '../../src/api/apiClient';
import { COLORS } from '../../src/utils/constants';

export default function PaymentScreen() {
  const { id } = useLocalSearchParams();
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createPayment();
  }, [id]);

  const createPayment = async () => {
    try {
      const response = await paymentAPI.create({ order_id: id });
      if (response.data.success) {
        setSnapToken(response.data.data.snap_token);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize payment', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    if (navState.url.includes('finish') || navState.url.includes('success')) {
      Alert.alert('Payment Success', 'Your payment has been processed!', [
        { text: 'OK', onPress: () => router.push(`/order/${id}` as any) },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!snapToken) return null;

  const paymentUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;

  return (
    <WebView
      source={{ uri: paymentUrl }}
      onNavigationStateChange={handleNavigationStateChange}
      startInLoadingState
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});