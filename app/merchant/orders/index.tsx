// app/merchant/orders.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { merchantAPI } from '../../../src/api/apiClient'; // ✅ Use your API
import { COLORS } from '../../../src/utils/constants';
import { formatPrice, formatDate } from '../../../src/utils/formatters';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface MerchantOrder {
  id: number;
  order_number: string;
  user?: {
    id: number;
    name: string;
  };
  items: OrderItem[];
  total_price: number;
  merchant_status: 'pending' | 'approved' | 'rejected';
  status: string;
  created_at: string;
  cancel_reason?: string;
}

export default function MerchantOrdersScreen() {
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MerchantOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const response = await merchantAPI.getOrders({ status: filter });
      if (response.data.success) {
        setOrders(response.data.data.data || response.data.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleApprove = (order: MerchantOrder) => {
    Alert.alert(
      'Approve Order',
      `Confirm order #${order.order_number}?\n\nCustomer: ${order.user?.name}\nTotal: ${formatPrice(order.total_price)}\n\nBy approving, you commit to fulfill this order.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await merchantAPI.approveOrder(order.id);
              Alert.alert('Success', 'Order approved successfully');
              loadOrders();
            } catch (error: any) {
              console.error('Error approving order:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to approve order');
            }
          },
        },
      ]
    );
  };

  const handleReject = (order: MerchantOrder) => {
    setSelectedOrder(order);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    if (!selectedOrder) return;

    setProcessing(true);
    try {
      await merchantAPI.rejectOrder(selectedOrder.id, { reason: rejectReason });
      Alert.alert('Success', 'Order rejected successfully');
      setRejectModalVisible(false);
      setSelectedOrder(null);
      setRejectReason('');
      loadOrders();
    } catch (error: any) {
      console.error('Error rejecting order:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject order');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: COLORS.warning,
      approved: COLORS.success,
      rejected: COLORS.error,
    };
    return colors[status] || COLORS.gray;
  };

  const renderOrder = ({ item }: { item: MerchantOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>#{item.order_number}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.merchant_status) }]}>
          <Text style={styles.statusText}>{item.merchant_status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <Ionicons name="person-circle-outline" size={20} color={COLORS.gray} />
        <Text style={styles.customerName}>{item.user?.name || 'Unknown Customer'}</Text>
      </View>

      <View style={styles.orderItems}>
        <Text style={styles.itemsLabel}>Items:</Text>
        {item.items.map((orderItem, index) => (
          <Text key={index} style={styles.itemText}>
            • {orderItem.product_name} x{orderItem.quantity} = {formatPrice(orderItem.subtotal)}
          </Text>
        ))}
      </View>

      <View style={styles.orderTotal}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalValue}>{formatPrice(item.total_price)}</Text>
      </View>

      {item.merchant_status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item)}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item)}>
            <Ionicons name="close-circle" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.merchant_status === 'approved' && (
        <View style={styles.approvedBanner}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.approvedText}>✅ Order approved and ready for processing</Text>
        </View>
      )}

      {item.merchant_status === 'rejected' && item.cancel_reason && (
        <View style={styles.rejectBanner}>
          <Ionicons name="close-circle" size={20} color={COLORS.error} />
          <View style={styles.rejectTextContainer}>
            <Text style={styles.rejectLabel}>Rejected:</Text>
            <Text style={styles.rejectText}>{item.cancel_reason}</Text>
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>Manage your incoming orders</Text>
      </View>

      <View style={styles.filterContainer}>
        {(['pending', 'approved', 'rejected'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterButton, filter === status && styles.filterButtonActive]}
            onPress={() => setFilter(status)}>
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No {filter} orders</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'pending' 
                ? 'New orders will appear here' 
                : `You have no ${filter} orders yet`}
            </Text>
          </View>
        }
      />

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRejectModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reject Order</Text>
            <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {selectedOrder && (
              <View style={styles.orderInfo}>
                <Text style={styles.orderInfoTitle}>Order Details:</Text>
                <Text style={styles.orderInfoText}>Order: #{selectedOrder.order_number}</Text>
                <Text style={styles.orderInfoText}>Customer: {selectedOrder.user?.name}</Text>
                <Text style={styles.orderInfoText}>Total: {formatPrice(selectedOrder.total_price)}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Reason for Rejection *</Text>
            <Text style={styles.inputHint}>
              Explain to the customer why you cannot fulfill this order
            </Text>
            <TextInput
              style={styles.textArea}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Example: Out of stock, Cannot deliver to this area, etc."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, (!rejectReason.trim() || processing) && styles.buttonDisabled]}
              onPress={submitReject}
              disabled={!rejectReason.trim() || processing}>
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>Reject Order</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setRejectModalVisible(false)}
              disabled={processing}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.gray,
  },
  listContent: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  orderItems: {
    marginBottom: 12,
    paddingLeft: 5,
  },
  itemsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  itemText: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
    lineHeight: 20,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  approvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  approvedText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },
  rejectBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  rejectTextContainer: {
    flex: 1,
  },
  rejectLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 3,
  },
  rejectText: {
    fontSize: 13,
    color: COLORS.error,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray,
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  modalContent: {
    padding: 20,
  },
  orderInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  orderInfoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  orderInfoText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
  },
  inputHint: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 10,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 120,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: '600',
  },
});