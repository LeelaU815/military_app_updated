import { BASES, CATEGORIES } from './data';

// Shared options for the profile wizard, the profile screen, and the dashboard.
// Keep these in one place so the lists never drift apart.
// Profiles save ids (e.g. 'asd', 'norfolk'), and these helpers turn them back into labels.

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const GENDERS = ['Male', 'Female', 'Prefer not to say', 'Self-describe'];
export const INSURANCE_OPTIONS = ['Prime', 'Select'];
export const EFMP_OPTIONS = ['Enrolled', 'Pending', 'Not Enrolled'];

// The 13 federal IDEA categories from data.js, plus "Other" for anything that doesn't fit.
export const DISABILITY_OPTIONS = [
  ...CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
  { value: 'other', label: 'Other' },
];

export const INSTALLATION_OPTIONS = [
  ...BASES.map((b) => ({ value: b.id, label: b.shortName })),
  { value: 'other', label: 'Other' },
];

export const PRIORITY_LABELS = {
  cost: 'Cost (insurance coverage)',
  quality: 'Quality',
  reviews: 'Reviews from others',
  distance: 'Distance from house',
  availability: 'Availability / Wait times',
  proximity: 'Proximity to base and MTFs',
};

// "Distance from house" only makes sense once they've picked where they'll live.
export function getPriorityItems(residentialDecided) {
  return Object.keys(PRIORITY_LABELS)
    .filter((id) => id !== 'distance' || residentialDecided === 'Yes')
    .map((id) => ({ id, label: PRIORITY_LABELS[id] }));
}

const currentYear = new Date().getFullYear();
export const DOB_YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);
export const FUTURE_YEARS = Array.from({ length: 4 }, (_, i) => currentYear + i);

export function isOther(value) {
  return typeof value === 'string' && value.toLowerCase() === 'other';
}

// Accepts a base id ('norfolk') or the old saved name ('Norfolk').
export function findBase(value) {
  if (!value) return null;
  const v = value.toLowerCase();
  return BASES.find((b) => b.id === v || b.shortName.toLowerCase() === v) || null;
}

// The first version of the profile wizard had its own list -- map those onto IDEA categories.
const OLD_DISABILITY_LABELS = {
  ADHD: 'ohi',
  'Down Syndrome': 'id',
  'Cerebral Palsy': 'oi',
  'Speech/Language Disorder': 'sli',
  'Physical Disability': 'oi',
  'Chronic Medical Condition': 'ohi',
  'Mental Health Condition': 'ed',
};

// Accepts a category id ('asd'), a label, or an old wizard label ('ADHD').
export function findCategory(value) {
  if (!value) return null;
  const id = OLD_DISABILITY_LABELS[value] || value;
  return CATEGORIES.find((c) => c.id === id || c.label === id) || null;
}

export function installationName(value) {
  if (!value) return null;
  if (isOther(value)) return 'your new installation';
  const base = findBase(value);
  return base ? base.name : value;
}

export function disabilityLabel(profile) {
  if (isOther(profile.disabilityType)) return profile.disabilityOther;
  const category = findCategory(profile.disabilityType);
  return category ? category.label : profile.disabilityType;
}

// Older profiles saved labels ('Norfolk', 'Autism Spectrum Disorder (ASD)'); switch them to ids.
export function normalizeProfile(profile) {
  if (!profile) return profile;
  const base = findBase(profile.installation);
  const category = findCategory(profile.disabilityType);
  return {
    ...profile,
    installation: base ? base.id : isOther(profile.installation) ? 'other' : profile.installation,
    disabilityType: category ? category.id : isOther(profile.disabilityType) ? 'other' : profile.disabilityType,
  };
}
