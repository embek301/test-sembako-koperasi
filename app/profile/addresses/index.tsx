// app/profile/addresses/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { addressAPI } from '../../../src/api/apiClient';

interface Address {
  id: number;
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

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load addresses on mount
  useEffect(() => {
    loadAddresses();
  }, []);

  // Reload addresses when screen is focused (after coming back from form)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Addresses screen focused - reloading addresses');
      loadAddresses();
    }, [])
  );

  const loadAddresses = async () => {
    try {
      const response = await addressAPI.getAll();
      setAddresses(response.data.data || response.data);
    } catch (error: any) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', error.response?.data?.message || 'Gagal memuat daftar alamat');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAddresses();
  };

  const handleDeleteAddress = (addressItem: Address) => {
    // Prevent deleting default address
    if (addressItem.is_default) {
      Alert.alert(
        'Cannot Delete',
        'Cannot delete default address. Please set another address as default first.'
      );
      return;
    }

    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete this address?\n\n${addressItem.recipient_name}\n${addressItem.address}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(addressItem.id);
            try {
              await addressAPI.delete(addressItem.id);
              // Remove from local state
              setAddresses(prevAddresses => 
                prevAddresses.filter(addr => addr.id !== addressItem.id)
              );
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error: any) {
              console.error('Error deleting address:', error);
              const errorMessage = error.response?.data?.message || 
                                  error.response?.data?.error ||
                                  'Failed to delete address';
              Alert.alert('Error', errorMessage);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressAPI.setDefault(id);
      // Update local state
      setAddresses(prevAddresses =>
        prevAddresses.map(addr => ({
          ...addr,
          is_default: addr.id === id,
        }))
      );
      Alert.alert('Success', 'Default address updated');
    } catch (error: any) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update default address');
    }
  };

  const getLabelIcon = (label: string) => {
    const icons: { [key: string]: string } = {
      home: 'home',
      office: 'business',
      apartment: 'location',
      other: 'location-outline',
    };
    return icons[label] || 'location-outline';
  };

  const getLabelText = (label: string) => {
    const labels: { [key: string]: string } = {
      home: 'Home',
      office: 'Office',
      apartment: 'Apartment',
      other: 'Other',
    };
    return labels[label] || 'Other';
  };

  const getLabelColor = (label: string) => {
    const colors: { [key: string]: string } = {
      home: '#4CAF50',
      office: '#2196F3',
      apartment: '#FF9800',
      other: '#9E9E9E',
    };
    return colors[label] || '#9E9E9E';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading addresses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="location-outline" size={80} color="#C7C7CC" />
            </View>
            <Text style={styles.emptyTitle}>No Addresses Yet</Text>
            <Text style={styles.emptySubtext}>
              Add your delivery address to make checkout easier
            </Text>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((address, index) => (
              <View key={address.id} style={styles.addressCard}>
                {/* Header with Label and Default Badge */}
                <View style={styles.addressHeader}>
                  <View style={styles.labelContainer}>
                    <View style={[styles.labelIcon, { backgroundColor: getLabelColor(address.label) + '20' }]}>
                      <Ionicons 
                        name={getLabelIcon(address.label) as any} 
                        size={20} 
                        color={getLabelColor(address.label)} 
                      />
                    </View>
                    <View>
                      <Text style={styles.labelText}>{getLabelText(address.label)}</Text>
                      {address.is_default && (
                        <View style={styles.defaultBadge}>
                          <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Address Details */}
                <View style={styles.addressDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={16} color="#666" />
                    <Text style={styles.recipientName}>{address.recipient_name}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="call" size={16} color="#666" />
                    <Text style={styles.phoneText}>{address.phone}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <View style={styles.addressTextContainer}>
                      <Text style={styles.addressText}>{address.address}</Text>
                      <Text style={styles.addressText}>
                        {address.district}, {address.city}
                      </Text>
                      <Text style={styles.addressText}>
                        {address.province} {address.postal_code}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/profile/addresses/${address.id}` as any)}>
                    <Ionicons name="create" size={18} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>

                  {!address.is_default && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(address.id)}>
                      <Ionicons name="star" size={18} color="#FF9800" />
                      <Text style={styles.actionButtonText}>Set Default</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      deletingId === address.id && styles.actionButtonDisabled
                    ]}
                    onPress={() => handleDeleteAddress(address)}
                    disabled={deletingId === address.id || address.is_default}>
                    {deletingId === address.id ? (
                      <ActivityIndicator size="small" color="#FF3B30" />
                    ) : (
                      <>
                        <Ionicons 
                          name="trash" 
                          size={18} 
                          color={address.is_default ? '#C7C7CC' : '#FF3B30'} 
                        />
                        <Text style={[
                          styles.actionButtonText,
                          styles.deleteText,
                          address.is_default && styles.disabledText
                        ]}>
                          Delete
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push('/profile/addresses/new' as any)}
        activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  addressList: {
    padding: 16,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  addressDetails: {
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  addressTextContainer: {
    flex: 1,
    gap: 2,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteText: {
    color: '#FF3B30',
  },
  disabledText: {
    color: '#C7C7CC',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});