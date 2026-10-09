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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getCurrentUser, addCustomTask, updateCustomTask } from './storage';
import { STAGES, TOPICS, parseDate, formatDateKey } from './checklists';
import { SCHOOLS, PROVIDERS } from './data';
import ChoiceRow from './components/ChoiceRow';
import WheelDatePicker from './components/WheelDatePicker';
import { COLORS } from './theme';

// Slides up from Checklists to add or edit one of your own tasks.

const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => thisYear + i);

export default function TaskEditorScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existing = route.params.task; // null when adding
  const places = [...SCHOOLS, ...PROVIDERS].filter((p) => (route.params.placeIds || []).includes(p.id));

  const startDate = existing && existing.dueDate ? parseDate(existing.dueDate) : null;
  const [title, setTitle] = useState(existing ? existing.title : '');
  const [notes, setNotes] = useState(existing ? existing.notes : '');
  const [stage, setStage] = useState(existing ? existing.stage : route.params.stage || 'pre');
  // Category is a topic id ('efmp', 'school', ..., 'mine' for Other) or 'place:<id>' for a chosen place
  const [category, setCategory] = useState(
    existing ? (existing.placeId ? `place:${existing.placeId}` : existing.topic || 'mine') : 'mine'
  );
  const [hasDue, setHasDue] = useState(!!startDate);
  const [dueMonth, setDueMonth] = useState(startDate ? startDate.getMonth() + 1 : null);
  const [dueDay, setDueDay] = useState(startDate ? startDate.getDate() : null);
  const [dueYear, setDueYear] = useState(startDate ? startDate.getFullYear() : null);
  const [saving, setSaving] = useState(false);

  const categories = [
    ...TOPICS.map((t) => ({ id: t.id, label: t.label })),
    { id: 'mine', label: 'Other' },
    ...places.map((p) => ({ id: `place:${p.id}`, label: p.name, isPlace: true })),
  ];

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Add a title', 'What do you need to do?');
      return;
    }
    const dueDate = hasDue ? formatDateKey(dueYear, dueMonth, dueDay) : null;
    if (hasDue && !dueDate) {
      Alert.alert('Pick a full date', 'Choose a month, day, and year, or turn off the due date.');
      return;
    }
    const isPlace = category.startsWith('place:');
    const fields = {
      title: title.trim(),
      notes: notes.trim(),
      stage,
      topic: isPlace ? 'mine' : category,
      placeId: isPlace ? category.slice(6) : null,
      dueDate,
    };
    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (existing) await updateCustomTask(user.uid, existing.id, fields);
      else await addCustomTask(user.uid, fields);
      navigation.goBack(); // Checklists reloads when it comes back into view
    } catch (error) {
      Alert.alert('Error', "Couldn't save that task. Try again.");
      console.log(error);
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.navLink}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{existing ? 'Edit Task' : 'New Task'}</Text>
        <TouchableOpacity onPress={save} disabled={saving} hitSlop={10}>
          <Text style={[styles.navLink, styles.navLinkBold, saving && { opacity: 0.5 }]}>
            {saving ? 'Saving' : existing ? 'Done' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.group}>
          <TextInput
            style={[styles.input, styles.titleInput]}
            placeholder="Title"
            placeholderTextColor={COLORS.tertiaryLabel}
            value={title}
            onChangeText={setTitle}
            autoFocus={!existing}
          />
          <View style={styles.divider} />
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notes"
            placeholderTextColor={COLORS.tertiaryLabel}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <Text style={styles.sectionHeader}>STAGE</Text>
        <ChoiceRow
          options={STAGES.map((s) => ({ value: s.id, label: s.label }))}
          selected={stage}
          onSelect={setStage}
        />

        <Text style={styles.sectionHeader}>CATEGORY</Text>
        <View style={styles.chips}>
          {categories.map((c) => {
            const active = c.id === category;
            return (
              <TouchableOpacity key={c.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setCategory(c.id)}>
                {c.isPlace && (
                  <Ionicons name="location" size={13} color={active ? COLORS.white : COLORS.secondaryLabel} style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {places.length === 0 && (
          <Text style={styles.hint}>Places you choose on the Map show up here too.</Text>
        )}

        <View style={[styles.group, { marginTop: 24 }]}>
          <View style={styles.switchRow}>
            <View style={[styles.iconSquare, { backgroundColor: '#FF3B30' }]}>
              <Ionicons name="calendar" size={16} color={COLORS.white} />
            </View>
            <Text style={styles.switchLabel}>Due date</Text>
            <Switch value={hasDue} onValueChange={setHasDue} trackColor={{ true: '#34C759' }} />
          </View>
        </View>
        {hasDue && (
          <View style={{ marginTop: 10 }}>
            <WheelDatePicker
              month={dueMonth}
              day={dueDay}
              year={dueYear}
              onChangeMonth={setDueMonth}
              onChangeDay={setDueDay}
              onChangeYear={setDueYear}
              yearRange={YEARS}
            />
          </View>
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
  navLinkBold: {
    fontWeight: '600',
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.separator,
    marginLeft: 16,
  },
  sectionHeader: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
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
    backgroundColor: COLORS.primary,
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
});
