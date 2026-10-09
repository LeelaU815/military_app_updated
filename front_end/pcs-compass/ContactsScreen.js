import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getCurrentUser, loadProfile, loadSavedLocations, loadContacts } from './storage';
import { buildContacts, matchesSearch, initials } from './contacts';
import { COLORS } from './theme';

function ContactRow({ contact, onPress, last }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.avatar, { backgroundColor: contact.color }]}>
        <Text style={styles.avatarText}>{initials(contact.name)}</Text>
      </View>
      <View style={[styles.rowBody, !last && styles.rowBorder]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{contact.name}</Text>
          {!!contact.subtitle && <Text style={styles.subtitle} numberOfLines={1}>{contact.subtitle}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={17} color={COLORS.tertiaryLabel} />
      </View>
    </TouchableOpacity>
  );
}

export default function ContactsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [showMore, setShowMore] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const user = await getCurrentUser();
          if (!user) return;
          const [profile, saved, custom] = await Promise.all([
            loadProfile(user.uid),
            loadSavedLocations(user.uid),
            loadContacts(user.uid),
          ]);
          setData(profile && profile.status === 'complete' ? buildContacts(profile, saved, custom) : null);
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const open = (contact) => navigation.navigate('ContactDetails', { contact });
  const searching = query.trim().length > 0;

  if (loading) {
    return <View style={[styles.screen, styles.center]}><Text style={styles.muted}>Loading...</Text></View>;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.titleRow}>
        <Text style={styles.largeTitle}>Contacts</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ContactEditor', { contact: null })} hitSlop={10} accessibilityLabel="Add contact">
          <Ionicons name="add-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

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

      {!data && (
        <Text style={styles.empty}>Finish your profile to see the contacts for your base.</Text>
      )}

      {data && data.sections.map((section) => {
        const items = section.items.filter((c) => matchesSearch(c, query));
        if (searching && items.length === 0) return null;
        return (
          <View key={section.id}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name={section.icon} size={13} color={COLORS.secondaryLabel} style={{ marginRight: 5 }} />
              <Text style={styles.sectionHeader}>{section.title.toUpperCase()}</Text>
            </View>
            <View style={styles.group}>
              {items.map((c, i) => (
                <ContactRow key={c.key} contact={c} onPress={() => open(c)} last={i === items.length - 1} />
              ))}
              {items.length === 0 && section.id === 'places' && (
                <TouchableOpacity style={styles.emptyRow} onPress={() => navigation.navigate('MapTab')}>
                  <Text style={styles.emptyRowText}>Choose schools and providers on the Map to add them here</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              {items.length === 0 && section.id === 'mine' && (
                <TouchableOpacity style={styles.emptyRow} onPress={() => navigation.navigate('ContactEditor', { contact: null })}>
                  <Text style={styles.emptyRowText}>Add teachers, doctors, or anyone helping with your move</Text>
                  <Ionicons name="add" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      {data && data.more.length > 0 && (() => {
        const items = data.more.filter((c) => matchesSearch(c, query));
        if (searching && items.length === 0) return null;
        const expanded = showMore || searching;
        return (
          <View style={[styles.group, { marginTop: 28 }]}>
            <TouchableOpacity style={styles.moreHeader} onPress={() => setShowMore(!showMore)} disabled={searching}>
              <View style={[styles.moreIcon]}>
                <Ionicons name="library" size={16} color={COLORS.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>More resources</Text>
                <Text style={styles.subtitle}>{items.length} for other kinds of needs</Text>
              </View>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.tertiaryLabel} />
            </TouchableOpacity>
            {expanded && (
              <View style={styles.moreList}>
                {items.map((c, i) => (
                  <ContactRow key={c.key} contact={c} onPress={() => open(c)} last={i === items.length - 1} />
                ))}
              </View>
            )}
          </View>
        );
      })()}
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
  empty: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 40,
    marginHorizontal: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 6,
    marginHorizontal: 32,
  },
  sectionHeader: {
    fontSize: 13,
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
    paddingLeft: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingRight: 14,
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
  subtitle: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
    marginTop: 1,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emptyRowText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.primary,
  },
  moreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  moreIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.secondaryLabel,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moreList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
});
