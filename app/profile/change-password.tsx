// app/profile/change-password.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { authAPI } from '../../src/api/apiClient';

export default function ChangePasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!formData.current_password || !formData.new_password || !formData.new_password_confirmation) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }

    if (formData.new_password.length < 6) {
      Alert.alert('Error', 'Password baru minimal 6 karakter');
      return;
    }

    if (formData.new_password !== formData.new_password_confirmation) {
      Alert.alert('Error', 'Konfirmasi password tidak sesuai');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword(formData);
      Alert.alert('Sukses', 'Password berhasil diubah');
      router.back();
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Gagal mengubah password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password Saat Ini</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              value={formData.current_password}
              onChangeText={(text) => setFormData({ ...formData, current_password: text })}
              placeholder="Masukkan password saat ini"
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Text style={styles.eyeButtonText}>
                {showCurrentPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password Baru</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              value={formData.new_password}
              onChangeText={(text) => setFormData({ ...formData, new_password: text })}
              placeholder="Masukkan password baru"
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Text style={styles.eyeButtonText}>
                {showNewPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>Minimal 6 karakter</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Konfirmasi Password Baru</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              value={formData.new_password_confirmation}
              onChangeText={(text) => setFormData({ ...formData, new_password_confirmation: text })}
              placeholder="Konfirmasi password baru"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.eyeButtonText}>
                {showConfirmPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Ubah Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  form: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  eyeButtonText: {
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  footer: {
    padding: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});