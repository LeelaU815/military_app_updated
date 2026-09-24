import { CATEGORIES } from './data';

// Shared options for the profile wizard, the profile screen, and the dashboard.
// Keep these in one place so the lists never drift apart.

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const GENDERS = ['Male', 'Female', 'Prefer not to say', 'Self-describe'];

// The 13 federal IDEA categories from data.js, plus "Other" for anything that doesn't fit.
export const DISABILITY_CATEGORIES = [...CATEGORIES.map((c) => c.label), 'Other'];

export const INSURANCE_OPTIONS = ['Prime', 'Select'];
export const EFMP_OPTIONS = ['Enrolled', 'Pending', 'Not Enrolled'];

export const INSTALLATION_DISPLAY_NAMES = {
  Norfolk: 'Naval Station Norfolk',
  'Little Creek': 'Joint Expeditionary Base Little Creek',
  Oceana: 'Naval Air Station Oceana',
  'Dam Neck': 'Dam Neck Annex',
  Yorktown: 'Naval Weapons Station Yorktown',
  Portsmouth: 'Naval Medical Center Portsmouth',
  Pentagon: 'The Pentagon',
  Quantico: 'Marine Corps Base Quantico',
  Other: 'your new installation',
};
export const INSTALLATIONS = Object.keys(INSTALLATION_DISPLAY_NAMES);

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
