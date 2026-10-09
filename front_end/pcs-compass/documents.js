import { DOCUMENTS } from './data';
import { findCategory, displayAge } from './constants';
import { estimatedGrade } from './scoring';

// Builds the Documents tab from DOCUMENTS (data.js), the profile, and what they've marked as ready.
// Documents they add themselves are mixed in under "My documents".

export const DOCUMENT_GROUPS = [
  { id: 'military', label: 'Military & EFMP', icon: 'shield', color: '#5856D6' },
  { id: 'school', label: 'School enrollment', icon: 'school', color: '#007AFF' },
  { id: 'medical', label: 'Medical & TRICARE', icon: 'medkit', color: '#FF3B30' },
  { id: 'mine', label: 'My documents', icon: 'folder', color: '#FF9500' },
];

// saved: { docId: { have, custom, title, notes } } from Firebase.
export function buildDocuments(profile, saved = {}) {
  const child = (profile.name || '').trim().split(' ')[0] || 'your child';
  const fill = (text) => text.replace(/\{child\}/g, child);
  const category = findCategory(profile.disabilityType);
  const grade = estimatedGrade(profile);
  const age = displayAge(profile) ? Number(displayAge(profile)) : null;

  const fits = (d) =>
    (!d.efmp || profile.efmpStatus !== 'Enrolled') &&
    (d.maxGrade == null || grade == null || grade <= d.maxGrade) &&
    (d.minAge == null || age == null || age >= d.minAge) &&
    (!d.category || (category && category.id === d.category));

  const docs = DOCUMENTS.filter(fits).map((d) => ({
    id: d.id,
    group: d.group,
    title: fill(d.title),
    details: d.details ? fill(d.details) : null,
    source: d.source || null,
    handCarry: !!d.handCarry,
    have: !!(saved[d.id] && saved[d.id].have),
  }));

  Object.keys(saved).forEach((id) => {
    const s = saved[id];
    if (!s.custom) return;
    docs.push({
      id,
      group: 'mine',
      title: s.title,
      details: s.notes || null,
      source: null,
      handCarry: false,
      have: !!s.have,
      custom: true,
      fields: { title: s.title, notes: s.notes || '' },
    });
  });
  return docs;
}
