import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../src/utils/constants';

export default function PaymentPlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        This is a placeholder. Use /payment/[id] for actual payment.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  text: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
});