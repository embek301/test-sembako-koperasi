import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { wishlistAPI, cartAPI } from '../../src/api/apiClient';
import { COLORS } from '../../src/utils/constants';
import { formatPrice } from '../../src/utils/formatters';

interface WishlistItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    images: string[];
    stock: number;
    unit: string;
    min_order: number;
  };
  quantity: number;
}

export default function WishlistScreen() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [processingItems, setProcessingItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const response = await wishlistAPI.getAll();
      const items = response.data.data || response.data;
      // Set default quantity to min_order for each item
      const itemsWithQuantity = items.map((item: any) => ({
        ...item,
        quantity: item.product.min_order || 1,
      }));
      setWishlist(itemsWithQuantity);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      Alert.alert('Error', 'Gagal memuat wishlist');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWishlist();
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    setWishlist(prevWishlist =>
      prevWishlist.map(item => {
        if (item.id === itemId) {
          const minOrder = item.product.min_order || 1;
          const maxStock = item.product.stock;
          const validQuantity = Math.max(minOrder, Math.min(newQuantity, maxStock));
          return { ...item, quantity: validQuantity };
        }
        return item;
      })
    );
  };

  const handleRemoveFromWishlist = (productId: number) => {
    Alert.alert(
      'Hapus dari Wishlist',
      'Yakin ingin menghapus produk ini dari wishlist?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await wishlistAPI.remove(productId);
              setWishlist(wishlist.filter(item => item.product.id !== productId));
              setSelectedItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
              });
              Alert.alert('Success', 'Produk dihapus dari wishlist');
            } catch (error) {
              console.error('Error removing from wishlist:', error);
              Alert.alert('Error', 'Gagal menghapus dari wishlist');
            }
          },
        },
      ]
    );
  };

  const toggleSelectItem = (productId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === wishlist.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(wishlist.map(item => item.product.id)));
    }
  };

  const addToCart = async (item: WishlistItem) => {
    setProcessingItems(prev => new Set(prev).add(item.product.id));
    try {
      const response = await cartAPI.addToCart({
        product_id: item.product.id,
        quantity: item.quantity,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Produk ditambahkan ke keranjang', [
          { text: 'Lanjut Belanja', style: 'cancel' },
          { text: 'Lihat Keranjang', onPress: () => router.push('/(tabs)/cart') },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Gagal menambahkan ke keranjang');
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.product.id);
        return newSet;
      });
    }
  };

  const addSelectedToCart = async () => {
    if (selectedItems.size === 0) {
      Alert.alert('Info', 'Pilih produk terlebih dahulu');
      return;
    }

    const selectedWishlistItems = wishlist.filter(item => 
      selectedItems.has(item.product.id)
    );

    Alert.alert(
      'Tambah ke Keranjang',
      `Tambahkan ${selectedItems.size} produk ke keranjang?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Tambahkan',
          onPress: async () => {
            let successCount = 0;
            let failCount = 0;

            for (const item of selectedWishlistItems) {
              try {
                await cartAPI.addToCart({
                  product_id: item.product.id,
                  quantity: item.quantity,
                });
                successCount++;
              } catch (error) {
                failCount++;
              }
            }

            if (successCount > 0) {
              Alert.alert(
                'Success',
                `${successCount} produk ditambahkan ke keranjang${failCount > 0 ? `, ${failCount} gagal` : ''}`,
                [
                  { text: 'OK', style: 'cancel' },
                  { text: 'Lihat Keranjang', onPress: () => router.push('/(tabs)/cart') },
                ]
              );
              setSelectedItems(new Set());
            } else {
              Alert.alert('Error', 'Gagal menambahkan produk ke keranjang');
            }
          },
        },
      ]
    );
  };

  const removeSelectedFromWishlist = () => {
    if (selectedItems.size === 0) {
      Alert.alert('Info', 'Pilih produk terlebih dahulu');
      return;
    }

    Alert.alert(
      'Hapus dari Wishlist',
      `Hapus ${selectedItems.size} produk dari wishlist?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            let successCount = 0;
            const itemsToRemove = Array.from(selectedItems);

            for (const productId of itemsToRemove) {
              try {
                await wishlistAPI.remove(productId);
                successCount++;
              } catch (error) {
                console.error(`Error removing product ${productId}:`, error);
              }
            }

            if (successCount > 0) {
              setWishlist(prev => 
                prev.filter(item => !selectedItems.has(item.product.id))
              );
              setSelectedItems(new Set());
              Alert.alert('Success', `${successCount} produk dihapus dari wishlist`);
            }
          },
        },
      ]
    );
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => {
    const isSelected = selectedItems.has(item.product.id);
    const isProcessing = processingItems.has(item.product.id);

    return (
      <View style={styles.wishlistItem}>
        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleSelectItem(item.product.id)}>
          <View style={[styles.checkboxBox, isSelected && styles.checkboxBoxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </TouchableOpacity>

        {/* Product Image */}
        <TouchableOpacity
          style={styles.productImage}
          onPress={() => router.push(`/product/${item.product.id}` as any)}>
          <Text style={styles.productImagePlaceholder}>📦</Text>
        </TouchableOpacity>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <TouchableOpacity onPress={() => router.push(`/product/${item.product.id}` as any)}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.product.name}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.productPrice}>{formatPrice(item.product.price)}</Text>
          <Text style={styles.productUnit}>per {item.product.unit}</Text>

          {/* Quantity Controls */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.quantity - 1)}>
              <Ionicons name="remove" size={16} color={COLORS.primary} />
            </TouchableOpacity>

            <Text style={styles.quantity}>{item.quantity}</Text>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}>
              <Ionicons name="add" size={16} color={COLORS.primary} />
            </TouchableOpacity>

            <Text style={styles.stockInfo}>
              Stok: {item.product.stock}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.addToCartButton, isProcessing && styles.buttonDisabled]}
              onPress={() => addToCart(item)}
              disabled={isProcessing || item.product.stock === 0}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={16} color="#fff" />
                  <Text style={styles.addToCartButtonText}>Keranjang</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveFromWishlist(item.product.id)}>
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyText}>Wishlist kosong</Text>
          <Text style={styles.emptySubtext}>
            Tambah produk favorit Anda ke wishlist
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}>
            <Text style={styles.shopButtonText}>Mulai Belanja</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Select All Header */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={selectAll}>
              <View style={[
                styles.checkboxBox,
                selectedItems.size === wishlist.length && styles.checkboxBoxSelected
              ]}>
                {selectedItems.size === wishlist.length && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.selectAllText}>
                {selectedItems.size === wishlist.length ? 'Batalkan Semua' : 'Pilih Semua'}
              </Text>
            </TouchableOpacity>

            {selectedItems.size > 0 && (
              <Text style={styles.selectedCount}>
                {selectedItems.size} dipilih
              </Text>
            )}
          </View>

          {/* Wishlist Items */}
          <FlatList
            data={wishlist}
            renderItem={renderWishlistItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />

          {/* Bottom Action Bar */}
          {selectedItems.size > 0 && (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.deleteSelectedButton}
                onPress={removeSelectedFromWishlist}>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={styles.deleteSelectedText}>Hapus ({selectedItems.size})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={addSelectedToCart}>
                <Ionicons name="cart" size={20} color="#fff" />
                <Text style={styles.checkoutButtonText}>
                  Tambah ke Keranjang ({selectedItems.size})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10,
    fontWeight: '600',
  },
  selectedCount: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 10,
  },
  wishlistItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkbox: {
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productImagePlaceholder: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  productUnit: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  stockInfo: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  deleteSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  deleteSelectedText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  checkoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});