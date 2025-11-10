
// ========================================
// app/merchant/settings.tsx
// ========================================
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { merchantAPI } from '../../src/api/apiClient';
import { COLORS } from '../../src/utils/constants';
import { formatPrice } from '../../src/utils/formatters';

export function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await merchantAPI.getProfile();
      if (response.data.success) {
        const profile = response.data.data;
        setFormData({
          store_name: profile.store_name || '',
          store_description: profile.store_description || '',
          bank_name: profile.bank_name || '',
          bank_account_number: profile.bank_account_number || '',
          bank_account_name: profile.bank_account_name || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.store_name.trim()) {
      Alert.alert('Error', 'Store name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await merchantAPI.updateProfile(formData);
      
      if (response.data.success) {
        Alert.alert('Success', 'Store settings updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Store Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.store_name}
              onChangeText={(text) => setFormData({ ...formData, store_name: text })}
              placeholder="Enter store name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.store_description}
              onChangeText={(text) => setFormData({ ...formData, store_description: text })}
              placeholder="Describe your store"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Bank Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.bank_name}
              onChangeText={(text) => setFormData({ ...formData, bank_name: text })}
              placeholder="e.g., BCA, Mandiri"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.bank_account_number}
              onChangeText={(text) => setFormData({ ...formData, bank_account_number: text })}
              placeholder="Account number"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Holder Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.bank_account_name}
              onChangeText={(text) => setFormData({ ...formData, bank_account_name: text })}
              placeholder="Account holder name"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 15 },
  balanceCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 24, margin: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  balanceTitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  balanceDetails: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  balanceDetailItem: { flex: 1 },
  balanceDetailLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 5 },
  balanceDetailValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  withdrawButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 14, borderRadius: 10 },
  withdrawButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 15, margin: 15, marginTop: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: COLORS.gray, marginTop: 10 },
  withdrawalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  withdrawalLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  withdrawalIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  withdrawalAmount: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  withdrawalDate: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  paymentItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  paymentLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  paymentIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  paymentOrder: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  paymentDate: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  paymentMethod: { fontSize: 11, color: COLORS.lightGray, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  modalBody: { padding: 20 },
  availableText: { fontSize: 14, color: COLORS.gray, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  amountInput: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 15, fontSize: 20, fontWeight: 'bold', borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  hint: { fontSize: 12, color: COLORS.gray, marginBottom: 20 },
  confirmButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 8, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonDisabled: { backgroundColor: COLORS.gray },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  textArea: { height: 80, paddingTop: 12 },
  saveButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 8, marginBottom: 20 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});