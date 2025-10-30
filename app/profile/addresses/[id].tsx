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
  recipient_name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  label: string;
  is_default: boolean;
}

export default function AddressDetailScreen() {
  const { id } = useLocalSearchParams();
  const isEdit = id !== 'new';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddressForm>({
    recipient_name: '',
    phone: '',
    address: '',
    province: '',
    city: '',
    district: '',
    postal_code: '',
    label: 'home',
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
        recipient_name: addressData.recipient_name || '',
        phone: addressData.phone || '',
        address: addressData.address || '',
        province: addressData.province || '',
        city: addressData.city || '',
        district: addressData.district || '',
        postal_code: addressData.postal_code || '',
        label: addressData.label || 'home',
        is_default: addressData.is_default || false,
      });
    } catch (error) {
      console.error('Error loading address:', error);
      Alert.alert('Error', 'Gagal memuat data alamat');
    }
  };

  const handleSaveAddress = async () => {
    // Validation
    if (!formData.recipient_name.trim()) {
      Alert.alert('Error', 'Nama penerima harus diisi');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Nomor telepon harus diisi');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Alamat harus diisi');
      return;
    }
    if (!formData.province.trim()) {
      Alert.alert('Error', 'Provinsi harus diisi');
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Kota harus diisi');
      return;
    }
    if (!formData.district.trim()) {
      Alert.alert('Error', 'Kecamatan harus diisi');
      return;
    }
    if (!formData.postal_code.trim()) {
      Alert.alert('Error', 'Kode pos harus diisi');
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
      
      // Show validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]: [string, any]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        Alert.alert('Validation Error', errorMessages);
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Gagal menyimpan alamat'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const labelOptions = [
    { value: 'home', label: 'Rumah' },
    { value: 'office', label: 'Kantor' },
    { value: 'apartment', label: 'Apartemen' },
    { value: 'other', label: 'Lainnya' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Label Alamat *</Text>
          <View style={styles.labelButtons}>
            {labelOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.labelButton,
                  formData.label === option.value && styles.labelButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, label: option.value })}
              >
                <Text
                  style={[
                    styles.labelButtonText,
                    formData.label === option.value && styles.labelButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Penerima *</Text>
          <TextInput
            style={styles.input}
            value={formData.recipient_name}
            onChangeText={(text) => setFormData({ ...formData, recipient_name: text })}
            placeholder="Masukkan nama penerima"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nomor Telepon *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="08xxxxxxxxxx"
            keyboardType="phone-pad"
            maxLength={13}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alamat Lengkap *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Jalan, nomor rumah, RT/RW, dll"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Provinsi *</Text>
          <TextInput
            style={styles.input}
            value={formData.province}
            onChangeText={(text) => setFormData({ ...formData, province: text })}
            placeholder="Contoh: Jawa Timur"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kota/Kabupaten *</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
            placeholder="Contoh: Surabaya"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kecamatan *</Text>
          <TextInput
            style={styles.input}
            value={formData.district}
            onChangeText={(text) => setFormData({ ...formData, district: text })}
            placeholder="Contoh: Wonokromo"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kode Pos *</Text>
          <TextInput
            style={styles.input}
            value={formData.postal_code}
            onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
            placeholder="Contoh: 60243"
            keyboardType="numeric"
            maxLength={5}
          />
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
  labelButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  labelButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  labelButtonText: {
    fontSize: 14,
    color: '#333',
  },
  labelButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
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