// ========================================
// app/merchant/payments.tsx
// ========================================
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { merchantAPI } from "../../src/api/apiClient";
import { COLORS } from "../../src/utils/constants";
import { formatPrice } from "../../src/utils/formatters";
export function PaymentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await merchantAPI.getPayments();
      if (response.data.success) {
        setPayments(response.data.data.data || response.data.data);
      }
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>

          {payments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={48}
                color={COLORS.lightGray}
              />
              <Text style={styles.emptyText}>No payment history</Text>
            </View>
          ) : (
            payments.map((item) => (
              <View key={item.id} style={styles.paymentItem}>
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentIcon}>
                    <Ionicons name="card" size={24} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.paymentOrder}>
                      Order #{item.order_number}
                    </Text>
                    <Text style={styles.paymentDate}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    <Text style={styles.paymentMethod}>
                      {item.payment_method}
                    </Text>
                  </View>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>
                    {formatPrice(item.amount)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.status === "success"
                            ? COLORS.success
                            : COLORS.warning,
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 15 },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    margin: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  balanceTitle: { fontSize: 16, color: "rgba(255,255,255,0.9)" },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  balanceDetails: { flexDirection: "row", gap: 20, marginBottom: 20 },
  balanceDetailItem: { flex: 1 },
  balanceDetailLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 5,
  },
  balanceDetailValue: { fontSize: 16, fontWeight: "600", color: "#fff" },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    margin: 15,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
  },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: COLORS.gray, marginTop: 10 },
  withdrawalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  withdrawalLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  withdrawalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  withdrawalAmount: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  withdrawalDate: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, color: "#fff", fontWeight: "bold" },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  paymentLeft: { flexDirection: "row", gap: 12, flex: 1 },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentOrder: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  paymentDate: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  paymentMethod: { fontSize: 11, color: COLORS.lightGray, marginTop: 2 },
  paymentRight: { alignItems: "flex-end" },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text },
  modalBody: { padding: 20 },
  availableText: { fontSize: 14, color: COLORS.gray, marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
    fontSize: 20,
    fontWeight: "bold",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  hint: { fontSize: 12, color: COLORS.gray, marginBottom: 20 },
  confirmButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  buttonDisabled: { backgroundColor: COLORS.gray },
  inputGroup: { marginBottom: 15 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { height: 80, paddingTop: 12 },
  saveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
