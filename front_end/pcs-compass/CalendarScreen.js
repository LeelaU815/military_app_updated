import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  getCurrentUser,
  loadProfile,
  loadSavedLocations,
  loadChecklistProgress,
  loadEvents,
  setTaskDone,
} from './storage';
import { buildCalendar, monthGrid, dateKey, KIND_STYLE } from './calendar';
import { STAGES, STAGE_STYLE, parseDate } from './checklists';
import { addToDeviceCalendar } from './deviceCalendar';
import { MONTH_NAMES } from './constants';
import { COLORS } from './theme';

// Month view like Apple's Calendar app: dots under each day, and the selected day's list below
// (or beside it on iPad).

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const RED = '#FF3B30';
const GREEN = '#34C759';

const LEGEND = [
  { color: KIND_STYLE.pcs.color, label: 'PCS' },
  { colors: Object.values(STAGE_STYLE).map((s) => s.color), label: 'Tasks' },
  { color: KIND_STYLE.event.color, label: 'Appointments' },
  { color: KIND_STYLE.school.color, label: 'School' },
];

function DayCell({ date, items, selected, today, onPress }) {
  if (!date) return <View style={styles.cell} />;
  // One dot per kind of thing on that day, max 3.
  const colors = [...new Set((items || []).map((i) => i.color))].slice(0, 3);
  return (
    <TouchableOpacity style={styles.cell} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.dayCircle, selected && { backgroundColor: today ? RED : COLORS.label }]}>
        <Text
          style={[
            styles.dayNumber,
            today && { color: RED, fontWeight: '600' },
            selected && { color: COLORS.white, fontWeight: '600' },
          ]}
        >
          {date.getDate()}
        </Text>
      </View>
      <View style={styles.dots}>
        {colors.map((c) => <View key={c} style={[styles.dot, { backgroundColor: c }]} />)}
      </View>
    </TouchableOpacity>
  );
}

