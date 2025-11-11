// app/merchant/orders/_layout.tsx
import { Stack } from 'expo-router';
import { COLORS } from '../../../src/utils/constants';

export default function MerchantOrdersLayout() {
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
        name="index" 
        options={{ 
          title: 'My Orders',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}