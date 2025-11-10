// app/(merchant)/balance.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { merchantAPI } from '../../src/api/apiClient';
import { COLORS } from '../../src/utils/constants';
import { formatPrice, formatDate } from '../../src/utils/formatters';
import { useAuth } from '../../src/context/AuthContext';

export default function MerchantBalanceScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceRes, withdrawalsRes] = await Promise.all([
        merchantAPI.getBalance(),
        merchantAPI.getWithdrawals(),
      ]);

      if (balanceRes.data.success) {
        setBalance(balanceRes.data.data);
      }

      if (withdrawalsRes.data.success) {
        setWithdrawals(withdrawalsRes.data.data.data || withdrawalsRes.data.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load balance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRequestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount < 50000) {
      Alert.alert('Error', 'Minimum withdrawal is Rp 50,000');
      return;
    }

    if (amount > balance.available_balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setRequesting(true);
    try {
      const response = await merchantAPI.requestWithdrawal({
        amount,
        notes: withdrawNotes,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Withdrawal request submitted successfully');
        setModalVisible(false);
        setWithdrawAmount('');
        setWithdrawNotes('');
        loadData();
      }
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to request withdrawal');
    } finally {
      setRequesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: '#FF9800',
      processing: '#2196F3',
      completed: '#4CAF50',
      rejected: '#F44336',
    };
    return colors[status] || COLORS.gray;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatPrice(balance?.available_balance || 0)}
        </Text>

        <View style={styles.balanceDetails}>
          <View style={styles.balanceDetailItem}>
            <Text style={styles.balanceDetailLabel}>Total Earnings</Text>
            <Text style={styles.balanceDetailValue}>
              {formatPrice(balance?.total_earnings || 0)}
            </Text>
          </View>
          <View style={styles.balanceDetailItem}>
            <Text style={styles.balanceDetailLabel}>Withdrawn</Text>
            <Text style={styles.balanceDetailValue}>
              {formatPrice(balance?.withdrawn_amount || 0)}
            </Text>
          </View>
          <View style={styles.balanceDetailItem}>
            <Text style={styles.balanceDetailLabel}>Pending</Text>
            <Text style={styles.balanceDetailValue}>
              {formatPrice(balance?.pending_withdrawal || 0)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={() => setModalVisible(true)}
          disabled={!balance || balance.available_balance < 50000}>
          <Ionicons name="cash-outline" size={20} color="#fff" />
          <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
        </TouchableOpacity>

        {balance && balance.available_balance < 50000 && (
          <Text style={styles.minBalanceText}>
            Minimum balance for withdrawal: Rp 50,000
          </Text>
        )}
      </View>

      {/* Bank Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Account</Text>
        <View style={styles.bankCard}>
          <View style={styles.bankIcon}>
            <Ionicons name="card" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.bankInfo}>
            <Text style={styles.bankName}>{user?.bank_name}</Text>
            <Text style={styles.accountNumber}>{user?.bank_account_number}</Text>
            <Text style={styles.accountName}>{user?.bank_account_name}</Text>
          </View>
        </View>
      </View>

      {/* Withdrawal History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Withdrawal History</Text>
        
        {withdrawals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={48} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No withdrawal history</Text>
          </View>
        ) : (
          withdrawals.map((item) => (
            <View key={item.id} style={styles.withdrawalItem}>
              <View style={styles.withdrawalHeader}>
                <Text style={styles.withdrawalAmount}>
                  {formatPrice(item.amount)}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) }
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.withdrawalDate}>
                {formatDate(item.created_at)}
              </Text>
              
              {item.notes && (
                <Text style={styles.withdrawalNotes}>{item.notes}</Text>
              )}
              
              {item.reject_reason && (
                <View style={styles.rejectReasonBox}>
                  <Ionicons name="alert-circle" size={16} color="#F44336" />
                  <Text style={styles.rejectReasonText}>{item.reject_reason}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Withdrawal Request Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Withdrawal</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.availableBalanceBox}>
              <Text style={styles.availableBalanceLabel}>Available Balance</Text>
              <Text style={styles.availableBalanceAmount}>
                {formatPrice(balance?.available_balance || 0)}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Withdrawal Amount *</Text>
              <TextInput
                style={styles.input}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="50000"
                keyboardType="numeric"
              />
              <Text style={styles.hint}>Minimum: Rp 50,000</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={withdrawNotes}
                onChangeText={setWithdrawNotes}
                placeholder="Add notes..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.bankInfoBox}>
              <Text style={styles.bankInfoTitle}>Transfer to:</Text>
              <Text style={styles.bankInfoText}>
                {user?.bank_name} - {user?.bank_account_number}
              </Text>
              <Text style={styles.bankInfoText}>{user?.bank_account_name}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, requesting && styles.submitButtonDisabled]}
              onPress={handleRequestWithdrawal}
              disabled={requesting}>
              {requesting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

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
  balanceCard: {
    backgroundColor: COLORS.primary,
    margin: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceDetailItem: {
    alignItems: 'center',
  },
  balanceDetailLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  balanceDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  withdrawButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  minBalanceText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 10,
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  bankCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 3,
  },
  accountNumber: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 2,
  },
  accountName: {
    fontSize: 13,
    color: COLORS.gray,
  },
  withdrawalItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  withdrawalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  withdrawalDate: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 5,
  },
  withdrawalNotes: {
    fontSize: 13,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  rejectReasonBox: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  rejectReasonText: {
    flex: 1,
    fontSize: 13,
    color: '#F44336',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 10,
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
    flex: 1,
    padding: 15,
  },
  availableBalanceBox: {
    backgroundColor: COLORS.primaryLight,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  availableBalanceLabel: {
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 5,
  },
  availableBalanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 5,
  },
  bankInfoBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  bankInfoTitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 8,
  },
  bankInfoText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 3,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});