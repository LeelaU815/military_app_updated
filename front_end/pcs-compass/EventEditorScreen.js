import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getCurrentUser, saveEvent, deleteEvent } from './storage';
import { parseDate, formatDateKey } from './checklists';
import { addToDeviceCalendar } from './deviceCalendar';
import { SCHOOLS, PROVIDERS } from './data';
import WheelDatePicker from './components/WheelDatePicker';
import { COLORS } from './theme';

// Slides up from Calendar to add or edit an appointment.

const PURPLE = '#AF52DE';
const RED = '#FF3B30';
const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => thisYear + i);
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

// '14:30' <-> { hour: 2, minute: 30, pm: true }
function splitTime(time) {
  if (!time) return { hour: 9, minute: 0, pm: false };
  const [h, m] = time.split(':').map(Number);
  return { hour: h % 12 || 12, minute: m, pm: h >= 12 };
}

function joinTime(hour, minute, pm) {
  const h = (hour % 12) + (pm ? 12 : 0);
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export default function EventEditorScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existing = route.params.event; // null when adding
  const places = [...SCHOOLS, ...PROVIDERS].filter((p) => (route.params.placeIds || []).includes(p.id));

  const startDate = parseDate(existing ? existing.date : route.params.date);
  const startTime = splitTime(existing ? existing.time : null);
  const [title, setTitle] = useState(existing ? existing.title : '');
  const [month, setMonth] = useState(startDate ? startDate.getMonth() + 1 : null);
  const [day, setDay] = useState(startDate ? startDate.getDate() : null);
  const [year, setYear] = useState(startDate ? startDate.getFullYear() : null);
  const [allDay, setAllDay] = useState(existing ? !existing.time : false);
  const [hour, setHour] = useState(startTime.hour);
  const [minute, setMinute] = useState(startTime.minute);
  const [pm, setPm] = useState(startTime.pm);
  const [placeId, setPlaceId] = useState(existing ? existing.placeId || null : null);
  const [location, setLocation] = useState(existing ? existing.location || '' : '');
  const [notes, setNotes] = useState(existing ? existing.notes || '' : '');
  const [saving, setSaving] = useState(false);

  const pickPlace = (place) => {
    if (placeId === place.id) {
      setPlaceId(null);
      return;
    }
    setPlaceId(place.id);
    setLocation(`${place.name}, ${place.address}`);
  };

  // Checks the form and returns what gets saved, or null if something's missing.
  const collect = () => {
    if (!title.trim()) {
      Alert.alert('Add a title', 'What is the appointment?');
      return null;
    }
    const date = formatDateKey(year, month, day);
    if (!date) {
      Alert.alert('Pick a full date', 'Choose a month, day, and year.');
      return null;
    }
    return {
      title: title.trim(),
      date,
      time: allDay ? null : joinTime(hour, minute, pm),
      placeId,
      location: location.trim(),
      notes: notes.trim(),
    };
  };

  const save = async () => {
    const fields = collect();
    if (!fields) return;
    setSaving(true);
    try {
      const user = await getCurrentUser();
      await saveEvent(user.uid, fields, existing ? existing.id : null);
      navigation.goBack(); // Calendar reloads when it comes back into view
    } catch (error) {
      Alert.alert('Error', "Couldn't save that appointment. Try again.");
      console.log(error);
      setSaving(false);
    }
  };

  const addToCalendarApp = () => {
    const fields = collect();
    if (!fields) return;
    const start = parseDate(fields.date);
    let end = start;
    if (fields.time) {
      const [h, m] = fields.time.split(':').map(Number);
      start.setHours(h, m);
      end = new Date(start.getTime() + 60 * 60000); // an hour long; they can change it in the Calendar app
    }
    addToDeviceCalendar({
      title: fields.title,
      start,
      end,
      allDay: !fields.time,
      location: fields.location,
      notes: fields.notes,
    });
  };

  const remove = () => {
    Alert.alert('Delete this appointment?', existing.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const user = await getCurrentUser();
            await deleteEvent(user.uid, existing.id);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', "Couldn't delete that appointment. Try again.");
            console.log(error);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.navLink}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{existing ? 'Edit Appointment' : 'New Appointment'}</Text>
        <TouchableOpacity onPress={save} disabled={saving} hitSlop={10}>
          <Text style={[styles.navLink, { fontWeight: '600' }, saving && { opacity: 0.5 }]}>
            {saving ? 'Saving' : existing ? 'Done' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.group}>
          <TextInput
            style={[styles.input, styles.titleInput]}
            placeholder="Title (e.g. IEP meeting, OT evaluation)"
            placeholderTextColor={COLORS.tertiaryLabel}
            value={title}
            onChangeText={setTitle}
            autoFocus={!existing}
          />
        </View>

        <Text style={styles.sectionHeader}>DATE</Text>
        <WheelDatePicker
          month={month}
          day={day}
          year={year}
          onChangeMonth={setMonth}
          onChangeDay={setDay}
          onChangeYear={setYear}
          yearRange={YEARS}
        />

        <View style={[styles.group, { marginTop: 24 }]}>
          <View style={styles.switchRow}>
            <View style={[styles.iconSquare, { backgroundColor: PURPLE }]}>
              <Ionicons name="time" size={16} color={COLORS.white} />
            </View>
            <Text style={styles.switchLabel}>All day</Text>
            <Switch value={allDay} onValueChange={setAllDay} trackColor={{ true: '#34C759' }} />
          </View>
        </View>
        {!allDay && (
          <View style={styles.timeRow}>
            <Picker selectedValue={hour} style={styles.picker} itemStyle={styles.pickerItem} onValueChange={setHour}>
              {HOURS.map((h) => <Picker.Item key={h} label={String(h)} value={h} color={COLORS.label} />)}
            </Picker>
            <Picker selectedValue={minute} style={styles.picker} itemStyle={styles.pickerItem} onValueChange={setMinute}>
              {MINUTES.map((m) => <Picker.Item key={m} label={String(m).padStart(2, '0')} value={m} color={COLORS.label} />)}
            </Picker>
            <Picker selectedValue={pm ? 'pm' : 'am'} style={styles.picker} itemStyle={styles.pickerItem} onValueChange={(v) => setPm(v === 'pm')}>
              <Picker.Item label="AM" value="am" color={COLORS.label} />
              <Picker.Item label="PM" value="pm" color={COLORS.label} />
            </Picker>
          </View>
        )}

        <Text style={styles.sectionHeader}>WHERE</Text>
        {places.length > 0 && (
          <View style={styles.chips}>
            {places.map((p) => {
              const active = p.id === placeId;
              return (
                <TouchableOpacity key={p.id} style={[styles.chip, active && styles.chipActive]} onPress={() => pickPlace(p)}>
                  <Ionicons name="location" size={13} color={active ? COLORS.white : COLORS.secondaryLabel} style={{ marginRight: 4 }} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{p.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={[styles.group, places.length > 0 && { marginTop: 10 }]}>
          <TextInput
            style={[styles.input, styles.titleInput]}
            placeholder="Location"
            placeholderTextColor={COLORS.tertiaryLabel}
            value={location}
            onChangeText={setLocation}
          />
        </View>
        {places.length === 0 && (
          <Text style={styles.hint}>Places you choose on the Map show up here so you can pick them.</Text>
        )}

        <View style={[styles.group, { marginTop: 24 }]}>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notes (what to bring, who you're meeting)"
            placeholderTextColor={COLORS.tertiaryLabel}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <TouchableOpacity style={[styles.group, styles.buttonRow]} onPress={addToCalendarApp}>
          <Ionicons name="calendar" size={18} color={RED} />
          <Text style={styles.buttonText}>Add to Calendar App</Text>
        </TouchableOpacity>

        {existing && (
          <TouchableOpacity style={[styles.group, styles.buttonRow, { justifyContent: 'center' }]} onPress={remove}>
            <Text style={[styles.buttonText, { color: RED, marginLeft: 0 }]}>Delete Appointment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.groupedBackground,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  navLink: {
    fontSize: 17,
    color: COLORS.primary,
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    fontSize: 17,
    color: COLORS.label,
    paddingHorizontal: 16,
  },
  titleInput: {
    paddingVertical: 14,
  },
  notesInput: {
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconSquare: {
    width: 29,
    height: 29,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 17,
    color: COLORS.label,
  },
  timeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  picker: {
    flex: 1,
  },
  pickerItem: {
    fontSize: 20,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    maxWidth: '100%',
  },
  chipActive: {
    backgroundColor: PURPLE,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.label,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  hint: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 8,
    marginLeft: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 17,
    color: COLORS.primary,
    marginLeft: 10,
  },
});
