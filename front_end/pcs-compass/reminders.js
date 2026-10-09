import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCurrentUser, loadProfile, loadSavedLocations, loadChecklistProgress, loadEvents } from './storage';
import { buildAlerts, buildReminders, badgeCount, DEFAULT_SETTINGS } from './alerts';
import { scheduleReminders } from './notifications';

// Keeps the Alerts tab badge and the scheduled phone notifications up to date.
// The tab bar calls refreshAlerts() whenever you switch tabs or come back from an editor.

let listeners = [];
let lastRun = 0;

// Notification settings live on this device, since the reminders are scheduled on this device.
export async function loadNotificationSettings() {
  try {
    const saved = JSON.parse((await AsyncStorage.getItem('notificationSettings')) || '{}');
    // Older versions saved just an hour for task reminders.
    if (saved.taskHour != null && !saved.reminderTime) saved.reminderTime = `${String(saved.taskHour).padStart(2, '0')}:00`;
    delete saved.taskHour;
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveNotificationSettings(settings) {
  await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
  return refreshAlerts({ force: true }); // reschedule with the new settings
}

export function subscribeToBadge(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

// Loads everything once and returns { profile, saved, progress, events, alerts } (or null if there's no profile yet).
export async function refreshAlerts({ force = false } = {}) {
  // Switching tabs quickly shouldn't reload from Firebase every time.
  if (!force && Date.now() - lastRun < 3000) return null;
  lastRun = Date.now();
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    const [profile, saved, progress, events, settings] = await Promise.all([
      loadProfile(user.uid),
      loadSavedLocations(user.uid),
      loadChecklistProgress(user.uid),
      loadEvents(user.uid),
      loadNotificationSettings(),
    ]);
    if (!profile || profile.status !== 'complete') {
      listeners.forEach((l) => l(0));
      return null;
    }
    const alerts = buildAlerts(profile, saved, progress, events);
    const badge = badgeCount(alerts);
    listeners.forEach((l) => l(badge));
    const reminders = buildReminders(profile, saved, progress, events, new Date(), settings);
    scheduleReminders(reminders, settings.badge ? badge : 0).catch((error) => console.log(error));
    return { profile, saved, progress, events, alerts, settings };
  } catch (error) {
    console.log(error);
    return null;
  }
}
