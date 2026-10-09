import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getCurrentUser, loadProfile, loadDocuments, setDocumentReady, deleteCustomDocument } from './storage';
import { buildDocuments, DOCUMENT_GROUPS } from './documents';
import SegmentedControl from './components/SegmentedControl';
import { COLORS } from './theme';

// The records to gather before the move, grouped like Settings. Check one off when it's in your binder.

const GREEN = '#34C759';
const RED = '#FF3B30';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'need', label: 'Still need' },
  { value: 'carry', label: 'Hand-carry' },
];

export default function DocumentsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState({});
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const user = await getCurrentUser();
          if (!user) return;
          setUid(user.uid);
          const [p, d] = await Promise.all([loadProfile(user.uid), loadDocuments(user.uid)]);
          setProfile(p);
          setSaved(d);
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const toggle = async (doc) => {
    const have = !doc.have;
    setSaved((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], have } }));
    try {
      await setDocumentReady(uid, doc.id, have);
    } catch (error) {
      Alert.alert('Error', "Couldn't save that. Check your connection and try again.");
      console.log(error);
    }
  };

  const openEditor = (doc) => navigation.navigate('DocumentEditor', { document: doc ? { id: doc.id, ...doc.fields } : null });

  const remove = (doc) => {
    Alert.alert('Delete this document?', doc.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaved((prev) => {
            const next = { ...prev };
            delete next[doc.id];
            return next;
          });
          try {
            await deleteCustomDocument(uid, doc.id);
          } catch (error) {
            console.log(error);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={[styles.screen, styles.center]}><Text style={styles.muted}>Loading...</Text></View>;
  }

  if (!profile || profile.status !== 'complete') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={styles.largeTitle}>Documents</Text>
        <View style={[styles.center, { paddingHorizontal: 40 }]}>
          <Ionicons name="document-text-outline" size={44} color={COLORS.tertiaryLabel} />
          <Text style={styles.emptyTitle}>Finish your profile first</Text>
          <Text style={styles.emptyText}>Your document list is built from your profile.</Text>
        </View>
      </View>
    );
  }

  const docs = buildDocuments(profile, saved);
  const ready = docs.filter((d) => d.have).length;
  const visible = docs.filter((d) => (filter === 'need' ? !d.have : filter === 'carry' ? d.handCarry : true));

  const renderDoc = (doc, last) => {
    const isOpen = expanded === doc.id;
    return (
      <View key={doc.id} style={!last && styles.rowBorder}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => toggle(doc)} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: doc.have }}>
            <Ionicons name={doc.have ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={doc.have ? GREEN : COLORS.tertiaryLabel} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rowBody} onPress={() => setExpanded(isOpen ? null : doc.id)} activeOpacity={0.6}>
            <Text style={[styles.title, doc.have && styles.titleDone]}>{doc.title}</Text>
            {doc.handCarry && (
              <View style={styles.tag}>
                <Ionicons name="briefcase" size={11} color={COLORS.primary} />
                <Text style={styles.tagText}>Hand-carry</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setExpanded(isOpen ? null : doc.id)} hitSlop={8}>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.tertiaryLabel} />
          </TouchableOpacity>
        </View>
        {isOpen && (
          <View style={styles.details}>
            {!!doc.details && <Text style={styles.detailsText}>{doc.details}</Text>}
            {doc.custom && !doc.details && <Text style={styles.detailsText}>A document you added.</Text>}
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.action, styles.actionPrimary]} onPress={() => toggle(doc)}>
                <Ionicons name={doc.have ? 'arrow-undo' : 'checkmark'} size={16} color={COLORS.white} />
                <Text style={styles.actionPrimaryText}>{doc.have ? 'Not ready' : 'I have it'}</Text>
              </TouchableOpacity>
              {!!doc.source && (
                <TouchableOpacity style={styles.action} onPress={() => Linking.openURL(doc.source).catch(() => {})}>
                  <Ionicons name="open-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.actionText}>Source</Text>
                </TouchableOpacity>
              )}
              {doc.custom && (
                <TouchableOpacity style={styles.action} onPress={() => openEditor(doc)}>
                  <Ionicons name="create-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
              )}
              {doc.custom && (
                <TouchableOpacity style={styles.action} onPress={() => remove(doc)}>
                  <Ionicons name="trash-outline" size={15} color={RED} />
                  <Text style={[styles.actionText, { color: RED }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}>
      <View style={styles.titleRow}>
        <Text style={styles.largeTitle}>Documents</Text>
        <TouchableOpacity onPress={() => openEditor(null)} hitSlop={10} accessibilityLabel="Add document">
          <Ionicons name="add-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>{ready} of {docs.length} ready</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${docs.length ? (ready / docs.length) * 100 : 0}%` }]} />
      </View>

      <View style={styles.filter}>
        <SegmentedControl options={FILTERS} selected={filter} onSelect={setFilter} />
      </View>

      {DOCUMENT_GROUPS.map((group) => {
        const items = visible.filter((d) => d.group === group.id);
        if (items.length === 0 && (group.id !== 'mine' || filter !== 'all')) return null;
        return (
          <View key={group.id}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIcon, { backgroundColor: group.color }]}>
                <Ionicons name={group.icon} size={13} color={COLORS.white} />
              </View>
              <Text style={styles.sectionHeader}>{group.label.toUpperCase()}</Text>
            </View>
            <View style={styles.group}>
              {items.map((d, i) => renderDoc(d, i === items.length - 1 && group.id !== 'mine'))}
              {group.id === 'mine' && (
                <TouchableOpacity style={styles.addRow} onPress={() => openEditor(null)}>
                  <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                  <Text style={styles.addText}>Add document</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      {filter !== 'all' && visible.length === 0 && (
        <Text style={styles.empty}>{filter === 'need' ? "You have everything. Nice work!" : 'Nothing here.'}</Text>
      )}

      <Text style={styles.footnote}>
        "Hand-carry" means the MyNavy HR PCS Guide says to keep it in a binder you carry with you instead of shipping it with your household goods.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.groupedBackground,
  },
  center: {
    flex: 1,
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
  subtitle: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    marginTop: 2,
    marginHorizontal: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.fill,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  filter: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 6,
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
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  rowBody: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    color: COLORS.label,
  },
  titleDone: {
    color: COLORS.tertiaryLabel,
    textDecorationLine: 'line-through',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.groupedBackground,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 5,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  details: {
    paddingLeft: 52,
    paddingRight: 16,
    paddingBottom: 14,
  },
  detailsText: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.groupedBackground,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionPrimary: {
    backgroundColor: GREEN,
  },
  actionPrimaryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  actionText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 10,
  },
  empty: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 30,
  },
  footnote: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 16,
    marginHorizontal: 32,
    lineHeight: 18,
  },
});