export default function CalendarScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const now = new Date();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState({});
  const [progress, setProgress] = useState({});
  const [events, setEvents] = useState([]);
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(dateKey(now));

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const user = await getCurrentUser();
          if (!user) return;
          setUid(user.uid);
          const [p, s, pr, ev] = await Promise.all([
            loadProfile(user.uid),
            loadSavedLocations(user.uid),
            loadChecklistProgress(user.uid),
            loadEvents(user.uid),
          ]);
          setProfile(p);
          setSaved(s);
          setProgress(pr);
          setEvents(ev);
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const changeMonth = (step) => {
    setMonth((prev) => {
      const d = new Date(prev.year, prev.month + step, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToday = () => {
    setMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelected(dateKey(now));
  };

  const toggleTask = async (task) => {
    const done = !task.done;
    setProgress((prev) => {
      const next = { ...prev };
      if (task.custom) next[task.id] = { ...prev[task.id], done };
      else if (done) next[task.id] = { done: true };
      else delete next[task.id];
      return next;
    });
    try {
      await setTaskDone(uid, task, done);
    } catch (error) {
      Alert.alert('Error', "Couldn't save that. Check your connection and try again.");
      console.log(error);
    }
  };

  const addPcsToCalendar = (item) => {
    Alert.alert(`Add "${item.title}" to your Calendar app?`, null, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add',
        onPress: () => addToDeviceCalendar({ title: item.title, start: item.date, end: item.date, allDay: true }),
      },
    ]);
  };

  const openEditor = (event) => navigation.navigate('EventEditor', { event: event || null, date: selected, placeIds: Object.keys(saved) });

  if (loading) {
    return <View style={[styles.screen, styles.center]}><Text style={styles.muted}>Loading...</Text></View>;
  }

  const ready = profile && profile.status === 'complete';
  const days = ready ? buildCalendar(profile, saved, progress, events) : {};
  const cells = monthGrid(month.year, month.month);
  const todayKey = dateKey(now);
  const dayItems = days[selected] || [];
  const selectedDate = parseDate(selected);

  const renderItem = (item, i) => {
    const last = i === dayItems.length - 1;
    if (item.kind === 'task') {
      const { task } = item;
      return (
        <View key={item.key} style={[styles.itemRow, !last && styles.itemBorder]}>
          <TouchableOpacity onPress={() => toggleTask(task)} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: task.done }}>
            <Ionicons name={task.done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={task.done ? GREEN : item.color} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.itemBody} onPress={() => navigation.navigate('ChecklistsTab')} activeOpacity={0.6}>
            <Text style={[styles.itemTitle, task.done && styles.itemDone]} numberOfLines={2}>{item.title}</Text>
            <Text style={[styles.itemSub, { color: item.color }]} numberOfLines={1}>
              {[`${STAGES.find((s) => s.id === task.stage).label} task`, item.subtitle].filter(Boolean).join(' · ')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    const onPress =
      item.kind === 'event' ? () => openEditor(item.event)
        : item.kind === 'school' ? () => Linking.openURL(item.source).catch(() => {})
          : () => addPcsToCalendar(item);
    const icon = item.kind === 'event' ? null : KIND_STYLE[item.kind].icon;
    return (
      <TouchableOpacity key={item.key} style={[styles.itemRow, !last && styles.itemBorder]} onPress={onPress} activeOpacity={0.6}>
        {icon ? (
          <View style={[styles.itemIcon, { backgroundColor: item.color }]}>
            <Ionicons name={icon} size={14} color={COLORS.white} />
          </View>
        ) : (
          <View style={[styles.itemBar, { backgroundColor: item.color }]} />
        )}
        <View style={styles.itemBody}>
          <Text style={[styles.itemTitle, item.kind === 'pcs' && { color: RED, fontWeight: '600' }]} numberOfLines={2}>{item.title}</Text>
          {!!item.subtitle && <Text style={styles.itemSub} numberOfLines={1}>{item.subtitle}</Text>}
        </View>
        <Ionicons
          name={item.kind === 'school' ? 'open-outline' : item.kind === 'pcs' ? 'calendar-outline' : 'chevron-forward'}
          size={16}
          color={COLORS.tertiaryLabel}
        />
      </TouchableOpacity>
    );
  };

  const calendarCard = (
    <View>
      <View style={styles.monthRow}>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[month.month]} <Text style={{ color: RED }}>{month.year}</Text>
        </Text>
        <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={10} accessibilityLabel="Previous month" style={styles.arrow}>
          <Ionicons name="chevron-back" size={22} color={RED} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={10} accessibilityLabel="Next month" style={styles.arrow}>
          <Ionicons name="chevron-forward" size={22} color={RED} />
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((d, i) => <Text key={i} style={styles.weekday}>{d}</Text>)}
        </View>
        <View style={styles.grid}>
          {cells.map((date, i) => {
            const key = date ? dateKey(date) : `blank-${i}`;
            return (
              <DayCell
                key={key}
                date={date}
                items={date ? days[key] : null}
                selected={key === selected}
                today={key === todayKey}
                onPress={() => setSelected(key)}
              />
            );
          })}
        </View>
      </View>
      <View style={styles.legend}>
        {LEGEND.map((l) => (
          <View key={l.label} style={styles.legendItem}>
            {(l.colors || [l.color]).map((c) => <View key={c} style={[styles.dot, { backgroundColor: c, marginHorizontal: 1 }]} />)}
            <Text style={styles.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const dayList = (
    <View>
      <Text style={styles.dayHeader}>
        {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
      </Text>
      <View style={styles.card}>
        {dayItems.map(renderItem)}
        {dayItems.length === 0 && <Text style={styles.nothing}>Nothing on this day</Text>}
        <TouchableOpacity style={[styles.addRow, styles.addBorder]} onPress={() => openEditor(null)}>
          <Ionicons name="add-circle" size={24} color={KIND_STYLE.event.color} />
          <Text style={styles.addText}>Add appointment</Text>
        </TouchableOpacity>
      </View>
      {!ready && (
        <Text style={styles.footnote}>Finish your profile to see your PCS date and checklist due dates here.</Text>
      )}
    </View>
  );

  const header = (
    <View style={styles.titleRow}>
      <Text style={styles.largeTitle}>Calendar</Text>
      <TouchableOpacity onPress={goToday} hitSlop={10} style={styles.todayButton}>
        <Text style={styles.todayText}>Today</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => openEditor(null)} hitSlop={10} accessibilityLabel="Add appointment">
        <Ionicons name="add-circle" size={32} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  if (isWide) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {header}
        <View style={styles.split}>
          <ScrollView style={{ flex: 1.2 }} contentContainerStyle={{ paddingBottom: 40 }}>{calendarCard}</ScrollView>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>{dayList}</ScrollView>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}>
      {header}
      {calendarCard}
      {dayList}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 16,
  },
  largeTitle: {
    flex: 1,
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.label,
  },
  todayButton: {
    backgroundColor: COLORS.fill,
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  todayText: {
    fontSize: 15,
    fontWeight: '600',
    color: RED,
  },
  split: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  monthTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.label,
  },
  arrow: {
    marginLeft: 18,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  weekRow: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 4,
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 6,
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
    height: 50,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 18,
    color: COLORS.label,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    height: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 10,
    marginHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    color: COLORS.secondaryLabel,
    marginLeft: 4,
  },
  dayHeader: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 26,
    marginBottom: 6,
    marginHorizontal: 32,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  itemIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginHorizontal: 11,
  },
  itemBody: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  itemTitle: {
    fontSize: 16,
    color: COLORS.label,
  },
  itemDone: {
    color: COLORS.tertiaryLabel,
    textDecorationLine: 'line-through',
  },
  itemSub: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  nothing: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
  addText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 10,
  },
  footnote: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 10,
    marginHorizontal: 32,
  },
});
