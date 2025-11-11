// app/(tabs)/index.tsx - FIXED PRODUCT TYPE
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoryAPI, productAPI, merchantAPI } from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SIZES } from '../../src/utils/constants';
import { formatPrice } from '../../src/utils/formatters';

interface Category {
  id: number;
  name: string;
  icon: string;
}

// ✅ Add Merchant interface
interface Merchant {
  id: number;
  name: string;
  store_name?: string;
  is_verified: boolean;
}

// ✅ Update Product interface
interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  unit: string;
  stock: number;
  average_rating: number;
  merchant?: Merchant; // ✅ Add merchant property
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [merchantStats, setMerchantStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (user?.role === 'merchant') {
        const response = await merchantAPI.getProfile();
        if (response.data.success) {
          setMerchantStats(response.data.data.stats);
        }
      } else {
        const [categoriesRes, productsRes] = await Promise.all([
          categoryAPI.getAll(),
          productAPI.getFeatured(),
        ]);

        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.data);
        }

        if (productsRes.data.success) {
          setFeaturedProducts(productsRes.data.data);
        }
      }
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

  // MERCHANT DASHBOARD
  if (user?.role === 'merchant') {
    const menuItems = [
      {
        icon: 'cube',
        title: 'My Products',
        description: `${merchantStats?.total_products || 0} products`,
        color: '#4CAF50',
        onPress: () => router.push('/(tabs)/products' as any),
      },
      {
        icon: 'card',
        title: 'Payments',
        description: 'View payment history',
        color: '#2196F3',
        onPress: () => router.push('/merchant/payments' as any),
      },
      {
        icon: 'wallet',
        title: 'Balance',
        description: formatPrice(merchantStats?.pending_balance || 0),
        color: '#FF9800',
        onPress: () => router.push('/merchant/balance' as any),
      },
      {
        icon: 'settings',
        title: 'Store Settings',
        description: 'Manage store',
        color: '#9E9E9E',
        onPress: () => router.push('/merchant/settings' as any),
      },
    ];

    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.merchantHeader}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.storeName}>{user.store_name || 'Merchant'}</Text>
          </View>
          {!user.is_verified && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>⏳ Pending</Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="trending-up" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>
              {formatPrice(merchantStats?.total_sales || 0)}
            </Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="cash" size={24} color="#2196F3" />
            </View>
            <Text style={styles.statValue}>
              {formatPrice(merchantStats?.total_earnings || 0)}
            </Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.lightGray} />
            </TouchableOpacity>
          ))}
        </View>

        {!user.is_verified && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={24} color="#FF9800" />
            <Text style={styles.infoBannerText}>
              Your account is pending verification. Some features are limited.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // ADMIN DASHBOARD
  if (user?.role === 'admin') {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.adminHeader}>
          <Text style={styles.adminTitle}>Admin Dashboard</Text>
        </View>
        
        <View style={styles.adminMenuContainer}>
          <TouchableOpacity style={styles.adminMenuItem}>
            <Ionicons name="people" size={32} color="#4CAF50" />
            <Text style={styles.adminMenuText}>Manage Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.adminMenuItem}>
            <Ionicons name="storefront" size={32} color="#2196F3" />
            <Text style={styles.adminMenuText}>Merchants</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.adminMenuItem}>
            <Ionicons name="cube" size={32} color="#FF9800" />
            <Text style={styles.adminMenuText}>Products</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.adminMenuItem}>
            <Ionicons name="receipt" size={32} color="#9C27B0" />
            <Text style={styles.adminMenuText}>Orders</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // DRIVER DASHBOARD
  if (user?.role === 'driver') {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.driverHeader}>
          <Ionicons name="car" size={48} color="#fff" />
          <Text style={styles.driverTitle}>Active Deliveries</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active deliveries</Text>
        </View>
      </ScrollView>
    );
  }

  // MEMBER HOME (Default)
  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => router.push({
        pathname: '/product/list',
        params: { categoryId: item.id }
      })}>
      <View style={styles.categoryIcon}>
        <Text style={styles.categoryEmoji}>{item.icon || '🛒'}</Text>
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProduct = (product: Product) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => router.push(`/product/${product.id}` as any)}>
      <View style={styles.productImage}>
        <Text style={styles.productImagePlaceholder}>📦</Text>
      </View>

      <View style={styles.productContent}>
        {/* ✅ MERCHANT INFO */}
        {product.merchant && (
          <View style={styles.merchantInfo}>
            <Ionicons name="storefront" size={12} color={COLORS.primary} />
            <Text style={styles.merchantName} numberOfLines={1}>
              {product.merchant.store_name || product.merchant.name}
            </Text>
            {product.merchant.is_verified && (
              <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
            )}
          </View>
        )}

        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>

        <View style={styles.productFooter}>
          <Text style={styles.productUnit}>per {product.unit}</Text>
          {product.stock > 0 ? (
            <Text style={styles.stockIn}>In Stock</Text>
          ) : (
            <Text style={styles.stockOut}>Out of Stock</Text>
          )}
        </View>

        {product.average_rating > 0 && (
          <View style={styles.rating}>
            <Text style={styles.ratingText}>⭐ {product.average_rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push('/product/list')}>
        <Text style={styles.searchText}>Search products...</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => router.push('/product/list')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productsGrid}>
          {featuredProducts.map((product) => renderProduct(product))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SIZES.padding * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    backgroundColor: '#fff',
    margin: SIZES.margin,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchText: {
    color: COLORS.lightGray,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: SIZES.padding,
    marginBottom: 15,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  categoriesList: {
    paddingHorizontal: 10,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  productCard: {
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
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImagePlaceholder: {
    fontSize: 48,
  },
  productContent: {
    padding: 10,
  },
  // ✅ MERCHANT INFO STYLES
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  merchantName: {
    fontSize: 10,
    color: COLORS.gray,
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
    height: 36,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productUnit: {
    fontSize: 12,
    color: COLORS.gray,
  },
  stockIn: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '600',
  },
  stockOut: {
    fontSize: 10,
    color: COLORS.error,
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
  },

  // Merchant styles
  merchantHeader: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 20,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  menuContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 3,
  },
  menuDescription: {
    fontSize: 13,
    color: COLORS.gray,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 10,
    lineHeight: 18,
  },

  // Admin styles
  adminHeader: {
    backgroundColor: COLORS.primary,
    padding: 30,
    paddingTop: 20,
    alignItems: 'center',
  },
  adminTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  adminMenuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 15,
  },
  adminMenuItem: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 10,
  },

  // Driver styles
  driverHeader: {
    backgroundColor: COLORS.primary,
    padding: 30,
    paddingTop: 20,
    alignItems: 'center',
  },
  driverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
  },
});