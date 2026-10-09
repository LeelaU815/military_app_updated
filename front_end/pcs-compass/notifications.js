import { Platform } from 'react-native';

// Local notifications on this device (reminders the app schedules itself, no server needed).
// These work in Expo Go too. expo-notifications is loaded lazily so the app still runs if it's missing.
function load() {
  try {
    return require('expo-notifications');
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Call once when the app starts. onOpen gets the notification's data when someone taps it.
export function setupNotifications(onOpen) {
  const Notifications = load();
  if (!Notifications) return () => {};
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    }).catch(() => {});
  }
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    onOpen(response.notification.request.content.data || {});
  });
  return () => subscription.remove();
}

// 'granted', 'denied', 'undetermined', or 'unavailable'
export async function notificationStatus() {
  const Notifications = load();
  if (!Notifications) return 'unavailable';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    return 'unavailable';
  }
}

export async function askForNotifications() {
  const Notifications = load();
  if (!Notifications) return 'unavailable';
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  } catch (error) {
    return 'unavailable';
  }
}

// Replaces every scheduled reminder with this list ({ date, title, body, data }).
export async function scheduleReminders(reminders, badge) {
  const Notifications = load();
  if (!Notifications || (await notificationStatus()) !== 'granted') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of reminders) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body, data: r.data, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: r.date,
        channelId: Platform.OS === 'android' ? 'reminders' : undefined,
      },
    });
  }
  await Notifications.setBadgeCountAsync(badge).catch(() => {});
}

// On log out, so the next person on this iPad doesn't get your reminders.
export async function clearReminders() {
  const Notifications = load();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.log(error);
  }
}
