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
        headerBackTitle: 'Back', // ← Add back title
        contentStyle: {
          backgroundColor: '#F2F2F7',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'My Addresses',
          headerShown: true, // ← Explicitly show
        }} 
      />
      <Stack.Screen 
        name="[id]"
        options={{
          title: 'Address',
          headerShown: true,
        }}
      />
    </Stack>
  );
}