// app/(tabs)/_layout.tsx - UPDATED WITH ROLE-BASED TABS
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';

export default function TabsLayout() {
  const { user } = useAuth();
  
  // MEMBER TABS (Default)
  if (!user || user.role === 'member') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ad190f',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    );
  }

  // MERCHANT TABS
   if (user.role === 'merchant') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ad190f',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: 'Products',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        {/* Hide orders and cart tabs for merchants */}
        <Tabs.Screen
          name="orders"
          options={{
            href: null, // This hides the tab
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            href: null,
          }}
        />
      </Tabs>
    );
  }

  // ADMIN TABS
  if (user.role === 'admin') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ad190f',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: 'Products',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'More',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="menu" size={size} color={color} />
            ),
          }}
        />
        {/* Hide cart for admin */}
        <Tabs.Screen
          name="cart"
          options={{
            href: null,
          }}
        />
      </Tabs>
    );
  }

  // DRIVER TABS
  if (user.role === 'driver') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ad190f',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Active Orders',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        {/* Hide cart and products for driver */}
        <Tabs.Screen
          name="cart"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            href: null,
          }}
        />
      </Tabs>
    );
  }

  // Fallback to member tabs
  return null;
}