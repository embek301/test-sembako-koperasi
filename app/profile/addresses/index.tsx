// app/profile/addresses/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { addressAPI } from '../../../src/api/apiClient';

interface Address {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  is_default: boolean;
}

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const response = await addressAPI.getAll();
      setAddresses(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Gagal memuat daftar alamat');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = (id: number) => {
    Alert.alert(
      'Hapus Alamat',
      'Yakin ingin menghapus alamat ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await addressAPI.delete(id);
              loadAddresses();
              Alert.alert('Sukses', 'Alamat berhasil dihapus');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Gagal menghapus alamat');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressAPI.setDefault(id);
      loadAddresses();
      Alert.alert('Sukses', 'Alamat default berhasil diubah');
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'Gagal mengubah alamat default');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>Belum ada alamat</Text>
            <Text style={styles.emptySubtext}>
              Tambah alamat untuk mempermudah pembelian
            </Text>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressName}>{address.name}</Text>
                {address.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.addressPhone}>{address.phone}</Text>
              <Text style={styles.addressText}>{address.address}</Text>
              <Text style={styles.addressText}>
                {address.city}, {address.postal_code}
              </Text>

              <View style={styles.addressActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => (router as any).push(`/profile/addresses/${address.id}`)}
                >
                  <Ionicons name="create-outline" size={20} color="#007AFF" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>

                {!address.is_default && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(address.id)}
                  >
                    <Ionicons name="star-outline" size={20} color="#FF9500" />
                    <Text style={styles.actionText}>Jadikan Default</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteAddress(address.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.actionText, styles.deleteText]}>
                    Hapus
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (router as any).push('/profile/addresses/new')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Tambah Alamat Baru</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  addressCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addressPhone: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 16,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#007AFF',
  },
  deleteText: {
    color: '#FF3B30',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});