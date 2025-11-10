// Update app/_layout.tsx - Add voucher route

import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';

export default function RootLayout() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
            name="notifications/index" 
            options={{ 
              title: 'Notifications',
              headerBackTitle: 'Back'
            }} 
          />
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
          name="profile" 
          options={{ headerShown: false,headerBackTitle: 'Back' }} 
        />
        </Stack>
      </AuthProvider>
    </NotificationProvider>
  );
}