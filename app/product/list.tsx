import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productAPI, categoryAPI } from '../../src/api/apiClient';
import { COLORS, SIZES } from '../../src/utils/constants';
import { formatPrice } from '../../src/utils/formatters';

export default function ProductListScreen() {
  const { categoryId, search } = useLocalSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(search as string || '');
  const [activeSearch, setActiveSearch] = useState(search as string || ''); // Track actual search
  const [categoryName, setCategoryName] = useState<string>('');

  // Only reload when categoryId or activeSearch changes (not searchQuery)
  useEffect(() => {
    loadProducts();
  }, [categoryId, activeSearch]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (categoryId) {
        params.category_id = categoryId;
        // Load category name for display
        try {
          const catResponse = await categoryAPI.getById(Number(categoryId));
          if (catResponse.data.success) {
            setCategoryName(catResponse.data.data.name);
          }
        } catch (error) {
          console.error('Error loading category name:', error);
        }
      } else {
        setCategoryName('');
      }
      
      if (activeSearch) {
        params.search = activeSearch;
      }

      const response = await productAPI.getAll(params);
      if (response.data.success) {
        setProducts(response.data.data.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
  };

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/product/${item.id}` as any)}>
      <View style={styles.productImage}>
        <Text style={styles.productImagePlaceholder}>📦</Text>
      </View>

      <View style={styles.productContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
        <Text style={styles.productUnit}>per {item.unit}</Text>
        
        {item.stock > 0 ? (
          <Text style={styles.stockIn}>In Stock</Text>
        ) : (
          <Text style={styles.stockOut}>Out of Stock</Text>
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
    <View style={styles.container}>
      {/* Category Header */}
      {categoryName && (
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryHeaderText}>📂 {categoryName}</Text>
          {categoryId && (
            <TouchableOpacity
              style={styles.clearCategoryButton}
              onPress={() => router.push('/product/list')}>
              <Text style={styles.clearCategoryText}>Show All</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Active Search Indicator */}
      {activeSearch && (
        <View style={styles.searchResultHeader}>
          <Text style={styles.searchResultText}>
            Search results for: "{activeSearch}"
          </Text>
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item: any) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              {activeSearch 
                ? `No results found for "${activeSearch}"` 
                : categoryName 
                  ? `No products found in ${categoryName}` 
                  : 'No products found'}
            </Text>
            {(activeSearch || categoryId) && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  clearSearch();
                  if (categoryId) {
                    router.push('/product/list');
                  }
                }}>
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  clearCategoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  clearCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: SIZES.padding,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 50,
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  listContent: {
    padding: 10,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 5,
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
    marginBottom: 3,
  },
  productUnit: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 5,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});