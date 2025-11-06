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
import { authAPI } from '../../src/api/apiClient';
import { COLORS, SIZES } from '../../src/utils/constants';

export default function ChangePasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      Alert.alert('Error', 'Current password is required');
      return false;
    }

    if (!formData.newPassword.trim()) {
      Alert.alert('Error', 'New password is required');
      return false;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Backend Laravel biasanya expect: current_password, password, password_confirmation
      const response = await authAPI.changePassword({
        current_password: formData.currentPassword,
        password: formData.newPassword,
        password_confirmation: formData.confirmPassword,
      });

      if (response.data.success) {
        Alert.alert(
          'Success', 
          'Password changed successfully', 
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Reset form
                setFormData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
                router.back();
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Handle validation errors
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join('\n');
        Alert.alert('Validation Error', errorMessages);
      } else {
        const message = error.response?.data?.message || 'Failed to change password';
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Info Section */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            For security reasons, please enter your current password to set a new one.
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.currentPassword}
                onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
                placeholder="Enter current password"
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.newPassword}
                onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
                placeholder="Enter new password"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Minimum 6 characters</Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={formData.newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={formData.newPassword.length >= 6 ? COLORS.success : COLORS.gray} 
              />
              <Text style={styles.requirementText}>At least 6 characters</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={formData.newPassword && formData.newPassword === formData.confirmPassword ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={formData.newPassword && formData.newPassword === formData.confirmPassword ? COLORS.success : COLORS.gray} 
              />
              <Text style={styles.requirementText}>Passwords match</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={formData.currentPassword && formData.newPassword && formData.currentPassword !== formData.newPassword ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={formData.currentPassword && formData.newPassword && formData.currentPassword !== formData.newPassword ? COLORS.success : COLORS.gray} 
              />
              <Text style={styles.requirementText}>Different from current password</Text>
            </View>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={[styles.changeButton, loading && styles.changeButtonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={24} color="#fff" />
              <Text style={styles.changeButtonText}>Change Password</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SIZES.padding,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10,
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: SIZES.padding,
    marginBottom: 20,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeButton: {
    padding: 15,
  },
  hint: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 5,
  },
  requirementsBox: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 8,
  },
  changeButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: SIZES.borderRadius,
    marginBottom: 10,
  },
  changeButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: '600',
  },
});