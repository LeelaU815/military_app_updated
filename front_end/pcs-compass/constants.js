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
// savedOrder puts the items back in the order the family ranked them.
export function getPriorityItems(residentialDecided, savedOrder) {
  const ids = Object.keys(PRIORITY_LABELS).filter(
    (id) => id !== 'distance' || residentialDecided === 'Yes'
  );
  const ranked = (savedOrder || []).filter((id) => ids.includes(id));
  const ordered = [...ranked, ...ids.filter((id) => !ranked.includes(id))];
  return ordered.map((id) => ({ id, label: PRIORITY_LABELS[id] }));
}

export function priorityIds(residentialDecided, savedOrder) {
  return getPriorityItems(residentialDecided, savedOrder).map((item) => item.id);
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

export function ageFromDob(month, day, year) {
  if (!month || !day || !year) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age;
}

// Age shown on screens: from the date of birth, or the typed-in age on older profiles.
export function displayAge(profile) {
  const age = ageFromDob(profile.dobMonth, profile.dobDay, profile.dobYear);
  if (age !== null) return String(age);
  return profile.age ? String(profile.age) : null;
}

function toDate(month, day, year) {
  return new Date(year, month - 1, day);
}

// The profile wizard is 5 steps. Returns what's missing on that step, or null if it's good.
// The profile edit screen checks every step before saving.
export const PROFILE_STEPS = 5;

export function validateStep(data, step) {
  const blank = (v) => !v || !String(v).trim();
  switch (step) {
    case 1:
      if (blank(data.familyLastName)) return 'Enter your family last name.';
      if (blank(data.name)) return 'Enter your family member\'s name.';
      if (!(data.dobMonth && data.dobDay && data.dobYear)) return 'Pick a full date of birth.';
      if (toDate(data.dobMonth, data.dobDay, data.dobYear) > new Date()) return 'Date of birth can\'t be in the future.';
      if (blank(data.gender)) return 'Pick a gender.';
      if (data.gender === 'Self-describe' && blank(data.genderOther)) return 'Describe gender, or pick another option.';
      return null;
    case 2:
      if (blank(data.disabilityType)) return 'Pick a disability category.';
      if (isOther(data.disabilityType) && blank(data.disabilityOther)) return 'Describe the disability, or pick a category.';
      if (blank(data.efmpStatus)) return 'Pick your EFMP status.';
      if (!data.iepImportance) return 'Rate how important IEP / 504 accommodations are.';
      if (!data.respiteImportance) return 'Rate how important respite care is.';
      return null;
    case 3:
      if (blank(data.insurance)) return 'Pick your TRICARE plan.';
      if (blank(data.residentialDecided)) return 'Tell us if you\'ve picked where you\'ll live.';
      if (data.residentialDecided === 'Yes') {
        if (blank(data.address) || blank(data.city) || blank(data.state)) return 'Fill in the street address, city, and state.';
        if (!/^\d{5}$/.test(data.zip || '')) return 'ZIP code should be 5 digits.';
      }
      return null;
    case 4:
      return null;
    case 5:
      if (blank(data.notifications)) return 'Pick whether you want notifications.';
      if (blank(data.pcsDateType)) return 'Pick how you want to enter your PCS date.';
      if (data.pcsDateType === 'Date' && !(data.pcsMonth && data.pcsDay && data.pcsYear)) return 'Pick a full PCS date.';
      if (data.pcsDateType === 'Timeframe') {
        if (!(data.pcsStartMonth && data.pcsStartDay && data.pcsStartYear &&
              data.pcsEndMonth && data.pcsEndDay && data.pcsEndYear)) return 'Pick both the earliest and latest PCS dates.';
        if (toDate(data.pcsEndMonth, data.pcsEndDay, data.pcsEndYear) < toDate(data.pcsStartMonth, data.pcsStartDay, data.pcsStartYear)) {
          return 'The latest PCS date should be after the earliest.';
        }
      }
      if (blank(data.installation)) return 'Pick your installation.';
      return null;
    default:
      return null;
  }
}

export function validateProfile(data) {
  for (let step = 1; step <= PROFILE_STEPS; step += 1) {
    const error = validateStep(data, step);
    if (error) return error;
  }
  return null;
}
