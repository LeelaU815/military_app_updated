import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, loadProfile } from './storage';
import { MONTH_NAMES, installationName, disabilityLabel } from './constants';
import { COLORS } from './theme';

const QUICK_ACTIONS = [
  { key: 'Map', label: 'Map & Discovery', icon: 'map-outline', tab: 'MapTab' },
  { key: 'Checklists', label: 'Checklists', icon: 'checkbox-outline' },
  { key: 'Documents', label: 'Documents', icon: 'document-text-outline' },
  { key: 'Contacts', label: 'Contacts', icon: 'people-outline', tab: 'ContactsTab' },
  { key: 'Calendar', label: 'Calendar', icon: 'calendar-outline' },
  { key: 'Alerts', label: 'Alerts', icon: 'notifications-outline', tab: 'AlertsTab' },
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

export default function DashboardScreen({ navigation }) {
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
      setProfile(await loadProfile(currentUser.email));
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

  const handleQuickAction = (action) => {
    if (action.tab) {
      navigation.navigate(action.tab);
      return;
    }
    Alert.alert(action.label, `${action.label} screen is coming soon.`);
  };

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.subtitle}>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>You haven't created a profile yet.</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('ProfileCreation')}
        >
          <Text style={styles.createButtonText}>Create Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  let daysLabel = null;
  let reportDateText = null;
  let pcsFallbackMessage = 'PCS date not yet set';

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
      reportDateText = `Earliest window: ${formatDate(profile.pcsStartMonth, profile.pcsStartDay, profile.pcsStartYear)}`;
      if (days < 0) pcsFallbackMessage = 'PCS window has begun';
    }
  }

  const installationDisplay = installationName(profile.installation);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <LinearGradient colors={[COLORS.gradientTop, COLORS.gradientBottom]} style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome back{profile.familyLastName ? `, ${profile.familyLastName} family` : ''}
        </Text>
        {installationDisplay && (
          <Text style={styles.installationText}>{installationDisplay} bound</Text>
        )}

        {daysLabel !== null ? (
          <View style={styles.pcsCard}>
            <View style={styles.pcsCardRow}>
              <Text style={styles.pcsNumber}>{daysLabel}</Text>
              <Text style={styles.pcsLabel}>DAYS{'\n'}UNTIL PCS</Text>
            </View>
            {reportDateText && <Text style={styles.pcsReportDate}>{reportDateText}</Text>}
          </View>
        ) : (
          <View style={styles.pcsCard}>
            <Text style={styles.pcsFallback}>{pcsFallbackMessage}</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.sectionHeading}>QUICK ACTIONS</Text>
        <View style={styles.grid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.gridCard}
              onPress={() => handleQuickAction(action)}
            >
              <Ionicons name={action.icon} size={24} color={COLORS.goldDark} />
              <Text style={styles.gridCardText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionHeading}>NEEDS PROFILE SUMMARY</Text>
            {profile.efmpStatus && (
              <View style={styles.efmpBadge}>
                <Text style={styles.efmpBadgeText}>{profile.efmpStatus}</Text>
              </View>
            )}
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Family member</Text>
            <Text style={styles.summaryValue}>
              {profile.name}{profile.age ? ` · Age ${profile.age}` : ''}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Category</Text>
            <Text style={styles.summaryValue}>
              {disabilityLabel(profile)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Coverage</Text>
            <Text style={styles.summaryValue}>
              {profile.insurance ? `TRICARE ${profile.insurance}` : 'Not set'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyState: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  welcomeText: {
    color: COLORS.subtle,
    fontSize: 15,
    marginBottom: 4,
  },
  installationText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  pcsCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 20,
  },
  pcsCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  pcsNumber: {
    color: COLORS.gold,
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: 10,
  },
  pcsLabel: {
    color: COLORS.subtle,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  pcsReportDate: {
    color: COLORS.gold,
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  pcsFallback: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionHeading: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '31.5%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  gridCardText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  efmpBadge: {
    backgroundColor: COLORS.gradientTop,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  efmpBadgeText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});