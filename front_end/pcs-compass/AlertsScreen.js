import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="notifications-outline" size={48} color="#B8863E" />
      <Text style={styles.title}>Alerts</Text>
      <Text style={styles.subtitle}>Coming soon — status updates and deadlines will show up here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14213D',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#5B6B82',
    textAlign: 'center',
  },
});