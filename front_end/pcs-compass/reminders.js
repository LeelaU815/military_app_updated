import { getCurrentUser, loadProfile, loadSavedLocations, loadChecklistProgress, loadEvents } from './storage';
import { buildAlerts, buildReminders, badgeCount } from './alerts';
import { scheduleReminders } from './notifications';

// Keeps the Alerts tab badge and the scheduled phone notifications up to date.
// The tab bar calls refreshAlerts() whenever you switch tabs or come back from an editor.

let listeners = [];
let lastRun = 0;

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
    const [profile, saved, progress, events] = await Promise.all([
      loadProfile(user.uid),
      loadSavedLocations(user.uid),
      loadChecklistProgress(user.uid),
      loadEvents(user.uid),
    ]);
    if (!profile || profile.status !== 'complete') {
      listeners.forEach((l) => l(0));
      return null;
    }
    const alerts = buildAlerts(profile, saved, progress, events);
    const badge = badgeCount(alerts);
    listeners.forEach((l) => l(badge));
    scheduleReminders(buildReminders(profile, saved, progress, events), badge).catch((error) => console.log(error));
    return { profile, saved, progress, events, alerts };
  } catch (error) {
    console.log(error);
    return null;
  }
}
