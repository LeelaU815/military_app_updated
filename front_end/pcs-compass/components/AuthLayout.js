import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../theme';

// Shared layout for Log In and Sign Up: back button, big title, one grouped card of fields, main button.
export default function AuthLayout({ title, subtitle, onBack, fields, buttonLabel, onSubmit, disabled, children }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={onBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.largeTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        <View style={styles.group}>
          {fields.map((field, i) => (
            <View key={field.placeholder} style={[styles.field, i < fields.length - 1 && styles.fieldBorder]}>
              <TextInput
                style={styles.input}
                placeholderTextColor={COLORS.tertiaryLabel}
                {...field}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.button, disabled && { opacity: 0.6 }]} onPress={onSubmit} disabled={disabled}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </TouchableOpacity>

        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function TextLink({ label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.link} hitSlop={8}>
      <Text style={styles.linkText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.groupedBackground,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 17,
    color: COLORS.primary,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.label,
    marginTop: 12,
    marginHorizontal: 16,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    marginTop: 4,
    marginHorizontal: 16,
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 24,
    overflow: 'hidden',
  },
  field: {
    paddingHorizontal: 16,
  },
  fieldBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  input: {
    fontSize: 17,
    color: COLORS.label,
    paddingVertical: 14,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  link: {
    alignSelf: 'center',
    marginTop: 18,
  },
  linkText: {
    fontSize: 17,
    color: COLORS.primary,
  },
});
