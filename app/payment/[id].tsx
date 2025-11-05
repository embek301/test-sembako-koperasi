import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { paymentAPI, orderAPI } from '../../src/api/apiClient';
import { COLORS } from '../../src/utils/constants';
import { useNotifications } from '../../src/context/NotificationContext';
export default function PaymentScreen() {
  const { id } = useLocalSearchParams();
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
const { sendPaymentNotification, sendOrderNotification } = useNotifications();  
  useEffect(() => {
    if (id) {
      verifyAndCreatePayment();
    }
  }, [id]);

  const verifyAndCreatePayment = async () => {
    try {
      console.log('📋 Verifying order:', id);
      
      const orderId = Number(id);
      
      if (isNaN(orderId)) {
        throw new Error('Invalid order ID');
      }

      const orderResponse = await orderAPI.getById(orderId);
      
      if (!orderResponse.data.success) {
        throw new Error('Order not found');
      }

      const order = orderResponse.data.data;
      console.log('📦 Order status:', order.status);
      console.log('💳 Payment method:', order.payment_method);

      if (order.status !== 'pending') {
        Alert.alert(
          'Cannot Process Payment',
          `Order status is ${order.status}. Only pending orders can be paid.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      if (order.payment_method !== 'midtrans') {
        Alert.alert(
          'Invalid Payment Method',
          'This order uses Cash on Delivery payment.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      console.log('💰 Creating payment for order:', orderId);
      
      const paymentResponse = await paymentAPI.create({ order_id: orderId });
      
      console.log('✅ Payment response:', paymentResponse.data);
      
      if (paymentResponse.data.success) {
        const token = paymentResponse.data.data.snap_token;
        
        if (!token) {
          throw new Error('No snap token received from server');
        }
        
        console.log('🎫 Snap token received');
        setSnapToken(token);
      } else {
        throw new Error(paymentResponse.data.message || 'Failed to create payment');
      }
      
    } catch (error: any) {
      console.error('❌ Payment creation error:', error);
      
      let errorMessage = 'Failed to initialize payment';
      
      if (error.response?.status === 500) {
        errorMessage = error.response?.data?.message || 'Server error occurred';
      } else if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.errors;
        errorMessage = 'Validation error:\n' + 
          JSON.stringify(validationErrors, null, 2);
      } else {
        errorMessage = error.response?.data?.message || 
                      error.message || 
                      'Failed to initialize payment';
      }
      
      setError(errorMessage);
      
      Alert.alert('Payment Error', errorMessage, [
        { 
          text: 'Go Back', 
          onPress: () => router.back() 
        },
        {
          text: 'Retry',
          onPress: () => {
            setError(null);
            setLoading(true);
            verifyAndCreatePayment();
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (isCheckingStatus) return; // Prevent multiple simultaneous checks
    
    setIsCheckingStatus(true);
    let attempts = 0;
    const maxAttempts = 5;
    
    const checkInterval = setInterval(async () => {
      attempts++;
      console.log(`🔍 Checking payment status - Attempt ${attempts}/${maxAttempts}`);
      
      try {
        const orderId = Number(id);
        const response = await paymentAPI.checkStatus(orderId);
        
        console.log('💳 Payment status response:', response.data);
        
        if (response.data.success) {
          const data = response.data.data;
          
          // Check if payment is successful
          if (data.payment_status === 'paid' || 
              data.order_status === 'paid' ||
              data.payment?.status === 'success') {
            await sendPaymentNotification(data.total_price || 0, 'success');
            await sendOrderNotification(data.order_number || id.toString(), 'paid');
            clearInterval(checkInterval);
            setIsCheckingStatus(false);
            
            const paymentMethod = data.payment?.payment_type 
              ? data.payment.payment_type.replace('_', ' ').toUpperCase()
              : 'Online Payment';
            
            console.log('✅ Payment confirmed! Method:', paymentMethod);
            
            Alert.alert(
              '✅ Payment Success!',
              `Your payment has been confirmed!\n\nPayment Method: ${paymentMethod}`,
              [{ 
                text: 'View Order', 
                onPress: () => router.replace(`/order/${id}`)
              }]
            );
            return;
          }
          
          // If max attempts reached and still pending
          if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            setIsCheckingStatus(false);
            
            Alert.alert(
              '⏳ Payment Processing',
              'Your payment is being processed. Please check your order status in a few moments.',
              [{ 
                text: 'View Order', 
                onPress: () => router.replace(`/order/${id}`)
              }]
            );
          }
        }
      } catch (error) {
        console.error('❌ Error checking payment status:', error);
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setIsCheckingStatus(false);
          
          Alert.alert(
            '❓ Payment Status Unknown',
            'Unable to verify payment status. Please check your order list.',
            [{ 
              text: 'View Orders', 
              onPress: () => router.replace('/(tabs)/orders')
            }]
          );
        }
      }
    }, 3000); // Check every 3 seconds
  };

 const handleNavigationStateChange = (navState: any) => {
  const url = navState.url;
  console.log('🌐 WebView URL:', url);
  
  // Midtrans success page patterns
  if (url.includes('finish') || 
      url.includes('success') ||
      url.includes('status_code=200') ||
      url.includes('transaction_status=settlement') ||
      url.includes('transaction_status=capture')) {
    
    console.log('✅ Payment completed - checking status...');
    
    // Prevent multiple checks
    if (!isCheckingStatus) {
      checkPaymentStatus();
    }
    
  } else if (url.includes('unfinish')) {
    console.log('⚠️ Payment unfinished');
    
    Alert.alert(
      'Payment Incomplete', 
      'Your payment was not completed. The order is still pending.', 
      [{ 
        text: 'Back to Order', 
        onPress: () => router.replace(`/order/${id}`)
      }]
    );
    
  } else if (url.includes('error')) {
    console.log('❌ Payment error');
    
    Alert.alert(
      'Payment Error', 
      'There was an error processing your payment.', 
      [{ 
        text: 'Try Again', 
        onPress: () => router.back()
      }]
    );
  }
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Preparing payment...</Text>
      </View>
    );
  }

  if (error || !snapToken) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Payment Error</Text>
        <Text style={styles.errorText}>{error || 'Failed to load payment'}</Text>
      </View>
    );
  }

  const paymentUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;

  return (
    <>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading payment page...</Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView error:', nativeEvent);
        }}
      />
      
      {/* Overlay saat checking status */}
      {isCheckingStatus && (
        <View style={styles.checkingOverlay}>
          <View style={styles.checkingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.checkingText}>
              Verifying payment status...
            </Text>
            <Text style={styles.checkingSubtext}>
              Please wait a moment
            </Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  checkingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkingCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 250,
  },
  checkingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  checkingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: COLORS.gray,
  },
});