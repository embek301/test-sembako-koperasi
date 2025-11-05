// Update app/_layout.tsx - Add voucher route

import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="product/[id]" 
          options={{ 
            title: 'Product Detail',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="product/list" 
          options={{ 
            title: 'Products',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="checkout" 
          options={{ 
            title: 'Checkout',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="order/[id]" 
          options={{ 
            title: 'Order Detail',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="payment/[id]" 
          options={{ 
            title: 'Payment',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="vouchers/index" 
          options={{ 
            title: 'My Vouchers',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="profile/_layouts" 
          options={{ headerShown: false }} 
        />
      </Stack>
    </AuthProvider>
  );
}