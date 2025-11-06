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
        headerBackTitle: 'Back', // ← Global back title
        contentStyle: {
          backgroundColor: '#F2F2F7',
        },
      }}
    >
      <Stack.Screen 
        name="edit" 
        options={{ 
          title: 'Edit Profile',
          headerShown: true, // ← Explicitly show header
        }} 
      />
      <Stack.Screen 
        name="addresses" 
        options={{ 
          headerShown: false, // ← Has its own nested layout
        }} 
      />
      <Stack.Screen 
        name="wishlist" 
        options={{ 
          title: 'Wishlist',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="change-password" 
        options={{ 
          title: 'Change Password',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          title: 'Notifications',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="help" 
        options={{ 
          title: 'Help & Support',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="about" 
        options={{ 
          title: 'About',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}