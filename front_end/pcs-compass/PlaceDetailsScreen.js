import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCurrentUser, saveLocation, removeLocation } from './storage';

import { COLORS, TYPE_COLORS } from './theme';

// Slides up from the map when you tap "Details" on a place.

const CRITERIA_LABELS = {
  fit: (firstName) => `Fit for ${firstName}`,
  cost: () => 'Cost with your plan',
  proximity: () => 'Close to base',
  distance: () => 'Close to home',
};

function open(url) {
  Linking.openURL(url).catch(() => Alert.alert("Couldn't open that", url));
}

function callNumber(phone) {
  const main = phone.split(/ext/i)[0];
  open(`tel:${main.replace(/[^0-9+]/g, '')}`);
}

function openDirections(place) {
  const { lat, lng, name } = place;
  const url = Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`
    : `geo:0,0?q=${lat},${lng}(${encodeURIComponent(name)})`;
  open(url);
}

function Action({ icon, label, onPress, disabled }) {
  return (
    <TouchableOpacity style={[styles.action, disabled && { opacity: 0.35 }]} onPress={onPress} disabled={disabled}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color={COLORS.white} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function Row({ label, value, last }) {
  if (!value) return null;
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function PlaceDetailsScreen({ navigation, route }) {
  const { result, weights, firstName, sameType } = route.params;
  const [chosen, setChosen] = useState(!!route.params.chosen);
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  const toggleChosen = async () => {
    setBusy(true);
    try {
      const user = await getCurrentUser();
      if (chosen) await removeLocation(user.uid, result.place.id);
      else await saveLocation(user.uid, result);
      setChosen(!chosen);
    } catch (error) {
      Alert.alert('Error', "Couldn't update your places. Try again.");
      console.log(error);
    } finally {
      setBusy(false);
    }
  };
  const { place } = result;
  const isSchool = result.type === 'Schools';

  // Biggest share of the score first.
  const criteria = Object.keys(weights)
    .filter((id) => result.criteria[id] !== undefined)
    .sort((a, b) => weights[b] - weights[a]);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View />
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.done}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.type, { color: TYPE_COLORS[result.type] }]}>{result.type.toUpperCase()}</Text>
        <Text style={styles.title}>{place.name}</Text>
        {!!place.address && <Text style={styles.address}>{place.address}</Text>}

        <View style={styles.actions}>
          <Action icon="call" label="Call" onPress={() => callNumber(place.phone)} disabled={!place.phone} />
          <Action icon="navigate" label="Directions" onPress={() => openDirections(place)} />
          <Action icon="globe-outline" label="Website" onPress={() => open(place.source)} disabled={!place.source} />
        </View>

        <View style={styles.group}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreBig}>{result.score}% match</Text>
              <Text style={styles.scoreSub}>#{result.rank} of {sameType} {result.type.toLowerCase()} for {firstName}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>WHY THIS SCORE</Text>
        <View style={styles.group}>
          {criteria.map((id, i) => (
            <View key={id} style={[styles.criterion, i < criteria.length - 1 && styles.rowBorder]}>
              <View style={styles.criterionTop}>
                <Text style={styles.rowLabel}>{CRITERIA_LABELS[id](firstName)}</Text>
                <Text style={styles.weight}>{Math.round(weights[id] * 100)}% of score</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.round(result.criteria[id] * 100)}%` }]} />
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.footnote}>
          Weights come from how you ranked your priorities. {result.reasons.join(' · ')}.
        </Text>

        <Text style={styles.sectionHeader}>DETAILS</Text>
        <View style={styles.group}>
          <Row label="Phone" value={place.phone} />
          {isSchool && <Row label="Grades" value={place.grades} />}
          {isSchool && <Row label="Type" value={place.type === 'public' ? 'Public school' : 'Private school'} />}
          {isSchool && (
            <Row
              label="IEP / 504"
              value={place.iep504 === true ? 'Must follow IEPs and 504 plans' : 'Limited (private schools don\'t have to follow IEPs)'}
            />
          )}
          <Row label="Notes" value={place.notes} last />
        </View>

        {!!place.source && (
          <TouchableOpacity onPress={() => open(place.source)}>
            <Text style={styles.source}>Source: {place.source}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.footnote}>Distances are straight-line miles. Check with {place.name} that details are current.</Text>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[styles.bigButton, chosen && styles.bigButtonChosen]}
          onPress={toggleChosen}
          disabled={busy}
        >
          {chosen && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />}
          <Text style={[styles.bigButtonText, chosen && styles.bigButtonTextChosen]}>
            {busy ? 'Saving...' : chosen ? 'Chosen · Tap to remove' : 'Choose this location'}
          </Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  done: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  type: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.label,
    marginTop: 4,
  },
  address: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 18,
    marginBottom: 18,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
    marginTop: 6,
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scoreRow: {
    padding: 16,
  },
  scoreBig: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scoreSub: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 24,
    marginBottom: 6,
    marginLeft: 16,
  },
  criterion: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  criterionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weight: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.fill,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  rowLabel: {
    fontSize: 15,
    color: COLORS.label,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    marginTop: 3,
  },
  footnote: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 8,
    marginHorizontal: 16,
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.groupedBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
  bigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  bigButtonChosen: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  bigButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  bigButtonTextChosen: {
    color: COLORS.primary,
  },
  source: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 16,
    marginHorizontal: 16,
  },
});
