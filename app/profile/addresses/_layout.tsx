// app/profile/addresses/_layout.tsx
import { Stack } from 'expo-router';

export default function AddressesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Alamat Saya',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Edit Alamat',
          headerBackTitle: 'Back',
        }} 
      />
    </Stack>
  );
}
