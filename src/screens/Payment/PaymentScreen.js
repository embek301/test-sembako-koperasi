// src/screens/Payment/PaymentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { paymentAPI } from '../../api/apiClient';

const PaymentScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [snapToken, setSnapToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createPayment();

    // Handle back button
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandler.remove();
  }, []);

  const createPayment = async () => {
    try {
      const response = await paymentAPI.create({ order_id: orderId });
      
      if (response.data.success) {
        setSnapToken(response.data.data.snap_token);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      Alert.alert('Error', 'Failed to initialize payment', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => navigation.navigate('OrderDetail', { orderId }),
        },
      ]
    );
    return true;
  };

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;

    // Check if payment is finished
    if (url.includes('finish') || url.includes('success')) {
      Alert.alert(
        'Payment Success',
        'Your payment has been processed successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('OrderDetail', { orderId }),
          },
        ]
      );
    } else if (url.includes('error') || url.includes('failure')) {
      Alert.alert(
        'Payment Failed',
        'Your payment could not be processed. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              setLoading(true);
              createPayment();
            },
          },
          {
            text: 'Cancel',
            onPress: () => navigation.navigate('OrderDetail', { orderId }),
          },
        ]
      );
    } else if (url.includes('unfinish') || url.includes('pending')) {
      Alert.alert(
        'Payment Pending',
        'Please complete your payment to proceed.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('OrderDetail', { orderId }),
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!snapToken) {
    return null;
  }

  // Midtrans Snap payment URL
  const paymentUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default PaymentScreen;