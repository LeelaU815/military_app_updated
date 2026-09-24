import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from './theme';

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="notifications-outline" size={48} color={COLORS.goldDark} />
      <Text style={styles.title}>Alerts</Text>
      <Text style={styles.subtitle}>Coming soon — status updates and deadlines will show up here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});