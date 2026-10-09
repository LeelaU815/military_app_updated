import { buildChecklist, pcsDate } from './checklists';
import { dateKey, formatTime } from './calendar';
import { MONTH_NAMES } from './constants';

// Builds the Alerts tab and the phone notifications from the same data as Checklists and Calendar.
// Nothing gets dismissed by hand: a task alert goes away when the task is checked off,
// and appointment and PCS alerts go away once the day has passed.

export const ALERT_GROUPS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'later', label: 'Coming up' },
];

const RED = '#FF3B30';
const ORANGE = '#FF9500';
const BLUE = '#007AFF';
const PURPLE = '#AF52DE';

const DAY = 86400000;
const shortDate = (d) => `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;

function startOfDay(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// Returns alerts sorted by group, most urgent first. Each: { id, group, color, icon, title, subtitle, target }.
// target is where tapping goes: { tab: 'ChecklistsTab' } or { tab: 'CalendarTab', date: 'YYYY-MM-DD' }.
export function buildAlerts(profile, saved = {}, progress = {}, events = [], now = new Date()) {
  const today = startOfDay(now);
  const alerts = [];

  buildChecklist(profile, saved, progress)
    .filter((t) => !t.done && t.due)
    .forEach((task) => {
      const days = Math.round((task.due - today) / DAY);
      if (days > 30) return;
      const base = { id: `task:${task.id}`, title: task.title, target: { tab: 'ChecklistsTab' }, sortTime: task.due.getTime() };
      if (days < 0) {
        alerts.push({ ...base, group: 'today', color: RED, icon: 'alert-circle', subtitle: `Overdue · was due ${shortDate(task.due)}`, rank: 0 });
      } else if (days === 0) {
        alerts.push({ ...base, group: 'today', color: ORANGE, icon: 'checkbox', subtitle: 'Task due today', rank: 2 });
      } else if (days <= 7) {
        alerts.push({ ...base, group: 'week', color: ORANGE, icon: 'checkbox', subtitle: `Task due ${shortDate(task.due)} · in ${days} day${days === 1 ? '' : 's'}`, rank: 2 });
      } else {
        alerts.push({ ...base, group: 'later', color: BLUE, icon: 'checkbox', subtitle: `Task due ${shortDate(task.due)}`, rank: 2 });
      }
    });

  const tomorrow = new Date(today.getTime() + DAY);
  events
    .filter((e) => e.date === dateKey(today) || e.date === dateKey(tomorrow))
    .forEach((event) => {
      const isToday = event.date === dateKey(today);
      alerts.push({
        id: `event:${event.id}`,
        group: isToday ? 'today' : 'week',
        color: PURPLE,
        icon: 'time',
        title: event.title,
        subtitle: [isToday ? 'Today' : 'Tomorrow', formatTime(event.time) || 'All day', event.location].filter(Boolean).join(' · '),
        target: { tab: 'CalendarTab', date: event.date },
        sortTime: today.getTime() + (isToday ? 0 : DAY),
        rank: 1,
      });
    });

  const pcs = pcsDate(profile);
  if (pcs) {
    const days = Math.round((pcs - today) / DAY);
    const isWindow = profile.pcsDateType === 'Timeframe';
    if (days >= 0 && days <= 30) {
      alerts.push({
        id: 'pcs',
        group: days === 0 ? 'today' : days <= 7 ? 'week' : 'later',
        color: days === 0 ? RED : days <= 7 ? ORANGE : BLUE,
        icon: 'airplane',
        title: days === 0
          ? (isWindow ? 'Your PCS window opens today' : 'PCS day is today')
          : `${days} day${days === 1 ? '' : 's'} until ${isWindow ? 'your PCS window opens' : 'PCS'}`,
        subtitle: pcs.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
        target: { tab: 'CalendarTab', date: dateKey(pcs) },
        sortTime: pcs.getTime(),
        rank: 1,
      });
    }
  }

  const groupOrder = { today: 0, week: 1, later: 2 };
  return alerts.sort((a, b) => (groupOrder[a.group] - groupOrder[b.group]) || (a.rank - b.rank) || (a.sortTime - b.sortTime));
}

// Phone notifications to schedule: { id, date, title, body, data }. Only future ones, soonest first.
// iOS only keeps 64 scheduled notifications per app, so this stops at 60.
export function buildReminders(profile, saved = {}, progress = {}, events = [], now = new Date()) {
  const reminders = [];
  const at = (day, hour, minute = 0) => {
    const d = new Date(day);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  buildChecklist(profile, saved, progress)
    .filter((t) => !t.done && t.due)
    .forEach((task) => {
      reminders.push({ id: `task:${task.id}`, date: at(task.due, 9), title: 'Due today', body: task.title, data: { tab: 'AlertsTab' } });
    });

  events.forEach((event) => {
    const [y, m, d] = event.date.split('-').map(Number);
    const day = new Date(y, m - 1, d);
    if (event.time) {
      const [h, min] = event.time.split(':').map(Number);
      const start = at(day, h, min);
      reminders.push({
        id: `event:${event.id}`,
        date: new Date(start.getTime() - 60 * 60000),
        title: `In 1 hour: ${event.title}`,
        body: [formatTime(event.time), event.location].filter(Boolean).join(' · '),
        data: { tab: 'CalendarTab', date: event.date },
      });
    } else {
      reminders.push({ id: `event:${event.id}`, date: at(day, 8), title: `Today: ${event.title}`, body: event.location || 'All day', data: { tab: 'CalendarTab', date: event.date } });
    }
  });

  const pcs = pcsDate(profile);
  if (pcs) {
    const what = profile.pcsDateType === 'Timeframe' ? 'your PCS window opens' : 'PCS';
    [30, 14, 7, 1].forEach((days) => {
      reminders.push({
        id: `pcs:${days}`,
        date: at(new Date(pcs.getTime() - days * DAY), 9),
        title: `${days} day${days === 1 ? '' : 's'} until ${what}`,
        body: 'Open PCS Compass to see what still needs doing.',
        data: { tab: 'AlertsTab' },
      });
    });
    reminders.push({ id: 'pcs:0', date: at(pcs, 8), title: profile.pcsDateType === 'Timeframe' ? 'Your PCS window opens today' : 'PCS day is today', body: 'Good luck with the move!', data: { tab: 'AlertsTab' } });
  }

  return reminders
    .filter((r) => r.date > now)
    .sort((a, b) => a.date - b.date)
    .slice(0, 60);
}

// The red number on the Alerts tab: everything in Today and This week.
export function badgeCount(alerts) {
  return alerts.filter((a) => a.group !== 'later').length;
}
