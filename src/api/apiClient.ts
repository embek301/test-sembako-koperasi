import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance } from "axios";

// GANTI IP INI DENGAN IP LAPTOP ANDA!
const API_URL = "http://192.168.100.238:8000/api";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    try {
      console.log("🌐 Request:", config.method?.toUpperCase(), config.url);

      // Get token
      const token = await AsyncStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Handle FormData - remove Content-Type to let browser set it with boundary
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
        console.log("📤 Sending FormData");
      }
    } catch (error) {
      console.error("❌ Token error:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error("❌ Error:", error.config?.url, error.response?.status);

    // Log validation errors for debugging
    if (error.response?.status === 422) {
      console.error("Validation errors:", error.response?.data?.errors);
    }

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: any) => apiClient.post("/register", data),
  login: (data: any) => apiClient.post("/login", data),
  logout: () => apiClient.post("/logout"),
  getProfile: () => apiClient.get("/profile"),
  updateProfile: (data: any) => {
    // Use PATCH for partial updates with FormData
    return apiClient.post("/profile", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  changePassword: (data: any) => apiClient.post("/change-password", data),
};

// Category APIs
export const categoryAPI = {
  getAll: () => apiClient.get("/categories"),
  getById: (id: number) => apiClient.get(`/categories/${id}`),
};

// Product APIs
export const productAPI = {
  getAll: (params?: any) => apiClient.get("/products", { params }),
  getById: (id: number) => apiClient.get(`/products/${id}`),
  getFeatured: () => apiClient.get("/products/featured"),
  getRelated: (id: number) => apiClient.get(`/products/${id}/related`),
};

// Cart APIs
export const cartAPI = {
  getCart: () => apiClient.get("/cart"),
  addToCart: (data: any) => apiClient.post("/cart", data),
  updateCart: (id: number, data: any) => apiClient.put(`/cart/${id}`, data),
  removeFromCart: (id: number) => apiClient.delete(`/cart/${id}`),
  clearCart: () => apiClient.delete("/cart"),
  getCount: () => apiClient.get("/cart/count"),
};

// Address APIs
export const addressAPI = {
  getAll: () => apiClient.get("/addresses"),
  getById: (id: number) => apiClient.get(`/addresses/${id}`),
  create: (data: any) => apiClient.post("/addresses", data),
  update: (id: number, data: any) => apiClient.put(`/addresses/${id}`, data),
  delete: (id: number) => apiClient.delete(`/addresses/${id}`),
  setDefault: (id: number) => apiClient.post(`/addresses/${id}/set-default`),
};

// Order APIs
export const orderAPI = {
  getAll: (params?: any) => apiClient.get("/orders", { params }),
  getById: (id: number) => apiClient.get(`/orders/${id}`),
  create: (data: any) => apiClient.post("/orders", data),
  cancel: (id: number, data: any) =>
    apiClient.post(`/orders/${id}/cancel`, data),
};

// Payment APIs
export const paymentAPI = {
  create: (data: any) => apiClient.post("/payments/create", data),
  checkStatus: (orderId: number) =>
    apiClient.get(`/payments/${orderId}/status`),
};

// Tracking APIs
export const trackingAPI = {
  getTracking: (orderId: number) =>
    apiClient.get(`/orders/${orderId}/tracking`),
  getLocation: (orderId: number) =>
    apiClient.get(`/orders/${orderId}/location`),
};

// Wishlist APIs
export const wishlistAPI = {
  getAll: () => apiClient.get("/wishlist"),
  add: (data: any) => apiClient.post("/wishlist", data),
  remove: (productId: number) => apiClient.delete(`/wishlist/${productId}`),
  toggle: (data: any) => apiClient.post("/wishlist/toggle", data),
};

// Review APIs
export const reviewAPI = {
  getProductReviews: (productId: number) =>
    apiClient.get(`/reviews/product/${productId}`),
  create: (data: any) => apiClient.post("/reviews", data),
  update: (id: number, data: any) => apiClient.put(`/reviews/${id}`, data),
  delete: (id: number) => apiClient.delete(`/reviews/${id}`),
};

// Voucher APIs
export const voucherAPI = {
  // Get all available vouchers
  getAll: () => apiClient.get("/vouchers"),

  // Validate voucher code
  validate: (data: { code: string; subtotal: number }) =>
    apiClient.post("/vouchers/validate", data),

  // Apply voucher to order (optional - if you want to track applied vouchers)
  apply: (data: { voucher_id: number; order_id: number }) =>
    apiClient.post("/vouchers/apply", data),

  // Get user's voucher history
  getHistory: () => apiClient.get("/vouchers/history"),
};
export const merchantAPI = {
  // Registration
  register: (data: any) => apiClient.post("/merchant/register", data),

  // Profile
  getProfile: () => apiClient.get("/merchant/profile"),
  updateProfile: (data: any) => {
    return apiClient.post("/merchant/profile", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Products Management
  getProducts: (params?: any) =>
    apiClient.get("/merchant/products", { params }),
  createProduct: (data: any) => {
    return apiClient.post("/merchant/products", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateProduct: (id: number, data: any) =>
    apiClient.put(`/merchant/products/${id}`, data),
  deleteProduct: (id: number) => apiClient.delete(`/merchant/products/${id}`),

  // Financial
  getPayments: (params?: any) =>
    apiClient.get("/merchant/payments", { params }),
  getBalance: () => apiClient.get("/merchant/balance"),
  getWithdrawals: () => apiClient.get("/merchant/withdrawals"),
  requestWithdrawal: (data: any) =>
    apiClient.post("/merchant/withdrawals", data),
};

// Admin Merchant Management APIs
export const adminMerchantAPI = {
  // Merchants List
  getMerchants: (params?: any) => apiClient.get("/admin/merchants", { params }),
  getMerchantDetail: (id: number) => apiClient.get(`/admin/merchants/${id}`),

  // Verification
  verifyMerchant: (id: number) =>
    apiClient.post(`/admin/merchants/${id}/verify`),
  unverifyMerchant: (id: number, data: any) =>
    apiClient.post(`/admin/merchants/${id}/unverify`, data),

  // Commission
  updateCommission: (id: number, data: any) =>
    apiClient.put(`/admin/merchants/${id}/commission`, data),

  // Withdrawals
  getWithdrawals: (params?: any) =>
    apiClient.get("/admin/withdrawals", { params }),
  processWithdrawal: (id: number, data: any) =>
    apiClient.post(`/admin/withdrawals/${id}/process`, data),

  // Statistics
  getStatistics: () => apiClient.get("/admin/merchants/statistics"),
};
export default apiClient;
