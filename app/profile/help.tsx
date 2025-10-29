// app/profile/help.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const faqItems = [
    {
      question: 'Bagaimana cara melakukan pemesanan?',
      answer: 'Pilih produk yang ingin dibeli, tambahkan ke keranjang, lalu checkout dan pilih metode pembayaran yang tersedia.',
    },
    {
      question: 'Metode pembayaran apa saja yang tersedia?',
      answer: 'Kami menyediakan berbagai metode pembayaran termasuk transfer bank, virtual account, e-wallet, dan COD (Cash on Delivery) untuk area tertentu.',
    },
    {
      question: 'Berapa lama waktu pengiriman?',
      answer: 'Waktu pengiriman bervariasi tergantung lokasi dan kurir. Umumnya 1-3 hari untuk area Jabodetabek dan 3-7 hari untuk luar Jabodetabek.',
    },
    {
      question: 'Bagaimana cara melacak pesanan saya?',
      answer: 'Anda dapat melacak pesanan di halaman "Pesanan Saya" dengan memasukkan nomor resi yang telah kami kirim via email/SMS.',
    },
    {
      question: 'Apakah bisa mengembalikan produk?',
      answer: 'Ya, produk dapat dikembalikan dalam waktu 7 hari setelah diterima dengan syarat dan ketentuan yang berlaku.',
    },
  ];

  const contactItems = [
    {
      icon: 'call-outline',
      title: 'Telepon',
      value: '+62 21 1234 5678',
      onPress: () => Linking.openURL('tel:+622112345678'),
    },
    {
      icon: 'mail-outline',
      title: 'Email',
      value: 'support@tokoku.com',
      onPress: () => Linking.openURL('mailto:support@tokoku.com'),
    },
    {
      icon: 'logo-whatsapp',
      title: 'WhatsApp',
      value: '+62 812 3456 7890',
      onPress: () => Linking.openURL('https://wa.me/6281234567890'),
    },
  ];

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  return (
    <ScrollView style={styles.container}>
      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pertanyaan Umum</Text>
        <View style={styles.faqContainer}>
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleSection(index)}
              >
                <Text style={styles.faqQuestionText}>{item.question}</Text>
                <Ionicons
                  name={expandedSection === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#8E8E93"
                />
              </TouchableOpacity>
              {expandedSection === index && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Contact Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hubungi Kami</Text>
        <View style={styles.contactContainer}>
          {contactItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactItem}
              onPress={item.onPress}
            >
              <View style={styles.contactLeft}>
                <View style={styles.contactIcon}>
                  <Ionicons name={item.icon as any} size={24} color="#007AFF" />
                </View>
                <View>
                  <Text style={styles.contactTitle}>{item.title}</Text>
                  <Text style={styles.contactValue}>{item.value}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Operating Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jam Operasional</Text>
        <View style={styles.hoursContainer}>
          <View style={styles.hoursItem}>
            <Text style={styles.hoursDay}>Senin - Jumat</Text>
            <Text style={styles.hoursTime}>08:00 - 17:00 WIB</Text>
          </View>
          <View style={styles.hoursItem}>
            <Text style={styles.hoursDay}>Sabtu</Text>
            <Text style={styles.hoursTime}>08:00 - 15:00 WIB</Text>
          </View>
          <View style={styles.hoursItem}>
            <Text style={styles.hoursDay}>Minggu & Hari Libur</Text>
            <Text style={styles.hoursTime}>Tutup</Text>
          </View>
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
  faqContainer: {
    gap: 8,
  },
  faqItem: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  faqAnswer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactContainer: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  hoursContainer: {
    gap: 12,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  hoursDay: {
    fontSize: 14,
    color: '#333',
  },
  hoursTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});