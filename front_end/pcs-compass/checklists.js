import { CHECKLIST_TASKS, SCHOOLS, PROVIDERS, CONTACTS } from './data';
import { findBase, findCategory } from './constants';

// Builds a family's checklist from CHECKLIST_TASKS (data.js), their profile, the places they chose
// on the map, and what they've checked off. Custom tasks they added are mixed in too.

// Topic headers inside each stage. Place tasks are grouped under each place instead.
export const TOPICS = [
  { id: 'efmp', label: 'EFMP' },
  { id: 'school', label: 'School' },
  { id: 'medical', label: 'Medical & TRICARE' },
  { id: 'move', label: 'Moving' },
];

export const STAGES = [
  { id: 'pre', label: 'Pre-Move' },
  { id: 'arrival', label: 'Arrival' },
  { id: 'onboarding', label: 'Onboarding' },
];

// PCS date (or the start of their PCS window). null if they picked "Not sure".
export function pcsDate(profile) {
  if (profile.pcsDateType === 'Date' && profile.pcsYear) {
    return new Date(profile.pcsYear, profile.pcsMonth - 1, profile.pcsDay);
  }
  if (profile.pcsDateType === 'Timeframe' && profile.pcsStartYear) {
    return new Date(profile.pcsStartYear, profile.pcsStartMonth - 1, profile.pcsStartDay);
  }
  return null;
}

// Which kinds of per-place tasks a chosen place gets.
function placeKinds(place, profile) {
  if (place.type === 'public') return ['public'];
  if (place.type === 'private') return ['private'];
  if (place.kind === 'respite') return ['respite'];
  const kinds = ['provider'];
  const category = findCategory(profile.disabilityType);
  if (place.aba && category && category.id === 'asd') kinds.push('aba');
  return kinds;
}

// 'YYYY-MM-DD' <-> Date (custom task due dates are saved as text so they don't shift with time zones)
export function parseDate(text) {
  if (!text) return null;
  const [y, m, d] = text.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateKey(year, month, day) {
  if (!year || !month || !day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function fill(text, values) {
  return text.replace(/\{(\w+)\}/g, (match, key) => (values[key] != null ? values[key] : match));
}

// progress: { taskId: { done, doneAt, custom, title, stage } } from Firebase.
// saved: { placeId: savedLocation } from Firebase.
export function buildChecklist(profile, saved = {}, progress = {}) {
  const base = findBase(profile.installation);
  const start = pcsDate(profile);
  const values = {
    child: (profile.name || '').trim().split(' ')[0] || 'your child',
    base: base ? base.name : 'your new base',
    mtf: base && base.mtf ? base.mtf : 'your new military clinic',
    efmpPhone: base && base.efmpPhone ? base.efmpPhone : 'see Contacts',
  };
  const slo = CONTACTS.find((c) => c.baseId === (base && base.id) && c.group === 'School Liaison Officer');
  values.sloPhone = slo && slo.phone ? slo.phone : 'ask the base Fleet & Family Support Center';
  const matches = (t) =>
    (!t.plan || t.plan === profile.insurance) &&
    (!t.efmp || t.efmp === profile.efmpStatus) &&
    (!t.respite || (profile.respiteImportance || 0) >= 3);
  const dueFor = (days) => (start ? new Date(start.getTime() + days * 86400000) : null);

  const tasks = [];
  const add = (template, id, extra = {}) => {
    const p = progress[id] || {};
    tasks.push({
      id,
      stage: template.stage,
      days: template.days,
      title: fill(template.title, { ...values, ...extra.values }),
      details: template.details ? fill(template.details, { ...values, ...extra.values }) : null,
      topic: extra.placeId ? `place:${extra.placeId}` : template.topic || 'move',
      placeName: extra.values ? extra.values.place : null,
      address: extra.address || null,
      due: dueFor(template.days),
      source: template.source || null,
      done: !!p.done,
      placeId: extra.placeId || null,
      phone: extra.phone || null,
    });
  };

  CHECKLIST_TASKS.filter((t) => !t.place && matches(t)).forEach((t) => add(t, t.id));

  const places = [...SCHOOLS, ...PROVIDERS];
  Object.keys(saved).forEach((placeId) => {
    const place = places.find((p) => p.id === placeId);
    if (!place) return;
    const kinds = placeKinds(place, profile);
    CHECKLIST_TASKS.filter((t) => t.place && kinds.includes(t.place) && matches(t)).forEach((t) =>
      add(t, `${t.id}:${placeId}`, { placeId, phone: place.phone, address: place.address, values: { place: place.name } })
    );
  });

  Object.keys(progress).forEach((id) => {
    const p = progress[id];
    if (!p.custom) return;
    const place = p.placeId ? places.find((pl) => pl.id === p.placeId) : null;
    tasks.push({
      id,
      stage: p.stage || 'pre',
      topic: place ? `place:${place.id}` : p.topic || 'mine',
      placeName: place ? place.name : null,
      placeId: place ? place.id : null,
      phone: place ? place.phone : null,
      address: place ? place.address : null,
      days: 9999,
      title: p.title,
      details: p.notes || null,
      due: parseDate(p.dueDate),
      source: null,
      done: !!p.done,
      custom: true,
      fields: { title: p.title, notes: p.notes || '', stage: p.stage, topic: p.topic || 'mine', placeId: p.placeId || null, dueDate: p.dueDate || null },
    });
  });

  // Not done first, then soonest due date; tasks without a date go after dated ones.
  const when = (t) => (t.due ? t.due.getTime() : Number.MAX_SAFE_INTEGER - 1e12 + t.days);
  tasks.sort((a, b) => (a.done - b.done) || (when(a) - when(b)));
  return tasks;
}

// Splits one stage's tasks into topic groups, in display order:
// EFMP, School, Medical & TRICARE, Moving, then one group per chosen place, then "Your tasks".
export function groupByTopic(tasks) {
  const groups = [];
  TOPICS.forEach((topic) => {
    const items = tasks.filter((t) => t.topic === topic.id);
    if (items.length) groups.push({ id: topic.id, label: topic.label, tasks: items });
  });
  const placeTopics = [...new Set(tasks.filter((t) => t.topic.startsWith('place:')).map((t) => t.topic))];
  placeTopics.forEach((id) => {
    const items = tasks.filter((t) => t.topic === id);
    groups.push({ id, label: items[0].placeName, tasks: items, isPlace: true });
  });
  const mine = tasks.filter((t) => t.topic === 'mine');
  if (mine.length) groups.push({ id: 'mine', label: 'Other', tasks: mine });
  return groups;
}
