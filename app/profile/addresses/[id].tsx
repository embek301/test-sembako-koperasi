// app/profile/addresses/[id].tsx
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { addressAPI } from '../../../src/api/apiClient';

interface AddressForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  is_default: boolean;
}

export default function AddressDetailScreen() {
  const { id } = useLocalSearchParams();
  const isEdit = id !== 'new';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddressForm>({
    name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    is_default: false,
  });

  useEffect(() => {
    if (isEdit) {
      loadAddress();
    }
  }, [id]);

  const loadAddress = async () => {
    try {
      const response = await addressAPI.getById(Number(id));
      const addressData = response.data.data || response.data;
      setFormData({
        name: addressData.name || '',
        phone: addressData.phone || '',
        address: addressData.address || '',
        city: addressData.city || '',
        postal_code: addressData.postal_code || '',
        is_default: addressData.is_default || false,
      });
    } catch (error) {
      console.error('Error loading address:', error);
      Alert.alert('Error', 'Gagal memuat data alamat');
    }
  };

  const handleSaveAddress = async () => {
    if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.postal_code) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await addressAPI.update(Number(id), formData);
        Alert.alert('Sukses', 'Alamat berhasil diperbarui');
      } else {
        await addressAPI.create(formData);
        Alert.alert('Sukses', 'Alamat berhasil ditambahkan');
      }
      router.back();
    } catch (error: any) {
      console.error('Error saving address:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Gagal menyimpan alamat'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Penerima</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Masukkan nama penerima"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nomor Telepon</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Masukkan nomor telepon"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alamat Lengkap</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Masukkan alamat lengkap"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>Kota</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder="Kota"
            />
          </View>

          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>Kode Pos</Text>
            <TextInput
              style={styles.input}
              value={formData.postal_code}
              onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
              placeholder="Kode Pos"
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
        >
          <View style={[styles.checkbox, formData.is_default && styles.checkboxChecked]}>
            {formData.is_default && (
              <Text style={styles.checkboxIcon}>✓</Text>
            )}
          </View>
          <Text style={styles.checkboxLabel}>
            Jadikan alamat default
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveAddress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEdit ? 'Update Alamat' : 'Simpan Alamat'}
            </Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
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
