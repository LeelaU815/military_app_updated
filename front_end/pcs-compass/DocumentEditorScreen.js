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

import { getCurrentUser, saveCustomDocument } from './storage';
import { COLORS } from './theme';

// Add or edit one of your own documents.
export default function DocumentEditorScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existing = route.params.document; // null when adding
  const start = existing ? { title: existing.title, notes: existing.notes } : { title: '', notes: '' };
  const [fields, setFields] = useState(start);
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setFields((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!fields.title.trim()) {
      Alert.alert('Add a name', 'What document is it?');
      return;
    }
    setSaving(true);
    try {
      const user = await getCurrentUser();
      const cleaned = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.trim()]));
      await saveCustomDocument(user.uid, cleaned, existing ? existing.id : null);
      navigation.goBack(); // Documents reloads when it comes back into view
    } catch (error) {
      Alert.alert('Error', "Couldn't save that document. Try again.");
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
        <Text style={styles.navTitle}>{existing ? 'Edit Document' : 'New Document'}</Text>
        <TouchableOpacity onPress={save} disabled={saving} hitSlop={10}>
          <Text style={[styles.navLink, { fontWeight: '600' }, saving && { opacity: 0.5 }]}>{saving ? 'Saving' : 'Done'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.group}>
          {input('title', 'Document (e.g. Power of attorney, Passport)', { autoFocus: !existing })}
        </View>

        <View style={[styles.group, { marginTop: 24 }]}>
          {input('notes', 'Notes (where it is, who to ask for it)', { multiline: true, style: [styles.input, styles.notes] })}
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
});
