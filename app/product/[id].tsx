import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
import { cartAPI, productAPI, reviewAPI, wishlistAPI } from '../../src/api/apiClient';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const productRes = await productAPI.getById(Number(id));
      
      // Log untuk debugging
      console.log('Full API Response:', JSON.stringify(productRes.data, null, 2));
      
      // Extract product data - sesuaikan dengan struktur API Anda
      let productData = productRes.data.product || productRes.data.data || productRes.data;
      
      // Jika masih ada nested 'product', ambil yang dalam
      if (productData.product) {
        productData = productData.product;
      }
      
      console.log('Extracted Product:', JSON.stringify(productData, null, 2));
      
      setProduct(productData);
      setIsWishlisted(productRes.data.in_wishlist || false);

      // Load related products (berdasarkan category)
      if (productData.category_id) {
        try {
          const relatedRes = await productAPI.getAll({ 
            category_id: productData.category_id,
            limit: 4,
            exclude: Number(id)
          });
          setRelatedProducts(relatedRes.data.data || relatedRes.data || []);
        } catch (error) {
          console.error('Error loading related products:', error);
        }
      }

      // Load reviews
      try {
        const reviewsRes = await reviewAPI.getProductReviews(Number(id));
        setReviews(reviewsRes.data.data || reviewsRes.data || []);
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await cartAPI.addToCart({
        product_id: Number(id),
        quantity,
      });
      Alert.alert('Berhasil', 'Produk ditambahkan ke keranjang', [
        { text: 'Lanjut Belanja', style: 'cancel' },
        { text: 'Ke Keranjang', onPress: () => router.push('/(tabs)/cart') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Gagal menambahkan ke keranjang');
    }
  };

  const handleToggleWishlist = async () => {
    try {
      await wishlistAPI.toggle({ product_id: Number(id) });
      setIsWishlisted(!isWishlisted);
    } catch (error) {
      Alert.alert('Error', 'Gagal mengupdate wishlist');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Produk tidak ditemukan</Text>
      </View>
    );
  }

  // Parse price dengan benar
  const parsePrice = (price: any): number => {
    if (!price) return 0;
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      return parseFloat(price.replace(/[^0-9.-]/g, ''));
    }
    return 0;
  };

  const price = parsePrice(product.price);
  const discount = product.discount || 0;
  const originalPrice = product.original_price ? parsePrice(product.original_price) : null;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={handleToggleWishlist}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={24}
              color={isWishlisted ? '#FF3B30' : '#333'}
            />
          </TouchableOpacity>
        </View>

        {/* Product Image */}
        <Image
          source={{
            uri: product.images?.[0] || product.image || 'https://via.placeholder.com/400',
          }}
          style={styles.productImage}
        />

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              Rp {price.toLocaleString('id-ID')}
            </Text>
            {discount > 0 && originalPrice && originalPrice > 0 && (
              <>
                <Text style={styles.originalPrice}>
                  Rp {originalPrice.toLocaleString('id-ID')}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
              </>
            )}
          </View>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FF9500" />
            <Text style={styles.rating}>{product.average_rating || 0}</Text>
            <Text style={styles.reviewCount}>
              ({product.total_reviews || 0} ulasan)
            </Text>
          </View>

          {/* Stock Info */}
          <View style={styles.stockContainer}>
            <Text style={styles.stockLabel}>Stok: </Text>
            <Text style={styles.stockValue}>{product.stock} {product.unit}</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deskripsi</Text>
            <Text style={styles.description}>
              {product.description || 'Tidak ada deskripsi.'}
            </Text>
          </View>

          {/* Quantity Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Jumlah</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reviews */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ulasan</Text>
                <TouchableOpacity onPress={() => router.push(`/product/${id}/reviews`)}>
                  <Text style={styles.seeAll}>Lihat Semua</Text>
                </TouchableOpacity>
              </View>
              {reviews.slice(0, 3).map((review: any) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewName}>{review.user?.name}</Text>
                    <View style={styles.reviewRating}>
                      <Ionicons name="star" size={14} color="#FF9500" />
                      <Text style={styles.reviewRatingText}>{review.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{review.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString('id-ID')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Produk Terkait</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {relatedProducts.map((item: any) => {
                  const relatedPrice = parsePrice(item.price);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.relatedCard}
                      onPress={() => {
                        router.push(`/product/${item.id}`);
                        // Refresh data when navigating to another product
                        setLoading(true);
                      }}
                    >
                      <Image
                        source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                        style={styles.relatedImage}
                      />
                      <Text style={styles.relatedName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.relatedPrice}>
                        Rp {relatedPrice.toLocaleString('id-ID')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => Alert.alert('Chat', 'Fitur chat dalam pengembangan')}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          disabled={product.stock <= 0}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.addToCartText}>
            {product.stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#F2F2F7',
  },
  infoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  originalPrice: {
    fontSize: 18,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  seeAll: {
    fontSize: 14,
    color: '#007AFF',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    minWidth: 32,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  relatedCard: {
    width: 150,
    marginRight: 12,
  },
  relatedImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginBottom: 8,
  },
  relatedName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    height: 36,
  },
  relatedPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#fff',
    gap: 12,
  },
  chatButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});