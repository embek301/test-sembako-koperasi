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
          name="products/[id]" 
          options={{ 
            title: 'Product Detail',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="cart/checkout" 
          options={{ title: 'Checkout' }} 
        />
        <Stack.Screen 
          name="orders/[id]" 
          options={{ title: 'Order Detail' }} 
        />
        <Stack.Screen 
          name="orders/tracking" 
          options={{ title: 'Track Order' }} 
        />
        <Stack.Screen 
          name="payment/[orderId]" 
          options={{ title: 'Payment' }} 
        />
      </Stack>
    </AuthProvider>
  );
}