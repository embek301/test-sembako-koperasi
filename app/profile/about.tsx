// app/profile/about.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const appInfo = {
    version: '1.0.0',
    build: '2024.01.001',
    releaseDate: 'Januari 2024',
  };

  const links = [
    {
      icon: 'document-text-outline',
      title: 'Syarat dan Ketentuan',
      onPress: () => Linking.openURL('https://tokoku.com/terms'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Kebijakan Privasi',
      onPress: () => Linking.openURL('https://tokoku.com/privacy'),
    },
    {
      icon: 'star-outline',
      title: 'Beri Rating di App Store',
      onPress: () => {
        // Ganti dengan link App Store aplikasi Anda
        Linking.openURL('https://apps.apple.com/app/idYOUR_APP_ID');
      },
    },
    {
      icon: 'logo-github',
      title: 'Versi Open Source',
      onPress: () => {
        // Ganti dengan repository GitHub Anda
        Linking.openURL('https://github.com/yourusername/tokoku-app');
      },
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* App Header */}
      <View style={styles.appHeader}>
        <View style={styles.appIcon}>
          <Text style={styles.appIconText}>🛍️</Text>
        </View>
        <Text style={styles.appName}>Tokoku</Text>
        <Text style={styles.appTagline}>Belanja Online Mudah & Aman</Text>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Aplikasi</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Versi</Text>
            <Text style={styles.infoValue}>{appInfo.version}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>{appInfo.build}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Rilis</Text>
            <Text style={styles.infoValue}>{appInfo.releaseDate}</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tentang Tokoku</Text>
        <Text style={styles.description}>
          Tokoku adalah aplikasi e-commerce terdepan yang menyediakan berbagai 
          kebutuhan sehari-hari dengan kualitas terbaik dan harga terjangkau. 
          Kami berkomitmen untuk memberikan pengalaman belanja online yang 
          mudah, aman, dan menyenangkan bagi semua pelanggan.
        </Text>
      </View>

      {/* Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tautan Penting</Text>
        <View style={styles.linksContainer}>
          {links.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.linkItem}
              onPress={link.onPress}
            >
              <View style={styles.linkLeft}>
                <Ionicons name={link.icon as any} size={24} color="#007AFF" />
                <Text style={styles.linkTitle}>{link.title}</Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#8E8E93" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Credits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kredit</Text>
        <View style={styles.credits}>
          <Text style={styles.creditText}>
            Dibangun dengan ❤️ menggunakan React Native & Expo
          </Text>
          <Text style={styles.creditText}>
            Icons oleh Ionicons
          </Text>
          <Text style={styles.creditText}>
            © 2024 Tokoku. All rights reserved.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  appHeader: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 32,
    marginBottom: 16,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconText: {
    fontSize: 32,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'justify',
  },
  linksContainer: {
    gap: 8,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkTitle: {
    fontSize: 16,
    color: '#333',
  },
  credits: {
    alignItems: 'center',
    gap: 8,
  },
  creditText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});