    import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { authAPI } from '../../src/api/apiClient';

    export default function ProfileScreen() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
        const response = await authAPI.getProfile();
        setUser(response.data.data || response.data);
        } catch (error) {
        console.error('Error loading profile:', error);
        } finally {
        setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Yakin ingin keluar?', [
        { text: 'Batal', style: 'cancel' },
        {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
            try {
                await authAPI.logout();
            } catch (error) {
                console.log('Logout API error:', error);
            } finally {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                router.replace('/(auth)/login');
            }
            },
        },
        ]);
    };

    const menuItems = [
        {
        icon: 'person-outline',
        title: 'Edit Profile',
        onPress: () => (router as any).push('/profile/edit'),
        },
        {
        icon: 'location-outline',
        title: 'Alamat',
        onPress: () => (router as any).push('/profile/addresses'),
        },
        {
        icon: 'heart-outline',
        title: 'Wishlist',
        onPress: () => (router as any).push('/profile/wishlist'),
        },
        {
        icon: 'lock-closed-outline',
        title: 'Ganti Password',
        onPress: () => (router as any).push('/profile/change-password'),
        },
        {
        icon: 'notifications-outline',
        title: 'Notifikasi',
        onPress: () => (router as any).push('/profile/notifications'),
        },
        {
        icon: 'help-circle-outline',
        title: 'Bantuan',
        onPress: () => (router as any).push('/profile/help'),
        },
        {
        icon: 'information-circle-outline',
        title: 'Tentang',
        onPress: () => (router as any).push('/profile/about'),
        },
    ];

    if (loading) {
        return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
        </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
            <View style={styles.avatar}>
            <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase()}
            </Text>
            </View>
            <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.phone && (
                <Text style={styles.userPhone}>{user?.phone}</Text>
            )}
            </View>
            <TouchableOpacity
            style={styles.editButton}
            onPress={() => (router as any).push('/profile/edit')}
            >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
            <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
            >
                <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                    <Ionicons name={item.icon as any} size={24} color="#007AFF" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
            <Text style={styles.version}>Version 1.0.0</Text>
        </View>
        </ScrollView>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        padding: 16,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 2,
    },
    userPhone: {
        fontSize: 14,
        color: '#8E8E93',
    },
    editButton: {
        padding: 8,
    },
    menuContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuTitle: {
        fontSize: 16,
        color: '#333',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
    },
    footer: {
        padding: 16,
        alignItems: 'center',
    },
    version: {
        fontSize: 12,
        color: '#8E8E93',
    },
    });