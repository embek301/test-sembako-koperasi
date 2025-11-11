// app/merchant/_layout.tsx
import { Stack } from 'expo-router';
import { COLORS } from '../../src/utils/constants';

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
          title: 'Merchant Dashboard',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="orders" 
        options={{ 
          headerShown: false, // Has its own nested layout
        }} 
      />
      <Stack.Screen 
        name="products" 
        options={{ 
          title: 'My Products',
          headerShown: true,
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