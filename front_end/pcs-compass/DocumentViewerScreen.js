import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';

import { getCurrentUser } from './storage';
import { FOLDERS, loadStoredDocuments, deleteStoredDocument, fileFor, isImage, isPdf, formatSize } from './documentStore';
import { COLORS } from './theme';

// Shows one saved document. Photos can be pinched to zoom; PDFs open inside the app on iPad/iPhone.
// Share sends it to email, AirDrop, Files, or a printer.

const RED = '#FF3B30';

export default function DocumentViewerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [doc, setDoc] = useState(route.params.document);
  const [uid, setUid] = useState(null);

  // Pick up changes after editing.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const user = await getCurrentUser();
        if (!user) return;
        setUid(user.uid);
        const fresh = (await loadStoredDocuments(user.uid)).find((d) => d.id === route.params.document.id);
        if (fresh) setDoc(fresh);
      })().catch((error) => console.log(error));
    }, [route.params.document.id])
  );

  const file = uid ? fileFor(uid, doc) : null;
  const folder = FOLDERS.find((f) => f.id === doc.folder) || FOLDERS[FOLDERS.length - 1];

  const share = async () => {
    try {
      await Sharing.shareAsync(file.uri, { mimeType: doc.mimeType || undefined, dialogTitle: doc.name });
    } catch (error) {
      console.log(error);
      Alert.alert('Error', "Couldn't share that document.");
    }
  };

  const remove = () => {
    Alert.alert('Delete this document?', `${doc.name} will be removed from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteStoredDocument(uid, doc);
          navigation.goBack();
        },
      },
    ]);
  };

  let body = null;
  if (file && !file.exists) {
    body = <Text style={styles.missing}>This file is missing from the device.</Text>;
  } else if (file && isImage(doc)) {
    body = (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        maximumZoomScale={5}
        minimumZoomScale={1}
        centerContent
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <Image source={{ uri: file.uri }} style={{ flex: 1, minHeight: 300 }} resizeMode="contain" />
      </ScrollView>
    );
  } else if (file && isPdf(doc) && Platform.OS === 'ios') {
    body = (
      <WebView
        source={{ uri: file.uri }}
        originWhitelist={['*']}
        allowFileAccess
        allowingReadAccessToURL={file.parentDirectory.uri}
        style={{ flex: 1, backgroundColor: COLORS.groupedBackground }}
      />
    );
  } else if (file) {
    // Android can't show PDFs inside the app, so hand it to a PDF app.
    body = (
      <View style={styles.fileCard}>
        <Ionicons name="document-text" size={56} color={RED} />
        <Text style={styles.fileName}>{doc.name}</Text>
        <TouchableOpacity style={styles.openButton} onPress={share}>
          <Text style={styles.openButtonText}>Open in Another App</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.navLink, { fontWeight: '600' }]}>Done</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{doc.name}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DocumentEditor', { document: doc })} hitSlop={10}>
          <Text style={styles.navLink}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewer}>{body}</View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <View style={[styles.folderIcon, { backgroundColor: folder.color }]}>
            <Ionicons name={folder.icon} size={12} color={COLORS.white} />
          </View>
          <Text style={styles.infoText}>
            {[folder.label, new Date(doc.addedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }), formatSize(doc.size)].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {!!doc.notes && <Text style={styles.notes}>{doc.notes}</Text>}
      </View>

      <View style={[styles.toolbar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity onPress={share} hitSlop={10} accessibilityLabel="Share" disabled={!file}>
          <Ionicons name="share-outline" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={remove} hitSlop={10} accessibilityLabel="Delete" disabled={!uid}>
          <Ionicons name="trash-outline" size={25} color={RED} />
        </TouchableOpacity>
      </View>
    </View>
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
    paddingBottom: 10,
    gap: 12,
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'center',
  },
  navLink: {
    fontSize: 17,
    color: COLORS.primary,
  },
  viewer: {
    flex: 1,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  missing: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 60,
  },
  fileCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fileName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
    marginTop: 12,
    textAlign: 'center',
  },
  openButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginTop: 18,
  },
  openButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIcon: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
  },
  notes: {
    fontSize: 15,
    color: COLORS.label,
    marginTop: 8,
    lineHeight: 20,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 12,
  },
});
