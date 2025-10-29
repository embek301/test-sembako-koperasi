import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { formatPrice } from '../utils/constants';

interface Product {
  id: number;
  name: string;
  price: number;
  images?: string[];
  unit: string;
  stock: number;
  average_rating?: number;
  total_reviews?: number;
}

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const imageUrl = product.images?.[0] || 'https://via.placeholder.com/150';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: imageUrl }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={styles.price}>{formatPrice(product.price)}</Text>

        <View style={styles.footer}>
          <Text style={styles.unit}>per {product.unit}</Text>

          {product.stock > 0 ? (
            <Text style={styles.stockIn}>In Stock</Text>
          ) : (
            <Text style={styles.stockOut}>Out of Stock</Text>
          )}
        </View>

        {product.average_rating && product.average_rating > 0 && (
          <View style={styles.rating}>
            <Text style={styles.ratingText}>⭐ {product.average_rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({product.total_reviews})</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 5,
    marginBottom: 15,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    height: 36,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unit: {
    fontSize: 12,
    color: '#666',
  },
  stockIn: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  stockOut: {
    fontSize: 10,
    color: '#F44336',
    fontWeight: '600',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: 12,
    color: '#FF9800',
    marginRight: 5,
  },
  reviewCount: {
    fontSize: 11,
    color: '#999',
  },
});

export default ProductCard;