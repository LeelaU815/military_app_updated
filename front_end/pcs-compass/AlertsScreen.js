import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ALERT_GROUPS } from './alerts';
import { refreshAlerts } from './reminders';
import { notificationStatus, askForNotifications } from './notifications';
import { COLORS } from './theme';

// Everything that needs attention, grouped like Apple's Reminders: Today, This week, Coming up.
// Alerts can't be swiped away; they disappear when the task is done or the day has passed.

const GREEN = '#34C759';

function AlertRow({ alert, onPress, last }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.icon, { backgroundColor: alert.color }]}>
        <Ionicons name={alert.icon} size={17} color={COLORS.white} />
      </View>
      <View style={[styles.rowBody, !last && styles.rowBorder]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>{alert.title}</Text>
          <Text style={[styles.subtitle, { color: alert.color }]} numberOfLines={1}>{alert.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color={COLORS.tertiaryLabel} />
      </View>
    </TouchableOpacity>
  );
}

export default function AlertsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState(null); // null = no finished profile yet
  const [permission, setPermission] = useState('unavailable');

  const load = async () => {
    const [result, status] = await Promise.all([refreshAlerts({ force: true }), notificationStatus()]);
    setAlerts(result ? result.alerts : null);
    setPermission(status);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const turnOn = async () => {
    if (permission === 'denied') {
      Linking.openSettings().catch(() => {});
      return;
    }
    await askForNotifications();
    load(); // schedules the reminders now that we're allowed to
  };

  const open = (alert) => navigation.navigate(alert.target.tab, alert.target.date ? { date: alert.target.date } : undefined);

  if (loading) {
    return <View style={[styles.screen, styles.center]}><Text style={styles.muted}>Loading...</Text></View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}>
      <Text style={styles.largeTitle}>Alerts</Text>

      {(permission === 'undetermined' || permission === 'denied') && (
        <View style={styles.permissionCard}>
          <View style={[styles.icon, { backgroundColor: '#FF3B30' }]}>
            <Ionicons name="notifications" size={17} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Get reminders on this device</Text>
            <Text style={styles.permissionText}>
              {permission === 'denied'
                ? 'Notifications are turned off for this app. You can turn them on in Settings.'
                : 'For task due dates, appointments, and your PCS countdown, even when the app is closed.'}
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={turnOn}>
              <Text style={styles.permissionButtonText}>{permission === 'denied' ? 'Open Settings' : 'Turn On Notifications'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!alerts && (
        <Text style={styles.empty}>Finish your profile to get alerts for your move.</Text>
      )}

      {alerts && alerts.length === 0 && (
        <View style={styles.caughtUp}>
          <Ionicons name="checkmark-circle" size={52} color={GREEN} />
          <Text style={styles.caughtUpTitle}>You're all caught up</Text>
          <Text style={styles.caughtUpText}>Nothing is overdue or due in the next 30 days.</Text>
        </View>
      )}

      {alerts && ALERT_GROUPS.map((group) => {
        const items = alerts.filter((a) => a.group === group.id);
        if (items.length === 0) return null;
        return (
          <View key={group.id}>
            <Text style={styles.sectionHeader}>{group.label.toUpperCase()}</Text>
            <View style={styles.group}>
              {items.map((a, i) => (
                <AlertRow key={a.id} alert={a} onPress={() => open(a)} last={i === items.length - 1} />
              ))}
            </View>
          </View>
        );
      })}

      {alerts && permission === 'granted' && (
        <Text style={styles.footnote}>
          Reminders are on. You'll get one at 9 AM on each due date, an hour before appointments, and as your PCS date gets close.
        </Text>
      )}
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
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.label,
    marginTop: 8,
    marginHorizontal: 16,
  },
  permissionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
    marginTop: 3,
    lineHeight: 19,
  },
  permissionButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  empty: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 40,
    marginHorizontal: 32,
  },
  caughtUp: {
    alignItems: 'center',
    marginTop: 60,
    marginHorizontal: 32,
  },
  caughtUpTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
    marginTop: 12,
  },
  caughtUpText: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 26,
    marginBottom: 6,
    marginHorizontal: 32,
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
  icon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  title: {
    fontSize: 16,
    color: COLORS.label,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  footnote: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 12,
    marginHorizontal: 32,
    lineHeight: 18,
  },
});
