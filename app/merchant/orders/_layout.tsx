// app/merchant/_layout.tsx
import { Stack } from 'expo-router';
import { COLORS } from '../../../src/utils/constants';

export default function MerchantLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: 'Dashboard',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="orders/index" 
        options={{ 
          title: 'My Orders',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="products" 
        options={{ 
          title: 'My Products',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="payments" 
        options={{ 
          title: 'Payments',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="balance" 
        options={{ 
          title: 'Balance & Withdrawal',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          title: 'Store Settings',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}