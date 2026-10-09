import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getCurrentUser } from './storage';
import { COLORS } from './theme';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(true);

  // Skip this screen if they're still logged in from last time.
  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (user) navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  if (checking) {
    return <View style={[styles.container, { paddingHorizontal: 0 }]} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.content}>
        <View style={styles.appIcon}>
          <Ionicons name="compass" size={56} color={COLORS.gold} />
        </View>
        <Text style={styles.title}>PCS Compass</Text>
        <Text style={styles.tagline}>
          Find schools, doctors, and support for your child before your next move.
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.groupedBackground,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIcon: {
    width: 104,
    height: 104,
    borderRadius: 24,
    backgroundColor: COLORS.gradientTop,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.label,
    marginTop: 24,
  },
  tagline: {
    fontSize: 17,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 23,
    maxWidth: 320,
  },
  buttons: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: '600',
  },
});
