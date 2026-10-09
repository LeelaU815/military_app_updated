import { SCHOOL_CALENDARS, SCHOOLS, AREAS } from './data';
import { findBase } from './constants';
import { buildChecklist, pcsDate, parseDate, formatDateKey } from './checklists';
import { STAGE_STYLE } from './theme';

// Builds everything the Calendar shows: the PCS date, checklist due dates, the family's own
// appointments, and school year dates. Everything is keyed by 'YYYY-MM-DD'.

export const KIND_STYLE = {
  pcs: { color: '#FF3B30', label: 'PCS', icon: 'airplane' },
  event: { color: '#AF52DE', label: 'Appointments', icon: 'time' },
  school: { color: '#30B0C7', label: 'School', icon: 'school' },
};

export function dateKey(date) {
  return formatDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

// '14:30' -> '2:30 PM'
export function formatTime(time) {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// Public school districts to show: the ones for public schools they chose on the map,
// or every district near their base if they haven't chosen one yet.
function districtsFor(profile, saved) {
  const base = findBase(profile.installation);
  const districtOf = (school) => {
    const area = AREAS.find((a) => a.id === school.areaId);
    return area ? area.district : null;
  };
  const chosen = SCHOOLS.filter((s) => saved[s.id] && s.type === 'public').map(districtOf).filter(Boolean);
  if (chosen.length) return [...new Set(chosen)];
  return [...new Set(AREAS.filter((a) => base && a.baseId === base.id).map((a) => a.district))];
}

// Returns { 'YYYY-MM-DD': [items] }. Each item: { key, kind, color, title, subtitle, ... }.
export function buildCalendar(profile, saved = {}, progress = {}, events = []) {
  const days = {};
  const add = (key, item) => {
    if (!key) return;
    (days[key] = days[key] || []).push(item);
  };

  const start = pcsDate(profile);
  if (start) {
    const isWindow = profile.pcsDateType === 'Timeframe';
    add(dateKey(start), {
      key: 'pcs-start',
      kind: 'pcs',
      color: KIND_STYLE.pcs.color,
      title: isWindow ? 'PCS window opens' : 'PCS day',
      date: start,
    });
    if (isWindow && profile.pcsEndYear) {
      const end = new Date(profile.pcsEndYear, profile.pcsEndMonth - 1, profile.pcsEndDay);
      add(dateKey(end), { key: 'pcs-end', kind: 'pcs', color: KIND_STYLE.pcs.color, title: 'PCS window closes', date: end });
    }
  }

  districtsFor(profile, saved).forEach((district) => {
    const calendar = SCHOOL_CALENDARS.find((c) => c.district === district);
    if (!calendar) return;
    calendar.dates.forEach((d, i) => {
      // Breaks show on every day they cover, like the Calendar app does.
      const first = parseDate(d.date);
      const last = parseDate(d.end || d.date);
      for (let day = new Date(first); day <= last; day.setDate(day.getDate() + 1)) {
        add(dateKey(day), {
          key: `school:${district}:${i}:${dateKey(day)}`,
          kind: 'school',
          color: KIND_STYLE.school.color,
          title: d.title,
          subtitle: district,
          source: calendar.source,
        });
      }
    });
  });

  events.forEach((event) => {
    add(event.date, {
      key: `event:${event.id}`,
      kind: 'event',
      color: KIND_STYLE.event.color,
      title: event.title,
      subtitle: [formatTime(event.time) || 'All day', event.location].filter(Boolean).join(' · '),
      event,
    });
  });

  buildChecklist(profile, saved, progress)
    .filter((t) => t.due)
    .forEach((task) => {
      add(dateKey(task.due), {
        key: `task:${task.id}`,
        kind: 'task',
        color: STAGE_STYLE[task.stage].color,
        title: task.title,
        subtitle: task.placeName || null,
        done: task.done,
        task,
      });
    });

  // PCS first, then school days, then appointments by time, then tasks.
  const order = { pcs: 0, school: 1, event: 2, task: 3 };
  Object.values(days).forEach((items) =>
    items.sort((a, b) => (order[a.kind] - order[b.kind]) ||
      (a.kind === 'event' ? (a.event.time || '').localeCompare(b.event.time || '') : 0))
  );
  return days;
}

// The 6x7 grid for a month: Date objects, with null for the blank cells before the 1st.
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const count = new Date(year, month + 1, 0).getDate();
  const cells = Array(first.getDay()).fill(null);
  for (let d = 1; d <= count; d += 1) cells.push(new Date(year, month, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}
