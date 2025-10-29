// app/profile/wishlist.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { wishlistAPI } from '../../src/api/apiClient';

interface WishlistItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
}

export default function WishlistScreen() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const response = await wishlistAPI.getAll();
      setWishlist(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      await wishlistAPI.remove(productId);
      setWishlist(wishlist.filter(item => item.product.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      Alert.alert('Error', 'Gagal menghapus dari wishlist');
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
    <ScrollView style={styles.container}>
      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyText}>Wishlist kosong</Text>
          <Text style={styles.emptySubtext}>
            Tambah produk favorit Anda ke wishlist
          </Text>
        </View>
      ) : (
        <View style={styles.wishlistContainer}>
          {wishlist.map((item) => (
            <View key={item.id} style={styles.wishlistItem}>
              <Image
                source={{ uri: item.product.image }}
                style={styles.productImage}
                defaultSource={require('../../assets/images/icon.png')}
              />
              
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.productPrice}>
                  Rp {item.product.price.toLocaleString()}
                </Text>
                <Text style={styles.productStock}>
                  Stok: {item.product.stock}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFromWishlist(item.product.id)}
              >
                <Ionicons name="heart" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
  wishlistContainer: {
    padding: 16,
  },
  wishlistItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#8E8E93',
  },
  removeButton: {
    padding: 8,
  },
});