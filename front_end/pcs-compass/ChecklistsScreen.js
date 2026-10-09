import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  getCurrentUser,
  loadProfile,
  loadSavedLocations,
  loadChecklistProgress,
  setTaskDone,
  addCustomTask,
  deleteCustomTask,
} from './storage';
import { buildChecklist, pcsDate, STAGES } from './checklists';
import { MONTH_NAMES } from './constants';
import { COLORS } from './theme';

const GREEN = '#34C759';
const RED = '#FF3B30';

function dueText(due) {
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 86400000);
  const date = `${MONTH_NAMES[due.getMonth()].slice(0, 3)} ${due.getDate()}`;
  if (days < 0) return { text: `Overdue · was due ${date}`, overdue: true };
  if (days === 0) return { text: 'Due today', overdue: false, soon: true };
  if (days <= 7) return { text: `Due ${date} · in ${days} day${days === 1 ? '' : 's'}`, soon: true };
  return { text: `Due ${date}` };
}

function callNumber(phone) {
  Linking.openURL(`tel:${phone.split(/ext/i)[0].replace(/[^0-9+]/g, '')}`).catch(() => {});
}

export default function ChecklistsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState({});
  const [progress, setProgress] = useState({});
  const [adding, setAdding] = useState(null); // stage id with the "add task" box open
  const [newTitle, setNewTitle] = useState('');
  const submitted = useRef(false); // "Done" and losing focus both fire; only save once

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const user = await getCurrentUser();
          if (!user) return;
          setUid(user.uid);
          const [p, s, pr] = await Promise.all([
            loadProfile(user.uid),
            loadSavedLocations(user.uid),
            loadChecklistProgress(user.uid),
          ]);
          setProfile(p);
          setSaved(s);
          setProgress(pr);
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const toggle = async (task) => {
    const done = !task.done;
    // Update the screen right away, then save.
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

  const submitNew = async (stage) => {
    if (submitted.current) return;
    submitted.current = true;
    const title = newTitle.trim();
    setAdding(null);
    setNewTitle('');
    if (!title) return;
    try {
      const task = await addCustomTask(uid, stage, title);
      setProgress((prev) => ({ ...prev, [task.id]: task }));
    } catch (error) {
      Alert.alert('Error', "Couldn't add that task. Try again.");
      console.log(error);
    }
  };

  const removeCustom = (task) => {
    Alert.alert('Delete this task?', task.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setProgress((prev) => {
            const next = { ...prev };
            delete next[task.id];
            return next;
          });
          try {
            await deleteCustomTask(uid, task.id);
          } catch (error) {
            console.log(error);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={[styles.screen, styles.center]}><Text style={styles.muted}>Loading...</Text></View>;
  }

  if (!profile || profile.status !== 'complete') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={styles.largeTitle}>Checklists</Text>
        <View style={[styles.center, { paddingHorizontal: 40 }]}>
          <Ionicons name="checkbox-outline" size={44} color={COLORS.tertiaryLabel} />
          <Text style={styles.emptyTitle}>Finish your profile first</Text>
          <Text style={styles.emptyText}>Your checklist is built from your profile and the places you choose.</Text>
        </View>
      </View>
    );
  }

  const tasks = buildChecklist(profile, saved, progress);
  const doneCount = tasks.filter((t) => t.done).length;
  const hasDate = !!pcsDate(profile);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.largeTitle}>Checklists</Text>
        <Text style={styles.subtitle}>
          {doneCount} of {tasks.length} done
          {!hasDate ? '  ·  Add a PCS date in your profile to see due dates' : ''}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%` }]} />
        </View>

        {STAGES.map((stage) => {
          const stageTasks = tasks.filter((t) => t.stage === stage.id);
          const stageDone = stageTasks.filter((t) => t.done).length;
          return (
            <View key={stage.id}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>{stage.label.toUpperCase()}</Text>
                <Text style={styles.sectionCount}>{stageDone} of {stageTasks.length}</Text>
              </View>
              <View style={styles.group}>
                {stageTasks.map((task) => {
                  const due = task.done ? null : dueText(task.due);
                  return (
                    <View key={task.id} style={[styles.taskRow, styles.rowBorder]}>
                      <TouchableOpacity
                        onPress={() => toggle(task)}
                        hitSlop={8}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: task.done }}
                      >
                        <Ionicons
                          name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
                          size={26}
                          color={task.done ? GREEN : COLORS.tertiaryLabel}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.taskBody}
                        onPress={() => toggle(task)}
                        onLongPress={task.custom ? () => removeCustom(task) : undefined}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
                        {due && (
                          <Text style={[styles.due, due.overdue && { color: RED }, due.soon && { color: '#FF9500' }]}>
                            {due.text}
                          </Text>
                        )}
                        {task.custom && !task.done && <Text style={styles.due}>Your task · hold to delete</Text>}
                      </TouchableOpacity>
                      {!task.done && task.phone && (
                        <TouchableOpacity style={styles.iconButton} onPress={() => callNumber(task.phone)} accessibilityLabel="Call">
                          <Ionicons name="call" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                      {!task.done && task.source && (
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => Linking.openURL(task.source).catch(() => {})}
                          accessibilityLabel="Source"
                        >
                          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                {adding === stage.id ? (
                  <View style={styles.taskRow}>
                    <Ionicons name="ellipse-outline" size={26} color={COLORS.tertiaryLabel} />
                    <TextInput
                      style={styles.addInput}
                      placeholder="New task"
                      placeholderTextColor={COLORS.tertiaryLabel}
                      value={newTitle}
                      onChangeText={setNewTitle}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={() => submitNew(stage.id)}
                      onBlur={() => submitNew(stage.id)}
                    />
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addRow} onPress={() => { submitted.current = false; setNewTitle(''); setAdding(stage.id); }}>
                    <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                    <Text style={styles.addText}>Add task</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {Object.keys(saved).length === 0 && (
          <TouchableOpacity style={styles.hint} onPress={() => navigation.navigate('MapTab')}>
            <Text style={styles.hintText}>
              Choose schools and providers on the Map to add their tasks here.
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
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
  center: {
    flex: 1,
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
  subtitle: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    marginTop: 2,
    marginHorizontal: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.fill,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 6,
    marginHorizontal: 32,
  },
  sectionHeader: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  taskBody: {
    flex: 1,
    marginLeft: 12,
    marginTop: 2,
  },
  taskTitle: {
    fontSize: 16,
    color: COLORS.label,
    lineHeight: 21,
  },
  taskTitleDone: {
    color: COLORS.tertiaryLabel,
    textDecorationLine: 'line-through',
  },
  due: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 3,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.groupedBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 12,
  },
  addInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.label,
    marginLeft: 12,
    paddingVertical: 2,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 32,
    marginTop: 16,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
  },
});
