import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCurrentUser, loadProfile, loadSavedLocations, loadChecklistProgress, loadEvents } from './storage';
import { MONTH_NAMES, installationName, disabilityLabel, displayAge } from './constants';
import { estimatedGrade } from './scoring';
import { buildChecklist } from './checklists';
import { dateKey, formatTime, KIND_STYLE } from './calendar';
import AccountButton from './components/AccountButton';
import { COLORS, STAGE_STYLE } from './theme';

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

function gradeText(grade) {
  if (grade === null || grade > 12) return null;
  if (grade < 0) return 'Pre-K';
  if (grade === 0) return 'Kindergarten';
  const suffix = grade === 1 ? 'st' : grade === 2 ? 'nd' : grade === 3 ? 'rd' : 'th';
  return `${grade}${suffix} grade`;
}

// The small "what needs doing" banner: the next unfinished task, plus an appointment if one is today or tomorrow.
function upNext(profile, saved, progress, events) {
  const rows = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  const appointment = events
    .filter((e) => e.date === dateKey(today) || e.date === dateKey(tomorrow))
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))[0];
  if (appointment) {
    const when = appointment.date === dateKey(today) ? 'Today' : 'Tomorrow';
    rows.push({
      key: 'event',
      tab: 'CalendarTab',
      icon: 'time',
      color: KIND_STYLE.event.color,
      label: [when, formatTime(appointment.time)].filter(Boolean).join(' · '),
      title: appointment.title,
    });
  }

  const open = buildChecklist(profile, saved, progress).filter((t) => !t.done);
  const next = open[0];
  if (next) {
    const overdue = open.filter((t) => t.due && t.due < today).length;
    const days = next.due ? Math.round((next.due - today) / 86400000) : null;
    let label = 'Next up';
    let color = STAGE_STYLE[next.stage].color;
    if (overdue) {
      label = overdue > 1 ? `Overdue · ${overdue} tasks` : 'Overdue';
      color = '#FF3B30';
    } else if (days === 0) {
      label = 'Due today';
      color = '#FF9500';
    } else if (days !== null && days <= 7) {
      label = `Due in ${days} day${days === 1 ? '' : 's'}`;
      color = '#FF9500';
    } else if (next.due) {
      label = `Next up · due ${MONTH_NAMES[next.due.getMonth()].slice(0, 3)} ${next.due.getDate()}`;
    }
    rows.push({ key: 'task', tab: 'ChecklistsTab', icon: overdue ? 'alert-circle' : 'checkbox', color, label, title: next.title });
  }
  return rows;
}

const EFMP_COLORS = { Enrolled: '#34C759', Pending: '#FF9500', 'Not Enrolled': '#FF3B30' };

// Five little bars for a 1-5 rating.
function Meter({ value }) {
  return (
    <View style={styles.meter}>
      {[1, 2, 3, 4, 5].map((n) => (
        <View key={n} style={[styles.meterBar, n <= (value || 0) && styles.meterBarOn]} />
      ))}
    </View>
  );
}

function Stat({ label, children }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const columns = width >= 768 ? 6 : 3;
  const [profile, setProfile] = useState(null);
  const [banner, setBanner] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const [p, saved, progress, events] = await Promise.all([
        loadProfile(currentUser.uid),
        loadSavedLocations(currentUser.uid),
        loadChecklistProgress(currentUser.uid),
        loadEvents(currentUser.uid),
      ]);
      setProfile(p);
      setBanner(p && p.status === 'complete' ? upNext(p, saved, progress, events) : []);
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
  const grade = gradeText(estimatedGrade(profile));
  const firstName = (profile.name || '').trim().split(' ')[0] || 'Family member';
  const initials = (profile.name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const tileWidth = (width - 32 - (columns - 1) * 10) / columns;

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

      {banner.length > 0 && (
        <View style={styles.banner}>
          {banner.map((row, i) => (
            <TouchableOpacity
              key={row.key}
              style={[styles.bannerRow, i > 0 && styles.bannerBorder]}
              onPress={() => navigation.navigate(row.tab)}
              activeOpacity={0.6}
            >
              <View style={[styles.bannerIcon, { backgroundColor: row.color }]}>
                <Ionicons name={row.icon} size={16} color={COLORS.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerLabel, { color: row.color }]}>{row.label.toUpperCase()}</Text>
                <Text style={styles.bannerTitle} numberOfLines={2}>{row.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={COLORS.tertiaryLabel} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.sectionHeader}>QUICK ACCESS</Text>
      <View style={styles.tiles}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.tab}
            style={[styles.tile, { width: tileWidth }]}
            onPress={() => navigation.navigate(action.tab)}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIcon, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon} size={20} color={COLORS.white} />
            </View>
            <Text style={styles.tileLabel} numberOfLines={2}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionHeader}>{`${firstName}'s overview`.toUpperCase()}</Text>
      <TouchableOpacity style={styles.overview} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
        <View style={styles.overviewTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.overviewName}>{profile.name}</Text>
            <Text style={styles.overviewSub}>
              {[age && `Age ${age}`, grade].filter(Boolean).join('  ·  ') || 'Profile'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.tertiaryLabel} />
        </View>

        <View style={styles.needsPill}>
          <Ionicons name="heart" size={15} color={COLORS.primary} />
          <Text style={styles.needsText}>{disabilityLabel(profile) || 'Needs not set'}</Text>
        </View>

        <View style={styles.statRow}>
          <Stat label="TRICARE">
            <Text style={styles.statValue}>{profile.insurance || 'Not set'}</Text>
          </Stat>
          <Stat label="EFMP">
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: EFMP_COLORS[profile.efmpStatus] || COLORS.tertiaryLabel }]} />
              <Text style={styles.statValue}>{profile.efmpStatus || 'Not set'}</Text>
            </View>
          </Stat>
        </View>
        <View style={styles.statRow}>
          <Stat label="IEP / 504">
            <Meter value={profile.iepImportance} />
          </Stat>
          <Stat label="RESPITE CARE">
            <Meter value={profile.respiteImportance} />
          </Stat>
        </View>
      </TouchableOpacity>
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
  banner: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bannerBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
  bannerIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.label,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 28,
    marginBottom: 6,
    marginHorizontal: 32,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    gap: 10,
  },
  tile: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.label,
    marginTop: 10,
  },
  overview: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginHorizontal: 16,
    padding: 16,
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  overviewName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.label,
  },
  overviewSub: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  needsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.groupedBackground,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  needsText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.label,
    marginLeft: 8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: COLORS.groupedBackground,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.secondaryLabel,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  meter: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
    marginBottom: 2,
  },
  meterBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.fill,
  },
  meterBarOn: {
    backgroundColor: COLORS.primary,
  },
});
