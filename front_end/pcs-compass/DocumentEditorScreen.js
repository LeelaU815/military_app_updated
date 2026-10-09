import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getCurrentUser } from './storage';
import { FOLDERS, addStoredDocument, updateStoredDocument } from './documentStore';
import { DOCUMENT_SUGGESTIONS } from './data';
import { COLORS } from './theme';

// Name a document and pick its folder. Opens after picking a file, or from a document's Edit button.

// 'IEP 2026.pdf' -> 'IEP 2026'. Camera photos get random names, so those start blank.
function startingName(picked) {
  if (!picked || !picked.name || /^(IMG_|Photo|image|[0-9A-F-]{20,})/i.test(picked.name)) return '';
  return picked.name.replace(/\.[^.]+$/, '');
}

export default function DocumentEditorScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existing = route.params.document; // set when editing
  const picked = route.params.picked; // set when adding
  const [name, setName] = useState(existing ? existing.name : startingName(picked));
  const [folder, setFolder] = useState(existing ? existing.folder : route.params.folder || 'other');
  const [notes, setNotes] = useState(existing ? existing.notes || '' : '');
  const [saving, setSaving] = useState(false);
  const isPhoto = picked && (picked.mimeType || '').startsWith('image/');

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Add a name', 'What is this document?');
      return;
    }
    setSaving(true);
    try {
      const user = await getCurrentUser();
      const fields = { name: name.trim(), folder, notes: notes.trim() };
      if (existing) await updateStoredDocument(user.uid, existing.id, fields);
      else await addStoredDocument(user.uid, picked, fields);
      navigation.goBack(); // Documents and the viewer reload when they come back into view
    } catch (error) {
      Alert.alert('Error', "Couldn't save that document. Try again.");
      console.log(error);
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.navLink}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{existing ? 'Edit Document' : 'Save Document'}</Text>
        <TouchableOpacity onPress={save} disabled={saving} hitSlop={10}>
          <Text style={[styles.navLink, { fontWeight: '600' }, saving && { opacity: 0.5 }]}>{saving ? 'Saving' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        {picked && (
          <View style={styles.preview}>
            {isPhoto ? (
              <Image source={{ uri: picked.uri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.previewFile}>
                <Ionicons name="document-text" size={40} color="#FF3B30" />
                <Text style={styles.previewName} numberOfLines={2}>{picked.name}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.group}>
          <TextInput
            style={styles.input}
            placeholder="Name (e.g. IEP 2026)"
            placeholderTextColor={COLORS.tertiaryLabel}
            value={name}
            onChangeText={setName}
            autoFocus={!existing && !name}
          />
        </View>

        <Text style={styles.sectionHeader}>FOLDER</Text>
        <View style={styles.chips}>
          {FOLDERS.map((f) => {
            const active = f.id === folder;
            return (
              <TouchableOpacity key={f.id} style={[styles.chip, active && { backgroundColor: f.color }]} onPress={() => setFolder(f.id)}>
                <Ionicons name={f.icon} size={14} color={active ? COLORS.white : f.color} style={{ marginRight: 5 }} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {DOCUMENT_SUGGESTIONS[folder].length > 0 && (
          <>
            <Text style={styles.sectionHeader}>SUGGESTED NAMES</Text>
            <View style={styles.chips}>
              {DOCUMENT_SUGGESTIONS[folder].map((s) => (
                <TouchableOpacity key={s} style={[styles.chip, styles.suggestion]} onPress={() => setName(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={[styles.group, { marginTop: 24 }]}>
          <TextInput
            style={[styles.input, styles.notes]}
            placeholder="Notes (where the original is, who gave it to you)"
            placeholderTextColor={COLORS.tertiaryLabel}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
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
  preview: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  previewFile: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  previewName: {
    fontSize: 15,
    color: COLORS.label,
    marginTop: 8,
    textAlign: 'center',
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.label,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  suggestion: {
    backgroundColor: COLORS.fill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.label,
  },
});
