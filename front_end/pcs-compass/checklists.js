import { CHECKLIST_TASKS, SCHOOLS, PROVIDERS } from './data';
import { findBase, findCategory } from './constants';

// Builds a family's checklist from CHECKLIST_TASKS (data.js), their profile, the places they chose
// on the map, and what they've checked off. Custom tasks they added are mixed in too.

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
      add(t, `${t.id}:${placeId}`, { placeId, phone: place.phone, values: { place: place.name } })
    );
  });

  Object.keys(progress).forEach((id) => {
    const p = progress[id];
    if (!p.custom) return;
    tasks.push({ id, stage: p.stage, days: 9999, title: p.title, due: null, source: null, done: !!p.done, custom: true });
  });

  // Not done first (soonest due on top), done ones at the bottom.
  tasks.sort((a, b) => (a.done - b.done) || (a.days - b.days));
  return tasks;
}
