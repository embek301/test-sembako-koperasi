import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// GANTI IP INI DENGAN IP LAPTOP ANDA!
const API_URL = 'http://192.168.1.21:8000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    try {
      console.log('🌐 Request:', config.method?.toUpperCase(), config.url);
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('❌ Token error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error('❌ Error:', error.config?.url, error.response?.status);
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: any) => apiClient.post('/register', data),
  login: (data: any) => apiClient.post('/login', data),
  logout: () => apiClient.post('/logout'),
  getProfile: () => apiClient.get('/profile'),
  updateProfile: (data: any) => apiClient.put('/profile', data),
  changePassword: (data: any) => apiClient.post('/change-password', data),
};

// Category APIs
export const categoryAPI = {
  getAll: () => apiClient.get('/categories'),
  getById: (id: number) => apiClient.get(`/categories/${id}`),
};

// Product APIs
export const productAPI = {
  getAll: (params?: any) => apiClient.get('/products', { params }),
  getById: (id: number) => apiClient.get(`/products/${id}`),
  getFeatured: () => apiClient.get('/products/featured'),
  getRelated: (id: number) => apiClient.get(`/products/${id}/related`),
};

// Cart APIs
export const cartAPI = {
  getCart: () => apiClient.get('/cart'),
  addToCart: (data: any) => apiClient.post('/cart', data),
  updateCart: (id: number, data: any) => apiClient.put(`/cart/${id}`, data),
  removeFromCart: (id: number) => apiClient.delete(`/cart/${id}`),
  clearCart: () => apiClient.delete('/cart'),
  getCount: () => apiClient.get('/cart/count'),
};

// Address APIs
export const addressAPI = {
  getAll: () => apiClient.get('/addresses'),
  getById: (id: number) => apiClient.get(`/addresses/${id}`),
  create: (data: any) => apiClient.post('/addresses', data),
  update: (id: number, data: any) => apiClient.put(`/addresses/${id}`, data),
  delete: (id: number) => apiClient.delete(`/addresses/${id}`),
  setDefault: (id: number) => apiClient.post(`/addresses/${id}/set-default`),
};

// Order APIs
export const orderAPI = {
  getAll: (params?: any) => apiClient.get('/orders', { params }),
  getById: (id: number) => apiClient.get(`/orders/${id}`),
  create: (data: any) => apiClient.post('/orders', data),
  cancel: (id: number, data: any) => apiClient.post(`/orders/${id}/cancel`, data),
};

// Payment APIs
export const paymentAPI = {
  create: (data: any) => apiClient.post('/payments/create', data),
  checkStatus: (orderId: number) => apiClient.get(`/payments/${orderId}/status`),
};

// Tracking APIs
export const trackingAPI = {
  getTracking: (orderId: number) => apiClient.get(`/orders/${orderId}/tracking`),
  getLocation: (orderId: number) => apiClient.get(`/orders/${orderId}/location`),
};

// Wishlist APIs
export const wishlistAPI = {
  getAll: () => apiClient.get('/wishlist'),
  add: (data: any) => apiClient.post('/wishlist', data),
  remove: (productId: number) => apiClient.delete(`/wishlist/${productId}`),
  toggle: (data: any) => apiClient.post('/wishlist/toggle', data),
};

// Review APIs
export const reviewAPI = {
  getProductReviews: (productId: number) => apiClient.get(`/reviews/product/${productId}`),
  create: (data: any) => apiClient.post('/reviews', data),
  update: (id: number, data: any) => apiClient.put(`/reviews/${id}`, data),
  delete: (id: number) => apiClient.delete(`/reviews/${id}`),
};

// Voucher APIs
export const voucherAPI = {
  getAll: () => apiClient.get('/vouchers'),
  validate: (data: any) => apiClient.post('/vouchers/validate', data),
};

export default apiClient;