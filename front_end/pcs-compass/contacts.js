import { CONTACTS, SCHOOLS, PROVIDERS } from './data';
import { findBase, findCategory } from './constants';
import { placeType } from './scoring';
import { TYPE_COLORS } from './theme';

// Builds the Contacts tab: places the family chose on the map, verified contacts from data.js,
// and contacts they added themselves. Every contact comes out in the same shape so one screen can show them all.

const PALETTE = ['#007AFF', '#5856D6', '#FF9500', '#34C759', '#FF2D55', '#AF52DE', '#5AC8FA'];

export function initials(name) {
  const words = (name || '?').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/);
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
}

// Same name always gets the same color.
function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 1000;
  return PALETTE[hash % PALETTE.length];
}

function fromPlace(place) {
  const type = placeType(place);
  return {
    key: `place:${place.id}`,
    kind: 'place',
    placeId: place.id,
    name: place.name,
    subtitle: type === 'Schools' ? `School · Grades ${place.grades}` : type,
    phone: place.phone,
    email: null,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    website: null,
    notes: place.notes,
    source: place.source,
    color: TYPE_COLORS[type],
  };
}

function fromVerified(c) {
  return {
    key: `verified:${c.id}`,
    kind: 'verified',
    name: c.name,
    subtitle: c.group,
    phone: c.phone,
    email: null,
    address: c.address,
    website: c.website,
    notes: c.notes,
    source: c.source,
    color: colorFor(c.group),
  };
}

function fromCustom(c) {
  return {
    key: `custom:${c.id}`,
    kind: 'custom',
    id: c.id,
    name: c.name,
    subtitle: c.role || 'My contact',
    phone: c.phone || null,
    email: c.email || null,
    address: null,
    website: null,
    notes: c.notes || null,
    source: null,
    color: colorFor(c.name),
    fields: { name: c.name, role: c.role || '', phone: c.phone || '', email: c.email || '', notes: c.notes || '' },
  };
}

const byName = (a, b) => a.name.localeCompare(b.name);

// Returns { sections: [{ id, title, icon, items }], more: [items] }.
// "more" holds verified contacts that only matter for other kinds of needs (shown collapsed).
export function buildContacts(profile, saved = {}, custom = []) {
  const base = findBase(profile.installation);
  const category = findCategory(profile.disabilityType);
  const fitsChild = (c) => !c.categories || (category && c.categories.includes(category.id));

  const places = [...SCHOOLS, ...PROVIDERS].filter((p) => saved[p.id]).map(fromPlace).sort(byName);
  const baseContacts = CONTACTS.filter((c) => base && c.baseId === base.id);
  const everywhere = CONTACTS.filter((c) => c.baseId === null);

  const sections = [
    { id: 'places', title: 'My places', icon: 'location', items: places },
    { id: 'base', title: base ? base.name : 'Your base', icon: 'shield', items: baseContacts.filter(fitsChild).map(fromVerified) },
    { id: 'support', title: 'TRICARE & support', icon: 'medkit', items: everywhere.filter(fitsChild).map(fromVerified) },
    { id: 'mine', title: 'My contacts', icon: 'person', items: custom.map(fromCustom).sort(byName) },
  ];
  const more = [...baseContacts, ...everywhere].filter((c) => !fitsChild(c)).map(fromVerified);
  return { sections, more };
}

export function matchesSearch(contact, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [contact.name, contact.subtitle, contact.notes, contact.phone]
    .filter(Boolean)
    .some((text) => text.toLowerCase().includes(q));
}
