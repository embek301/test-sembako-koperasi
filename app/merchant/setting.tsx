// app/merchant/settings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { merchantAPI } from '../../src/api/apiClient';
import { COLORS } from '../../src/utils/constants';
import { useAuth } from '../../src/context/AuthContext';

export default function MerchantSettingsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
  });

  useEffect(() => {
    loadMerchantProfile();
  }, []);

  const loadMerchantProfile = async () => {
    setLoading(true);
    try {
      const response = await merchantAPI.getProfile();
      if (response.data.success) {
        const data = response.data.data;
        setFormData({
          store_name: data.store_name || '',
          store_description: data.store_description || '',
          bank_name: data.bank_name || '',
          bank_account_number: data.bank_account_number || '',
          bank_account_name: data.bank_account_name || '',
        });
      }
    } catch (error) {
      console.error('Error loading merchant profile:', error);
      Alert.alert('Error', 'Failed to load store settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.store_name.trim()) {
      Alert.alert('Error', 'Store name is required');
      return;
    }

    if (!formData.bank_name.trim() || !formData.bank_account_number.trim()) {
      Alert.alert('Error', 'Bank information is required');
      return;
    }

    setSaving(true);
    try {
      const response = await merchantAPI.updateProfile(formData);

      if (response.data.success) {
        Alert.alert('Success', 'Store settings updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating settings:', error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join('\n');
        Alert.alert('Validation Error', errorMessages);
      } else {
        const message = error.response?.data?.message || 'Failed to update settings';
        Alert.alert('Error', message);
      }
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
        {/* Verification Status */}
        <View style={[
          styles.statusCard,
          { backgroundColor: user?.is_verified ? '#E8F5E9' : '#FFF3E0' }
        ]}>
          <Ionicons
            name={user?.is_verified ? 'checkmark-circle' : 'time'}
            size={32}
            color={user?.is_verified ? '#4CAF50' : '#FF9800'}
          />
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {user?.is_verified ? 'Verified Merchant' : 'Pending Verification'}
            </Text>
            <Text style={styles.statusText}>
              {user?.is_verified
                ? 'Your store is verified and active'
                : 'Your account is being reviewed by admin'}
            </Text>
          </View>
        </View>

        {/* Store Information */}
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
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Bank Information */}
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
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 15,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusContent: {
    flex: 1,
    marginLeft: 15,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});