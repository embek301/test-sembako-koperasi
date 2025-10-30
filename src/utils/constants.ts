// src/utils/constants.ts - ALL IN ONE FILE
import { Dimensions } from 'react-native';

// ========================================
// COLORS
// ========================================
export const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#E8F5E9',
  secondary: '#FF9800',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  background: '#f5f5f5',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#666666',
  lightGray: '#999999',
  border: '#dddddd',
  text: '#333333',
};

// ========================================
// SIZES
// ========================================
export const SIZES = {
  // Padding & Margin
  padding: 16,
  margin: 16,
  
  // Border Radius
  borderRadius: 8,
  borderRadiusLarge: 12,
  borderRadiusSmall: 4,
  
  // Font Sizes
  fontSize: {
    small: 12,
    medium: 14,
    large: 16,
    xlarge: 20,
    xxlarge: 24,
    xxxlarge: 32,
  },
  
  // Icon Sizes
  iconSize: {
    small: 16,
    medium: 24,
    large: 32,
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

// ========================================
// FONTS
// ========================================
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  semibold: 'System',
};

// ========================================
// SCREEN DIMENSIONS
// ========================================
const { width, height } = Dimensions.get('window');

export const SCREEN = {
  width,
  height,
  isSmallDevice: width < 375,
};

// ========================================
// FORMATTERS
// ========================================
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPhoneNumber = (phone: string): string => {
  // Format: 08123456789 -> 0812-3456-789
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{4})(\d{4})(\d+)$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return phone;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// ========================================
// HELPERS
// ========================================
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^[0-9]{10,13}$/;
  return re.test(phone.replace(/\D/g, ''));
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const getOrderStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    pending: COLORS.warning,
    paid: COLORS.info,
    processing: COLORS.info,
    packed: '#9C27B0',
    shipped: COLORS.warning,
    delivered: COLORS.success,
    cancelled: COLORS.error,
    refunded: COLORS.error,
  };
  return colors[status] || COLORS.gray;
};

export const getOrderStatusLabel = (status: string): string => {
  const labels: { [key: string]: string } = {
    pending: 'Pending',
    paid: 'Paid',
    processing: 'Processing',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[status] || status;
};