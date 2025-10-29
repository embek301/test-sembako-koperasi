// src/screens/Product/ProductDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { productAPI, cartAPI, wishlistAPI } from '../../api/apiClient';

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const response = await productAPI.getById(productId);
      if (response.data.success) {
        setProduct(response.data.data.product);
        setInWishlist(response.data.data.in_wishlist);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (quantity < product.min_order) {
      Alert.alert('Error', `Minimum order is ${product.min_order} ${product.unit}`);
      return;
    }

    setAddingToCart(true);
    try {
      const response = await cartAPI.addToCart({
        product_id: product.id,
        quantity,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Product added to cart', [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
        ]);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add to cart';
      Alert.alert('Error', message);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const response = await wishlistAPI.toggle({ product_id: product.id });
      if (response.data.success) {
        setInWishlist(response.data.in_wishlist);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > product.min_order) {
      setQuantity(quantity - 1);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const imageUrl = product.images?.[0] || 'https://via.placeholder.com/400';

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={handleToggleWishlist}
          >
            <Text style={styles.wishlistIcon}>
              {inWishlist ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.category}>{product.category?.name}</Text>
          <Text style={styles.name}>{product.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.unit}>per {product.unit}</Text>
          </View>

          {product.average_rating > 0 && (
            <View style={styles.rating}>
              <Text style={styles.ratingText}>⭐ {product.average_rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({product.total_reviews} reviews)</Text>
            </View>
          )}

          <View style={styles.stockContainer}>
            <Text style={styles.stockLabel}>Stock:</Text>
            <Text style={product.stock > 0 ? styles.stockIn : styles.stockOut}>
              {product.stock > 0 ? `${product.stock} ${product.unit} available` : 'Out of Stock'}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {product.description || 'No description available'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={decrementQuantity}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{quantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={incrementQuantity}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.minOrder}>
            Minimum order: {product.min_order} {product.unit}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>
            {formatPrice(product.price * quantity)}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.addButton,
            (product.stock === 0 || addingToCart) && styles.addButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={product.stock === 0 || addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  wishlistButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  wishlistIcon: {
    fontSize: 20,
  },
  content: {
    padding: 20,
  },
  category: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginRight: 5,
  },
  unit: {
    fontSize: 14,
    color: '#666',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingText: {
    fontSize: 16,
    color: '#FF9800',
    marginRight: 5,
  },
  reviewCount: {
    fontSize: 14,
    color: '#999',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stockLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  stockIn: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  stockOut: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    minWidth: 40,
    textAlign: 'center',
  },
  minOrder: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  addButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen;