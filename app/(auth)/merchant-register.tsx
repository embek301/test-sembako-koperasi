// app/(auth)/merchant-register.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { merchantAPI } from '../../src/api/apiClient';
import { COLORS } from '../../src/utils/constants';

export default function MerchantRegisterScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    store_name: '',
    store_description: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
  });

  const handleRegister = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!formData.store_name || !formData.bank_name || !formData.bank_account_number) {
      Alert.alert('Error', 'Please complete store and bank information');
      return;
    }

    setLoading(true);
    try {
      const response = await merchantAPI.register(formData);

      if (response.data.success) {
        Alert.alert(
          'Registration Successful!',
          'Your merchant account has been registered. Please wait for admin verification.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join('\n');
        Alert.alert('Validation Error', errorMessages);
      } else {
        const message = error.response?.data?.message || 'Registration failed';
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="storefront" size={64} color={COLORS.primary} />
          <Text style={styles.title}>Register as Merchant</Text>
          <Text style={styles.subtitle}>
            Start selling your products on our platform
          </Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Email *"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Password *"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            value={formData.password_confirmation}
            onChangeText={(text) => setFormData({ ...formData, password_confirmation: text })}
            secureTextEntry
          />
        </View>

        {/* Store Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Store Name *"
            value={formData.store_name}
            onChangeText={(text) => setFormData({ ...formData, store_name: text })}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Store Description"
            value={formData.store_description}
            onChangeText={(text) => setFormData({ ...formData, store_description: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Bank Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Bank Name (e.g., BCA, Mandiri) *"
            value={formData.bank_name}
            onChangeText={(text) => setFormData({ ...formData, bank_name: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Account Number *"
            value={formData.bank_account_number}
            onChangeText={(text) => setFormData({ ...formData, bank_account_number: text })}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Account Holder Name *"
            value={formData.bank_account_name}
            onChangeText={(text) => setFormData({ ...formData, bank_account_name: text })}
            autoCapitalize="words"
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            After registration, your account will be reviewed by admin. You will be notified once approved.
          </Text>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.registerButtonText}>Register as Merchant</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>
            Already have an account? Login
          </Text>
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
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 15,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 5,
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
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 10,
    lineHeight: 18,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 15,
  },
  registerButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 14,
  },
});