import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { categoryAPI, productAPI } from '../../src/api/apiClient';

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, featuredRes] = await Promise.all([
        productAPI.getAll({ limit: 10 }),
        categoryAPI.getAll(),
        productAPI.getFeatured(),
      ]);

      setProducts(productsRes.data.data || productsRes.data);
      setCategories(categoriesRes.data.data || categoriesRes.data);
      setFeaturedProducts(featuredRes.data.data || featuredRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = () => {
    router.push(`/product/search?q=${searchQuery}`);
  };

  const renderCategoryItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => router.push(`/product/category/${item.id}`)}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name="pricetag" size={24} color="#007AFF" />
      </View>
      <Text style={styles.categoryName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/product/${item.id}`)}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>
          Rp {item.price?.toLocaleString('id-ID')}
        </Text>
        {item.discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount}% OFF</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Koperasi Swasembada</Text>
        <TouchableOpacity onPress={() => (router as any).push('/notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
      </View>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produk Unggulan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredProducts.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={styles.featuredCard}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                <Image
                  source={{ uri: item.image || 'https://via.placeholder.com/200' }}
                  style={styles.featuredImage}
                />
                <Text style={styles.featuredName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.featuredPrice}>
                  Rp {item.price?.toLocaleString('id-ID')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kategori</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/categories')}>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={categories.slice(0, 6)}
          renderItem={renderCategoryItem}
          keyExtractor={(item: any) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Produk Terbaru</Text>
        </View>
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item: any) => item.id.toString()}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.productRow}
        />
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#007AFF',
  },
  categoryCard: {
    alignItems: 'center',
    marginLeft: 16,
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  featuredCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginLeft: 16,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 150,
  },
  featuredName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    padding: 12,
    paddingBottom: 4,
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    height: 36,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});