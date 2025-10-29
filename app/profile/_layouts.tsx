// app/profile/_layout.tsx
import { Stack } from 'expo-router';

export default function ProfileLayout() {
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
        contentStyle: {
          backgroundColor: '#F2F2F7',
        },
      }}
    >
      <Stack.Screen 
        name="edit" 
        options={{ 
          title: 'Edit Profile',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="addresses" 
        options={{ 
          title: 'Alamat Saya',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="wishlist" 
        options={{ 
          title: 'Wishlist',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="change-password" 
        options={{ 
          title: 'Ganti Password',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          title: 'Notifikasi',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="help" 
        options={{ 
          title: 'Bantuan',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="about" 
        options={{ 
          title: 'Tentang Aplikasi',
          headerBackTitle: 'Back',
        }} 
      />
    </Stack>
  );
}