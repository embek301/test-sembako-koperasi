import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SIZES } from '../../src/utils/constants';
import { NotificationBell } from '../../src/components/NotificationBell';
// GANTI IP INI DENGAN IP LAPTOP ANDA!
const BASE_URL = 'http://192.168.100.238:8000';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  // Construct full avatar URL
  const getAvatarUrl = () => {
    if (user?.avatar) {
      // If avatar already contains full URL
      if (user.avatar.startsWith('http')) {
        return user.avatar;
      }
      // If avatar is just the path
      return `${BASE_URL}/storage/${user.avatar}`;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems = [
  {
    icon: 'person-outline',
    title: 'Edit Profile',
    onPress: () => router.push('/profile/edit'),
  },
  {
    icon: 'location-outline',
    title: 'My Addresses',
    onPress: () => router.push('/profile/addresses'),
  },
  {
    icon: 'pricetag', // NEW - Voucher icon
    title: 'My Vouchers',
    onPress: () => router.push('/vouchers' as any),
    },
  {
    icon: 'heart-outline',
    title: 'Wishlist',
    onPress: () => router.push('/profile/wishlist'),
  },
  {
    icon: 'lock-closed-outline',
    title: 'Change Password',
    onPress: () => Alert.alert('Coming Soon', 'This feature will be available soon'),
  },
  {
    icon: 'notifications-outline',
    title: 'Notifications',
    onPress: () => Alert.alert('Coming Soon', 'This feature will be available soon'),
  },
  {
    icon: 'help-circle-outline',
    title: 'Help & Support',
    onPress: () => Alert.alert('Coming Soon', 'This feature will be available soon'),
  },
  {
    icon: 'information-circle-outline',
    title: 'About',
    onPress: () => Alert.alert('About', 'Sembako Koperasi v1.0.0'),
  },
];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {avatarUrl ? (
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.avatarImage}
            onError={() => console.log('Error loading avatar:', avatarUrl)}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
         <View style={styles.headerRight}>
          <NotificationBell />
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'MEMBER'}</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon as any} size={24} color={COLORS.gray} />
              <Text style={styles.menuItemTitle}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
 profileHeader: {
    backgroundColor: COLORS.primary,
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.lightGray,
  },
   headerRight: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
});