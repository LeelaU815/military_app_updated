import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getCurrentUser, removeLocation, deleteContact } from './storage';
import { initials } from './contacts';
import { COLORS } from './theme';

// Slides up when you tap a contact. Works for chosen places, verified contacts, and your own contacts.

const RED = '#FF3B30';

function open(url) {
  Linking.openURL(url).catch(() => Alert.alert("Couldn't open that", url));
}

function directionsUrl(contact) {
  const target = contact.lat != null ? `${contact.lat},${contact.lng}` : encodeURIComponent(contact.address);
  return Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${target}`
    : `geo:0,0?q=${target}`;
}

function Action({ icon, label, onPress }) {
  const disabled = !onPress;
  return (
    <TouchableOpacity style={[styles.action, disabled && { opacity: 0.35 }]} onPress={onPress} disabled={disabled}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({ label, value, onPress, last }) {
  if (!value) return null;
  return (
    <TouchableOpacity style={[styles.field, !last && styles.fieldBorder]} onPress={onPress} disabled={!onPress} activeOpacity={0.6}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, onPress && { color: COLORS.primary }]}>{value}</Text>
    </TouchableOpacity>
  );
}

export default function ContactDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { contact } = route.params;
  const phoneDigits = contact.phone ? contact.phone.split(/ext/i)[0].replace(/[^0-9+]/g, '') : null;
  const call = phoneDigits ? () => open(`tel:${phoneDigits}`) : null;
  const email = contact.email ? () => open(`mailto:${contact.email}`) : null;
  const directions = contact.address || contact.lat != null ? () => open(directionsUrl(contact)) : null;
  const website = contact.website || contact.source ? () => open(contact.website || contact.source) : null;

  const removePlace = () => {
    Alert.alert(
      'Remove from My Places?',
      `${contact.name} will also come off your Map choices and its tasks will be removed from Checklists.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = await getCurrentUser();
              await removeLocation(user.uid, contact.placeId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', "Couldn't remove that place. Try again.");
              console.log(error);
            }
          },
        },
      ]
    );
  };

  const removeContact = () => {
    Alert.alert('Delete this contact?', contact.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const user = await getCurrentUser();
            await deleteContact(user.uid, contact.id);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', "Couldn't delete that contact. Try again.");
            console.log(error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.navBar}>
        {contact.kind === 'custom' ? (
          <TouchableOpacity onPress={() => navigation.replace('ContactEditor', { contact })} hitSlop={10}>
            <Text style={styles.navLink}>Edit</Text>
          </TouchableOpacity>
        ) : <View />}
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.navLink, { fontWeight: '600' }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: contact.color }]}>
            <Text style={styles.avatarText}>{initials(contact.name)}</Text>
          </View>
          <Text style={styles.name}>{contact.name}</Text>
          {!!contact.subtitle && <Text style={styles.subtitle}>{contact.subtitle}</Text>}
        </View>

        <View style={styles.actions}>
          <Action icon="call" label="Call" onPress={call} />
          <Action icon="mail" label="Email" onPress={email} />
          <Action icon="navigate" label="Directions" onPress={directions} />
          <Action icon="globe-outline" label="Website" onPress={website} />
        </View>

        <View style={styles.group}>
          <Field label="Phone" value={contact.phone} onPress={call} />
          <Field label="Email" value={contact.email} onPress={email} />
          <Field label="Address" value={contact.address} onPress={directions} />
          <Field label="Notes" value={contact.notes} last />
        </View>

        {contact.kind === 'verified' && !!contact.source && (
          <TouchableOpacity onPress={() => open(contact.source)}>
            <Text style={styles.source}>Verified from: {contact.source}</Text>
          </TouchableOpacity>
        )}
        {contact.kind === 'place' && (
          <Text style={styles.footnote}>Added when you chose this place on the Map.</Text>
        )}

        {contact.kind === 'place' && (
          <TouchableOpacity style={[styles.group, styles.dangerRow]} onPress={removePlace}>
            <Text style={styles.dangerText}>Remove from My Places</Text>
          </TouchableOpacity>
        )}
        {contact.kind === 'custom' && (
          <TouchableOpacity style={[styles.group, styles.dangerRow]} onPress={removeContact}>
            <Text style={styles.dangerText}>Delete Contact</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  navLink: {
    fontSize: 17,
    color: COLORS.primary,
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.label,
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 10,
  },
  actionLabel: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  fieldBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  fieldLabel: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
  },
  fieldValue: {
    fontSize: 17,
    color: COLORS.label,
    marginTop: 2,
  },
  source: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 10,
    marginHorizontal: 16,
  },
  footnote: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 10,
    marginHorizontal: 16,
  },
  dangerRow: {
    marginTop: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerText: {
    fontSize: 17,
    color: RED,
  },
});
