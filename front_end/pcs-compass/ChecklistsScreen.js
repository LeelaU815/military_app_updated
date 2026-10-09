import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  getCurrentUser,
  loadProfile,
  loadSavedLocations,
  loadChecklistProgress,
  setTaskDone,
  deleteCustomTask,
} from './storage';
import { buildChecklist, groupByTopic, pcsDate, STAGES } from './checklists';
import { MONTH_NAMES } from './constants';
import { COLORS, STAGE_STYLE } from './theme';

const GREEN = '#34C759';
const RED = '#FF3B30';
const ORANGE = '#FF9500';

const TOPIC_ICONS = {
  efmp: 'heart',
  school: 'school',
  medical: 'medkit',
  move: 'car',
  mine: 'ellipsis-horizontal-circle',
};

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
  const [expanded, setExpanded] = useState(null); // task id that's open
  const [showCompleted, setShowCompleted] = useState(false);
  const [collapsed, setCollapsed] = useState([]); // 'pre' for a whole stage, 'pre:efmp' for one topic

  // Remember the "Show completed" switch and folded sections on this device.
  useEffect(() => {
    AsyncStorage.getItem('showCompletedTasks').then((v) => setShowCompleted(v === 'true')).catch(() => {});
    AsyncStorage.getItem('collapsedTaskSections').then((v) => v && setCollapsed(JSON.parse(v))).catch(() => {});
  }, []);
  const changeShowCompleted = (value) => {
    setShowCompleted(value);
    AsyncStorage.setItem('showCompletedTasks', String(value)).catch(() => {});
  };
  const toggleSection = (key) => {
    setCollapsed((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      AsyncStorage.setItem('collapsedTaskSections', JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

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

  const openEditor = (stage, task) => {
    const places = Object.keys(saved);
    navigation.navigate('TaskEditor', { stage, task: task ? { id: task.id, ...task.fields } : null, placeIds: places });
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

  const renderTask = (task) => {
    const isOpen = expanded === task.id;
    const due = task.done ? null : dueText(task.due);
    return (
      <View key={task.id} style={styles.topBorder}>
        <View style={styles.taskRow}>
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
          <TouchableOpacity style={styles.taskBody} onPress={() => setExpanded(isOpen ? null : task.id)} activeOpacity={0.6}>
            <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
            {due && (
              <Text style={[styles.due, due.overdue && { color: RED }, due.soon && { color: ORANGE }]}>{due.text}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setExpanded(isOpen ? null : task.id)} hitSlop={8} style={styles.chevron}>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.tertiaryLabel} />
          </TouchableOpacity>
        </View>

        {isOpen && (
          <View style={styles.details}>
            {!!task.details && <Text style={styles.detailsText}>{task.details}</Text>}
            {task.custom && !task.details && <Text style={styles.detailsText}>A task you added.</Text>}
            {task.due && (
              <Text style={styles.detailLine}>
                <Text style={styles.detailLabel}>Due  </Text>
                {task.due.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
            {!!task.address && (
              <Text style={styles.detailLine}><Text style={styles.detailLabel}>Address  </Text>{task.address}</Text>
            )}
            {!!task.phone && (
              <Text style={styles.detailLine}><Text style={styles.detailLabel}>Phone  </Text>{task.phone}</Text>
            )}
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.action, styles.actionPrimary]} onPress={() => toggle(task)}>
                <Ionicons name={task.done ? 'arrow-undo' : 'checkmark'} size={16} color={COLORS.white} />
                <Text style={styles.actionPrimaryText}>{task.done ? 'Not done' : 'Mark done'}</Text>
              </TouchableOpacity>
              {!!task.phone && (
                <TouchableOpacity style={styles.action} onPress={() => callNumber(task.phone)}>
                  <Ionicons name="call" size={15} color={COLORS.primary} />
                  <Text style={styles.actionText}>Call</Text>
                </TouchableOpacity>
              )}
              {!!task.source && (
                <TouchableOpacity style={styles.action} onPress={() => Linking.openURL(task.source).catch(() => {})}>
                  <Ionicons name="open-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.actionText}>Source</Text>
                </TouchableOpacity>
              )}
              {task.custom && (
                <TouchableOpacity style={styles.action} onPress={() => openEditor(task.stage, task)}>
                  <Ionicons name="create-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
              )}
              {task.custom && (
                <TouchableOpacity style={styles.action} onPress={() => removeCustom(task)}>
                  <Ionicons name="trash-outline" size={15} color={RED} />
                  <Text style={[styles.actionText, { color: RED }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
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
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}>
        <Text style={styles.largeTitle}>Checklists</Text>
        <Text style={styles.subtitle}>
          {doneCount} of {tasks.length} done
          {!hasDate ? '  ·  Add a PCS date in your profile to see due dates' : ''}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%` }]} />
        </View>

        <View style={styles.toggleRow}>
          <Ionicons name="checkmark-done-circle" size={22} color={GREEN} />
          <Text style={styles.toggleLabel}>Show completed</Text>
          <Switch value={showCompleted} onValueChange={changeShowCompleted} trackColor={{ true: GREEN }} />
        </View>

        {STAGES.map((stage) => {
          const stageTasks = tasks.filter((t) => t.stage === stage.id);
          const open = stageTasks.filter((t) => !t.done);
          const done = stageTasks.filter((t) => t.done);
          const look = STAGE_STYLE[stage.id];
          const stageClosed = collapsed.includes(stage.id);
          return (
            <View key={stage.id}>
              <TouchableOpacity style={styles.stageHeader} onPress={() => toggleSection(stage.id)} activeOpacity={0.6}>
                <View style={[styles.stageIcon, { backgroundColor: look.color }]}>
                  <Ionicons name={look.icon} size={18} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stageTitle}>{stage.label}</Text>
                  <Text style={styles.stageBlurb}>{look.blurb}</Text>
                </View>
                <Text style={[styles.stageCount, { color: look.color }]}>
                  {done.length}/{stageTasks.length}
                </Text>
                <Ionicons name={stageClosed ? 'chevron-forward' : 'chevron-down'} size={18} color={COLORS.tertiaryLabel} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              <View style={styles.stageTrack}>
                <View
                  style={[
                    styles.stageFill,
                    { backgroundColor: look.color, width: `${stageTasks.length ? (done.length / stageTasks.length) * 100 : 0}%` },
                  ]}
                />
              </View>
              {!stageClosed && (
                <View style={[styles.group, { borderTopColor: look.color }]}>
                  {groupByTopic(open).map((group) => {
                    const key = `${stage.id}:${group.id}`;
                    const topicClosed = collapsed.includes(key);
                    return (
                      <View key={group.id}>
                        <TouchableOpacity style={styles.topicRow} onPress={() => toggleSection(key)} activeOpacity={0.6}>
                          <Ionicons
                            name={group.isPlace ? 'location' : TOPIC_ICONS[group.id] || 'ellipse'}
                            size={14}
                            color={look.color}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.topic} numberOfLines={1}>{group.label.toUpperCase()}</Text>
                          {topicClosed && <Text style={styles.topicCount}>{group.tasks.length}</Text>}
                          <Ionicons name={topicClosed ? 'chevron-forward' : 'chevron-down'} size={14} color={COLORS.tertiaryLabel} />
                        </TouchableOpacity>
                        {!topicClosed && group.tasks.map((task) => renderTask(task))}
                      </View>
                    );
                  })}
                  {open.length === 0 && stageTasks.length > 0 && (
                    <Text style={styles.allDone}>All done here 🎉</Text>
                  )}

                  {showCompleted && done.length > 0 && (
                    <View>
                      <View style={styles.topicRow}>
                        <Ionicons name="checkmark-circle" size={14} color={GREEN} style={{ marginRight: 6 }} />
                        <Text style={styles.topic}>COMPLETED</Text>
                      </View>
                      {done.map((task) => renderTask(task))}
                    </View>
                  )}

                  <TouchableOpacity style={[styles.addRow, styles.topBorder]} onPress={() => openEditor(stage.id)}>
                    <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                    <Text style={styles.addText}>Add task</Text>
                  </TouchableOpacity>
                </View>
              )}
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
    </View>
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
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginHorizontal: 16,
  },
  stageIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.label,
  },
  stageBlurb: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 1,
  },
  stageCount: {
    fontSize: 17,
    fontWeight: '700',
  },
  stageTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.fill,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  stageFill: {
    height: 4,
    borderRadius: 2,
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderTopWidth: 3,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  topic: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.secondaryLabel,
    flex: 1,
  },
  topicCount: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginRight: 6,
  },
  topBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
    marginLeft: 0,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 12,
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
  chevron: {
    marginLeft: 8,
    marginTop: 4,
  },
  details: {
    marginLeft: 52,
    marginRight: 14,
    paddingBottom: 14,
  },
  detailsText: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    lineHeight: 21,
    marginBottom: 8,
  },
  detailLine: {
    fontSize: 14,
    color: COLORS.label,
    marginTop: 2,
  },
  detailLabel: {
    color: COLORS.secondaryLabel,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.groupedBackground,
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 5,
  },
  actionPrimary: {
    backgroundColor: GREEN,
  },
  actionPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 5,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 17,
    color: COLORS.label,
    marginLeft: 10,
  },
  allDone: {
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
  addText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 12,
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
