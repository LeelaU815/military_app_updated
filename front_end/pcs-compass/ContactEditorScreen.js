import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCurrentUser, saveContact } from './storage';
import { COLORS } from './theme';

// Add or edit one of your own contacts.
export default function ContactEditorScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existing = route.params.contact; // null when adding
  const start = existing ? existing.fields : { name: '', role: '', phone: '', email: '', notes: '' };
  const [fields, setFields] = useState(start);
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setFields((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!fields.name.trim()) {
      Alert.alert('Add a name', 'Who is this contact?');
      return;
    }
    if (fields.email.trim() && !/^\S+@\S+\.\S+$/.test(fields.email.trim())) {
      Alert.alert('Check the email', "That email address doesn't look right.");
      return;
    }
    setSaving(true);
    try {
      const user = await getCurrentUser();
      const cleaned = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.trim()]));
      await saveContact(user.uid, cleaned, existing ? existing.id : null);
      navigation.goBack(); // Contacts reloads when it comes back into view
    } catch (error) {
      Alert.alert('Error', "Couldn't save that contact. Try again.");
      console.log(error);
      setSaving(false);
    }
  };

  const input = (key, placeholder, props = {}) => (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={COLORS.tertiaryLabel}
      value={fields[key]}
      onChangeText={(v) => update(key, v)}
      {...props}
    />
  );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.navLink}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{existing ? 'Edit Contact' : 'New Contact'}</Text>
        <TouchableOpacity onPress={save} disabled={saving} hitSlop={10}>
          <Text style={[styles.navLink, { fontWeight: '600' }, saving && { opacity: 0.5 }]}>{saving ? 'Saving' : 'Done'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.group}>
          {input('name', 'Name', { autoFocus: !existing, textContentType: 'name' })}
          <View style={styles.divider} />
          {input('role', 'Role or organization (e.g. Current teacher)')}
        </View>

        <View style={[styles.group, { marginTop: 24 }]}>
          {input('phone', 'Phone', { keyboardType: 'phone-pad', textContentType: 'telephoneNumber' })}
          <View style={styles.divider} />
          {input('email', 'Email', { keyboardType: 'email-address', autoCapitalize: 'none', textContentType: 'emailAddress' })}
        </View>

        <View style={[styles.group, { marginTop: 24 }]}>
          {input('notes', 'Notes', { multiline: true, style: [styles.input, styles.notes] })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.groupedBackground,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  navLink: {
    fontSize: 17,
    color: COLORS.primary,
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    fontSize: 17,
    color: COLORS.label,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  notes: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.separator,
    marginLeft: 16,
  },
});
