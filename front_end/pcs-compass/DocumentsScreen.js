import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { getCurrentUser } from './storage';
import { FOLDERS, loadStoredDocuments, fileFor, isImage, isPdf, formatSize } from './documentStore';
import { DOCUMENT_SUGGESTIONS } from './data';
import { COLORS } from './theme';

// A place to keep move paperwork, like the Files app: scan it with the camera, pick a photo, or pick a PDF.

function Thumbnail({ uid, doc }) {
  if (isImage(doc)) {
    return <Image source={{ uri: fileFor(uid, doc).uri }} style={styles.thumb} />;
  }
  return (
    <View style={[styles.thumb, styles.fileThumb]}>
      <Ionicons name={isPdf(doc) ? 'document-text' : 'document'} size={22} color={isPdf(doc) ? '#FF3B30' : COLORS.secondaryLabel} />
      {isPdf(doc) && <Text style={styles.pdfLabel}>PDF</Text>}
    </View>
  );
}

// Asks where the document is coming from, then returns { uri, name, mimeType, size } or null.
export function pickDocument() {
  const fromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access is off', 'Turn on camera access for this app in Settings to take photos of documents.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    return result.canceled ? null : fromAsset(result.assets[0]);
  };
  const fromPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    return result.canceled ? null : fromAsset(result.assets[0]);
  };
  const fromFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (result.canceled) return null;
    const file = result.assets[0];
    return { uri: file.uri, name: file.name, mimeType: file.mimeType, size: file.size };
  };
  const fromAsset = (asset) => ({
    uri: asset.uri,
    name: asset.fileName || 'Photo.jpg',
    mimeType: asset.mimeType || 'image/jpeg',
    size: asset.fileSize,
  });

  const choices = [
    { label: 'Take Photo', run: fromCamera },
    { label: 'Choose from Photos', run: fromPhotos },
    { label: 'Choose File', run: fromFiles },
  ];
  return new Promise((resolve) => {
    const run = (choice) => choice.run().then(resolve).catch((error) => {
      console.log(error);
      Alert.alert('Error', "Couldn't open that. Try again.");
      resolve(null);
    });
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...choices.map((c) => c.label), 'Cancel'], cancelButtonIndex: choices.length, title: 'Add a document' },
        (index) => (index < choices.length ? run(choices[index]) : resolve(null))
      );
    } else {
      Alert.alert('Add a document', null, [
        ...choices.map((c) => ({ text: c.label, onPress: () => run(c) })),
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ]);
    }
  });
}

export default function DocumentsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [docs, setDocs] = useState([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const user = await getCurrentUser();
          if (!user) return;
          setUid(user.uid);
          setDocs(await loadStoredDocuments(user.uid));
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const add = async (folder) => {
    const picked = await pickDocument();
    if (picked) navigation.navigate('DocumentEditor', { picked, folder: folder || 'other' });
  };

  if (loading) {
    return <View style={[styles.screen, styles.center]}><Text style={styles.muted}>Loading...</Text></View>;
  }

  const q = query.trim().toLowerCase();
  const matches = (d) => !q || [d.name, d.notes].filter(Boolean).some((t) => t.toLowerCase().includes(q));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={styles.titleRow}>
        <Text style={styles.largeTitle}>Documents</Text>
        <TouchableOpacity onPress={() => add()} hitSlop={10} accessibilityLabel="Add document">
          <Ionicons name="add-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {docs.length > 0 && (
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={COLORS.secondaryLabel} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={COLORS.secondaryLabel}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {docs.length === 0 && (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="folder-open" size={30} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Keep your move paperwork in one place</Text>
          <Text style={styles.emptyText}>
            Take a photo of a document or add a PDF, like the IEP, orders, or immunization record, so it's with you at every office.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => add()}>
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.emptyButtonText}>Add Document</Text>
          </TouchableOpacity>
        </View>
      )}

      {FOLDERS.map((folder) => {
        const items = docs.filter((d) => d.folder === folder.id && matches(d));
        if (q && items.length === 0) return null;
        const ideas = DOCUMENT_SUGGESTIONS[folder.id].slice(0, 3).join(', ');
        return (
          <View key={folder.id}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIcon, { backgroundColor: folder.color }]}>
                <Ionicons name={folder.icon} size={13} color={COLORS.white} />
              </View>
              <Text style={styles.sectionHeader}>{folder.label.toUpperCase()}</Text>
              <Text style={styles.sectionCount}>{items.length || ''}</Text>
            </View>
            <View style={styles.group}>
              {items.map((d, i) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.row}
                  onPress={() => navigation.navigate('DocumentViewer', { document: d })}
                  activeOpacity={0.6}
                >
                  <Thumbnail uid={uid} doc={d} />
                  <View style={[styles.rowBody, i < items.length - 1 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name} numberOfLines={1}>{d.name}</Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {[new Date(d.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), formatSize(d.size)].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color={COLORS.tertiaryLabel} />
                  </View>
                </TouchableOpacity>
              ))}
              {items.length === 0 && (
                <TouchableOpacity style={styles.emptyRow} onPress={() => add(folder.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emptyRowText}>Add to {folder.label}</Text>
                    {!!ideas && <Text style={styles.meta}>Like {ideas}</Text>}
                  </View>
                  <Ionicons name="add" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      <View style={styles.privacy}>
        <Ionicons name="lock-closed" size={13} color={COLORS.secondaryLabel} />
        <Text style={styles.privacyText}>Documents are saved only on this device. Nothing is uploaded.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.groupedBackground,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  muted: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginHorizontal: 16,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.label,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fill,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginHorizontal: 16,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 17,
    color: COLORS.label,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 22,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.groupedBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.label,
    textAlign: 'center',
    marginTop: 14,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 6,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionHeader: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  thumb: {
    width: 44,
    height: 52,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: COLORS.groupedBackground,
  },
  fileThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.separator,
  },
  pdfLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 1,
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 14,
    minHeight: 72,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  name: {
    fontSize: 17,
    color: COLORS.label,
    fontWeight: '500',
  },
  meta: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  emptyRowText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 32,
  },
  privacyText: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginLeft: 5,
  },
});
