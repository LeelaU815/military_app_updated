import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCurrentUser, loadProfile } from './storage';
import { MONTH_NAMES, installationName, disabilityLabel, displayAge } from './constants';
import AccountButton from './components/AccountButton';
import { COLORS } from './theme';

// Settings-style shortcuts to each tab (icon colors from Apple's system palette).
const QUICK_ACTIONS = [
  { label: 'Map & Discovery', icon: 'map', color: '#007AFF', tab: 'MapTab' },
  { label: 'Checklists', icon: 'checkbox', color: '#34C759', tab: 'ChecklistsTab' },
  { label: 'Documents', icon: 'document-text', color: '#5856D6', tab: 'DocumentsTab' },
  { label: 'Calendar', icon: 'calendar', color: '#FF3B30', tab: 'CalendarTab' },
  { label: 'Contacts', icon: 'people', color: '#FF9500', tab: 'ContactsTab' },
  { label: 'Alerts', icon: 'notifications', color: '#FF2D55', tab: 'AlertsTab' },
];

function daysUntil(month, day, year) {
  if (!month || !day || !year) return null;
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(month, day, year) {
  if (!month || !day || !year) return null;
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

function ListRow({ icon, color, label, value, onPress, last }) {
  return (
    <TouchableOpacity style={styles.listRow} onPress={onPress} disabled={!onPress} activeOpacity={0.6}>
      {icon && (
        <View style={[styles.iconSquare, { backgroundColor: color }]}>
          <Ionicons name={icon} size={17} color={COLORS.white} />
        </View>
      )}
      <View style={[styles.listRowBody, !last && styles.listRowBorder]}>
        <Text style={styles.listLabel}>{label}</Text>
        {!!value && <Text style={styles.listValue} numberOfLines={1}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={17} color={COLORS.tertiaryLabel} />}
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(await loadProfile(currentUser.uid));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.muted}>Loading...</Text>
      </View>
    );
  }

  // No profile yet, or they saved one partway through.
  if (!profile || profile.status === 'draft') {
    const isDraft = !!profile;
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.titleRow}>
          <Text style={styles.largeTitle}>Home</Text>
          <AccountButton navigation={navigation} color={COLORS.primary} showProfile={false} />
        </View>
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="person-add" size={30} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>{isDraft ? 'Finish your profile' : 'Create your family profile'}</Text>
          <Text style={styles.emptyText}>
            {isDraft
              ? "You're partway there. Pick up where you left off."
              : 'It takes about 5 minutes and lets us rank schools and providers for your child.'}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('ProfileCreation')}>
            <Text style={styles.primaryButtonText}>{isDraft ? 'Finish Profile' : 'Create Profile'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  let daysLabel = null;
  let reportDateText = null;
  let pcsFallbackMessage = 'PCS date not set yet';

  if (profile.pcsDateType === 'Date') {
    const days = daysUntil(profile.pcsMonth, profile.pcsDay, profile.pcsYear);
    if (days !== null) {
      daysLabel = days >= 0 ? days : 0;
      reportDateText = formatDate(profile.pcsMonth, profile.pcsDay, profile.pcsYear);
      if (days < 0) pcsFallbackMessage = 'PCS date has passed';
    }
  } else if (profile.pcsDateType === 'Timeframe') {
    const days = daysUntil(profile.pcsStartMonth, profile.pcsStartDay, profile.pcsStartYear);
    if (days !== null) {
      daysLabel = days >= 0 ? days : 0;
      reportDateText = `Earliest: ${formatDate(profile.pcsStartMonth, profile.pcsStartDay, profile.pcsStartYear)}`;
      if (days < 0) pcsFallbackMessage = 'PCS window has begun';
    }
  }

  const installationDisplay = installationName(profile.installation);
  const age = displayAge(profile);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}
    >
      <View style={styles.titleRow}>
        <Text style={styles.largeTitle}>Home</Text>
        <AccountButton navigation={navigation} color={COLORS.primary} />
      </View>
      <Text style={styles.greeting}>
        Welcome back{profile.familyLastName ? `, ${profile.familyLastName} family` : ''}
      </Text>

      {/* The one bold card on the screen: the PCS countdown. */}
      <LinearGradient colors={[COLORS.gradientTop, COLORS.gradientBottom]} style={styles.hero}>
        {installationDisplay && <Text style={styles.heroLabel}>{installationDisplay.toUpperCase()}</Text>}
        {daysLabel !== null ? (
          <>
            <View style={styles.heroRow}>
              <Text style={styles.heroNumber}>{daysLabel}</Text>
              <Text style={styles.heroUnit}>{daysLabel === 1 ? 'day' : 'days'} until PCS</Text>
            </View>
            {reportDateText && <Text style={styles.heroDate}>{reportDateText}</Text>}
          </>
        ) : (
          <Text style={styles.heroFallback}>{pcsFallbackMessage}</Text>
        )}
      </LinearGradient>

      <Text style={styles.sectionHeader}>QUICK ACCESS</Text>
      <View style={styles.group}>
        {QUICK_ACTIONS.map((action, i) => (
          <ListRow
            key={action.tab}
            icon={action.icon}
            color={action.color}
            label={action.label}
            onPress={() => navigation.navigate(action.tab)}
            last={i === QUICK_ACTIONS.length - 1}
          />
        ))}
      </View>

      <Text style={styles.sectionHeader}>{(profile.name || 'FAMILY MEMBER').toUpperCase()}</Text>
      <View style={styles.group}>
        <ListRow label="Age" value={age} />
        <ListRow label="Needs" value={disabilityLabel(profile)} />
        <ListRow label="Coverage" value={profile.insurance ? `TRICARE ${profile.insurance}` : 'Not set'} />
        <ListRow label="EFMP" value={profile.efmpStatus} />
        <ListRow label="View full profile" onPress={() => navigation.navigate('Profile')} last />
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
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
  greeting: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    marginHorizontal: 16,
    marginTop: 2,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.label,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 21,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 36,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 20,
  },
  heroLabel: {
    color: COLORS.subtle,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  heroNumber: {
    color: COLORS.gold,
    fontSize: 56,
    fontWeight: '700',
    marginRight: 8,
  },
  heroUnit: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  heroDate: {
    color: COLORS.subtle,
    fontSize: 14,
    marginTop: 2,
  },
  heroFallback: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 28,
    marginBottom: 6,
    marginHorizontal: 32,
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  iconSquare: {
    width: 29,
    height: 29,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listRowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 14,
    minHeight: 46,
  },
  listRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  listLabel: {
    flex: 1,
    fontSize: 17,
    color: COLORS.label,
  },
  listValue: {
    fontSize: 17,
    color: COLORS.secondaryLabel,
    marginLeft: 12,
    maxWidth: '60%',
    textAlign: 'right',
  },
});
