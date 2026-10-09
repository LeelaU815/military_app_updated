import { Platform, Alert } from 'react-native';

// Adds an event to the iPad/iPhone Calendar app (or Google Calendar on Android).
// Uses expo-calendar's older API, which also runs inside Expo Go. It's loaded lazily so that if the
// native part is missing for some reason, the rest of the app still works and we just show a message.
function loadCalendar() {
  try {
    return require('expo-calendar/legacy');
  } catch (error) {
    console.log(error);
    return null;
  }
}

// details: { title, start: Date, end: Date, allDay, location, notes }
export async function addToDeviceCalendar(details) {
  const Calendar = loadCalendar();
  if (!Calendar) {
    Alert.alert('Not available here', "Adding to your Calendar app isn't available in this version of the app.");
    return false;
  }
  const event = {
    title: details.title,
    startDate: details.start,
    endDate: details.end,
    allDay: !!details.allDay,
    location: details.location || undefined,
    notes: details.notes || undefined,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    alarms: details.allDay ? [] : [{ relativeOffset: -60 }],
  };
  try {
    if (Platform.OS === 'ios') {
      // Opens Apple's own "New Event" sheet already filled in, so they can check it and tap Add.
      const result = await Calendar.createEventInCalendarAsync(event);
      return result.action === 'saved';
    }
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Calendar access is off', 'Turn on calendar access for this app in Settings to add events.');
      return false;
    }
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const target = calendars.find((c) => c.isPrimary && c.allowsModifications) || calendars.find((c) => c.allowsModifications);
    if (!target) {
      Alert.alert('No calendar found', "Couldn't find a calendar on this device to add to.");
      return false;
    }
    await Calendar.createEventAsync(target.id, event);
    Alert.alert('Added', `${details.title} is in your calendar.`);
    return true;
  } catch (error) {
    console.log(error);
    Alert.alert('Not available here', "Couldn't open your Calendar app from this version of the app.");
    return false;
  }
}
