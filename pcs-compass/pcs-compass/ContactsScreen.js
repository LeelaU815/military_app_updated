import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContactsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="people-outline" size={48} color="#B8863E" />
      <Text style={styles.title}>Contacts</Text>
      <Text style={styles.subtitle}>Coming soon — this will hold your key points of contact.</Text>
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