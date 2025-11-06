// app/payment/[id].tsx
import React, { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, Alert, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { WebView } from "react-native-webview";
import { paymentAPI, orderAPI } from "../../src/api/apiClient";
import { COLORS } from "../../src/utils/constants";
import { useNotifications } from "../../src/context/NotificationContext";

export default function PaymentScreen() {
  const { id } = useLocalSearchParams();
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // ← TAMBAH REF untuk prevent double check
  const hasChecked = useRef(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { sendPaymentNotification, sendOrderNotification } = useNotifications();

  useEffect(() => {
    if (id) {
      verifyAndCreatePayment();
    }

    // ← CLEANUP on unmount
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [id]);

  const verifyAndCreatePayment = async () => {
    try {
      console.log("📋 Verifying order:", id);

      const orderId = Number(id);

      if (isNaN(orderId)) {
        throw new Error("Invalid order ID");
      }

      const orderResponse = await orderAPI.getById(orderId);

      if (!orderResponse.data.success) {
        throw new Error("Order not found");
      }

      const order = orderResponse.data.data;
      console.log("📦 Order status:", order.status);
      console.log("💳 Payment method:", order.payment_method);

      if (order.status !== "pending") {
        Alert.alert(
          "Cannot Process Payment",
          `Order status is ${order.status}. Only pending orders can be paid.`,
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }

      if (order.payment_method !== "midtrans") {
        Alert.alert(
          "Invalid Payment Method",
          "This order uses Cash on Delivery payment.",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }

      console.log("💰 Creating payment for order:", orderId);

      const paymentResponse = await paymentAPI.create({ order_id: orderId });

      console.log("✅ Payment response:", paymentResponse.data);

      if (paymentResponse.data.success) {
        const token = paymentResponse.data.data.snap_token;

        if (!token) {
          throw new Error("No snap token received from server");
        }

        console.log("🎫 Snap token received");
        setSnapToken(token);
      } else {
        throw new Error(
          paymentResponse.data.message || "Failed to create payment"
        );
      }
    } catch (error: any) {
      console.error("❌ Payment creation error:", error);

      let errorMessage = "Failed to initialize payment";

      if (error.response?.status === 500) {
        errorMessage = error.response?.data?.message || "Server error occurred";
      } else if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.errors;
        errorMessage =
          "Validation error:\n" + JSON.stringify(validationErrors, null, 2);
      } else {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to initialize payment";
      }

      setError(errorMessage);

      Alert.alert("Payment Error", errorMessage, [
        {
          text: "Go Back",
          onPress: () => router.back(),
        },
        {
          text: "Retry",
          onPress: () => {
            setError(null);
            setLoading(true);
            verifyAndCreatePayment();
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    // ← CRITICAL: Check if already checked
    if (hasChecked.current || isCheckingStatus) {
      console.log("⚠️ Already checking or checked, skipping...");
      return;
    }

    hasChecked.current = true;
    setIsCheckingStatus(true);

    console.log("🔍 Starting payment status check...");

    let attempts = 0;
    const maxAttempts = 5;

    const checkInterval = setInterval(async () => {
      attempts++;
      console.log(
        `🔍 Checking payment status - Attempt ${attempts}/${maxAttempts}`
      );

      try {
        const orderId = Number(id);
        
        // ← Get BOTH payment status AND order details
        const [statusResponse, orderResponse] = await Promise.all([
          paymentAPI.checkStatus(orderId),
          orderAPI.getById(orderId)
        ]);

        console.log("💳 Payment status response:", statusResponse.data);
        console.log("📦 Order details response:", orderResponse.data);

        if (statusResponse.data.success && orderResponse.data.success) {
          const statusData = statusResponse.data.data;
          const orderData = orderResponse.data.data;

          // Check if payment is successful
          if (
            statusData.payment_status === "paid" ||
            statusData.order_status === "paid" ||
            statusData.payment?.status === "success"
          ) {
            clearInterval(checkInterval);
            setIsCheckingStatus(false);

            // ← GET TOTAL PRICE FROM ORDER DATA
            const totalPrice = orderData.total_price || 0;
            const orderNumber = orderData.order_number || id.toString();

            const paymentMethod = statusData.payment?.payment_type
              ? statusData.payment.payment_type.replace("_", " ").toUpperCase()
              : "Online Payment";

            console.log("✅ Payment confirmed!");
            console.log("💰 Total Price:", totalPrice);
            console.log("🔖 Order Number:", orderNumber);
            console.log("💳 Payment Method:", paymentMethod);

            // ← Send notifications with correct data
            await sendPaymentNotification(totalPrice, "success");
            await sendOrderNotification(orderNumber, "paid");

            // ← Show alert ONCE
            Alert.alert(
              "✅ Payment Success!",
              `Your payment has been confirmed!\n\nOrder: #${orderNumber}\nTotal: Rp ${totalPrice.toLocaleString("id-ID")}\nMethod: ${paymentMethod}`,
              [
                {
                  text: "View Order",
                  onPress: () => {
                    // ← Clear interval and navigate
                    clearInterval(checkInterval);
                    router.replace(`/order/${id}`);
                  },
                },
              ],
              { cancelable: false } // ← Prevent dismissing by tapping outside
            );
            return;
          }

          // If max attempts reached and still pending
          if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            setIsCheckingStatus(false);

            Alert.alert(
              "⏳ Payment Processing",
              "Your payment is being processed. Please check your order status in a few moments.",
              [
                {
                  text: "View Order",
                  onPress: () => router.replace(`/order/${id}`),
                },
              ]
            );
          }
        }
      } catch (error) {
        console.error("❌ Error checking payment status:", error);

        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setIsCheckingStatus(false);

          Alert.alert(
            "❓ Payment Status Unknown",
            "Unable to verify payment status. Please check your order list.",
            [
              {
                text: "View Orders",
                onPress: () => router.replace("/(tabs)/orders"),
              },
            ]
          );
        }
      }
    }, 3000); // Check every 3 seconds

    // ← Store interval ref for cleanup
    checkTimeoutRef.current = checkInterval as any;
  };

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;
    console.log("🌐 WebView URL:", url);

    // ← Check for success URLs
    const isSuccess =
      url.includes("finish") ||
      url.includes("success") ||
      url.includes("status_code=200") ||
      url.includes("transaction_status=settlement") ||
      url.includes("transaction_status=capture");

    const isUnfinish = url.includes("unfinish");
    const isError = url.includes("error");

    if (isSuccess) {
      console.log("✅ Payment completed - checking status...");

      // ← Only check if not already checking/checked
      if (!hasChecked.current && !isCheckingStatus) {
        checkPaymentStatus();
      } else {
        console.log("⚠️ Already processing payment check");
      }
    } else if (isUnfinish) {
      console.log("⚠️ Payment unfinished");

      // ← Reset check flag
      hasChecked.current = false;

      Alert.alert(
        "Payment Incomplete",
        "Your payment was not completed. The order is still pending.",
        [
          {
            text: "Back to Order",
            onPress: () => router.replace(`/order/${id}`),
          },
        ]
      );
    } else if (isError) {
      console.log("❌ Payment error");

      // ← Reset check flag
      hasChecked.current = false;

      Alert.alert(
        "Payment Error",
        "There was an error processing your payment.",
        [
          {
            text: "Try Again",
            onPress: () => router.back(),
          },
        ]
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
        <Text style={styles.errorText}>
          {error || "Failed to load payment"}
        </Text>
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
          console.error("❌ WebView error:", nativeEvent);
        }}
        // ← TAMBAH: Prevent multiple WebView instances
        onShouldStartLoadWithRequest={(request) => {
          console.log("🔗 Should load:", request.url);
          return true;
        }}
      />

      {/* Overlay saat checking status */}
      {isCheckingStatus && (
        <View style={styles.checkingOverlay}>
          <View style={styles.checkingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.checkingText}>Verifying payment status...</Text>
            <Text style={styles.checkingSubtext}>Please wait a moment</Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 20,
  },
  checkingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkingCard: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    minWidth: 250,
  },
  checkingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  checkingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: COLORS.gray,
  },
});