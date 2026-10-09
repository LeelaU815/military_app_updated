import { SCHOOLS, PROVIDERS } from './data';
import { findBase, findCategory, priorityIds, ageFromDob } from './constants';

// Scores every school and provider near the family's base with TOPSIS
// (Technique for Order of Preference by Similarity to Ideal Solution).
//
// Each place gets a value for each criterion. A place's score is how close it is to the
// "ideal" place (best possible value on every criterion) vs. the "worst" place, after
// weighting each criterion by how the family ranked their priorities.
//
// The ideal is a fixed perfect place (free, serves them, 0 miles away), not the best place on the list,
// so the % means the same thing no matter what else is listed, and a type with only one place
// doesn't automatically get 100%.

// The map's filter tabs. Places are ranked against others of the same type.
export const PLACE_TYPES = [
  'Pediatric Specialists',
  'Therapists',
  'Schools',
  'Respite Care',
  'Military Facilities',
];

export function placeType(place) {
  if (place.type === 'public' || place.type === 'private') return 'Schools';
  if (place.onBase) return 'Military Facilities';
  if (place.kind === 'respite') return 'Respite Care';
  if (place.kind === 'therapy') return 'Therapists';
  return 'Pediatric Specialists'; // hospitals, doctors, and state services
}

const MAX_MILES = 30; // anything this far or farther counts as the worst possible distance

// Straight-line miles between two points (haversine formula).
export function milesBetween(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

// Cost: how affordable this place is with the family's plan (1 = best).
function costScore(place, insurance) {
  if (placeType(place) === 'Schools') return place.type === 'public' ? 1 : 0.3; // private = tuition
  switch (place.tricare) {
    case 'mtf': return insurance === 'Select' ? 0.6 : 1; // Select only gets MTF care when there's space
    case 'accepted': return 0.8;
    case 'efmp':
    case 'free': return 1;
    default: return 0.3;
  }
}

function costReason(place, insurance) {
  if (placeType(place) === 'Schools') return place.type === 'public' ? 'Public school (free)' : 'Private school (tuition)';
  switch (place.tricare) {
    case 'mtf': return insurance === 'Select' ? 'Military facility (Select: space-available)' : 'Military facility (Prime)';
    case 'accepted': return 'Accepts TRICARE';
    case 'efmp': return 'Paid for by Navy EFMP';
    case 'free': return 'Free';
    default: return 'TRICARE not listed';
  }
}

// Does this place serve the child's disability category? (null = we can't tell, e.g. "Other")
export function servesChild(place, profile) {
  const category = findCategory(profile.disabilityType);
  if (!category) return null;
  return place.categories.includes(category.id);
}

// School grade this school year (K = 0, Pre-K = -1). Virginia's cutoff: 5 years old by Sept 30 starts K.
export function estimatedGrade(profile) {
  const now = new Date();
  const schoolYearStart = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1; // Aug or later
  const { dobMonth, dobDay, dobYear } = profile;
  if (!dobMonth || !dobDay || !dobYear) return null;
  const sept30 = new Date(schoolYearStart, 8, 30);
  let ageOnCutoff = schoolYearStart - dobYear;
  if (new Date(schoolYearStart, dobMonth - 1, dobDay) > sept30) ageOnCutoff -= 1;
  return ageOnCutoff - 5;
}

// "PK-5" -> [-1, 5], "9-12" -> [9, 12]
function gradeRange(grades) {
  const toNumber = (g) => (g === 'PK' ? -1 : g === 'K' ? 0 : Number(g));
  const [low, high] = grades.split('-').map(toNumber);
  return [low, high];
}

// Is this school for a kid in their grade? (non-schools and unknown grades always count)
export function fitsGrade(place, profile) {
  if (placeType(place) !== 'Schools') return true;
  const grade = estimatedGrade(profile);
  if (grade === null || grade > 12) return true;
  const [low, high] = gradeRange(place.grades);
  return Math.max(grade, -1) >= low && Math.max(grade, -1) <= high;
}

// Fit: serves their category, and for schools, follows IEPs/504s (weighed by how much that matters to them).
function fitScore(place, profile) {
  const serves = servesChild(place, profile);
  let fit = serves === null ? 0.5 : serves ? 1 : 0;
  const specializedForThem = place.specialized && serves;
  if (placeType(place) === 'Schools' && place.iep504 !== true && !specializedForThem) {
    fit *= 1 - 0.1 * (profile.iepImportance || 0); // "limited" IEP support costs up to 50% at importance 5
  }
  return fit;
}

// Rank-order centroid: turns a ranking into weights that add up to 1.
// 3 items -> [0.611, 0.278, 0.111]
export function rankOrderWeights(count) {
  return Array.from({ length: count }, (_, i) => {
    let sum = 0;
    for (let k = i; k < count; k += 1) sum += 1 / (k + 1);
    return sum / count;
  });
}

// Which criteria count, and how much. Fit always counts; the rest follow the family's priority ranking.
// Quality, reviews, and wait times are skipped until we have real data for them.
export function criteriaWeights(profile) {
  const supported = ['cost', 'distance', 'proximity'];
  const ranked = priorityIds(profile.residentialDecided, profile.priorityOrder)
    .filter((id) => supported.includes(id));
  const fitWeight = 0.25 + 0.05 * Math.max(0, (profile.iepImportance || 1) - 1); // 0.25 to 0.45
  const rocWeights = rankOrderWeights(ranked.length);
  const weights = { fit: fitWeight };
  ranked.forEach((id, i) => {
    weights[id] = rocWeights[i] * (1 - fitWeight);
  });
  return weights;
}

// Each criterion as a 0-1 value where 1 is ideal (distances are flipped so closer = higher).
function criteriaValues(place, profile, base, home) {
  const baseMiles = milesBetween(base, place);
  const values = {
    fit: fitScore(place, profile),
    cost: costScore(place, profile.insurance),
    proximity: 1 - Math.min(baseMiles, MAX_MILES) / MAX_MILES,
  };
  let homeMiles = null;
  if (home) {
    homeMiles = milesBetween(home, place);
    values.distance = 1 - Math.min(homeMiles, MAX_MILES) / MAX_MILES;
  }
  return { values, baseMiles, homeMiles };
}

// TOPSIS with a fixed ideal (all 1s) and worst (all 0s).
function topsis(values, weights) {
  let toIdeal = 0;
  let toWorst = 0;
  Object.keys(weights).forEach((id) => {
    if (values[id] === undefined) return;
    toIdeal += (weights[id] * (1 - values[id])) ** 2;
    toWorst += (weights[id] * values[id]) ** 2;
  });
  toIdeal = Math.sqrt(toIdeal);
  toWorst = Math.sqrt(toWorst);
  return toIdeal + toWorst === 0 ? 0 : toWorst / (toIdeal + toWorst);
}

// Distance from home uses the coordinates saved with their address (homeLat/homeLng);
// without an address, everything is measured from the base.
// options.showAll: include places that don't fit the child (wrong grade, doesn't serve their category).
// Returns places best-first, each with { place, type, score (0-100), rank (within its type),
// forChild, servesChild, reasons }.
export function scorePlaces(profile, options = {}) {
  const { showAll = false } = options;
  const home = profile.homeLat != null && profile.homeLng != null
    ? { lat: profile.homeLat, lng: profile.homeLng }
    : null;
  const base = findBase(profile.installation);
  if (!base || !base.complete) return [];

  const weights = criteriaWeights(profile);
  if (!home) delete weights.distance;

  const places = [...SCHOOLS, ...PROVIDERS].filter((p) => p.baseId === base.id);
  let scored = places.map((place) => {
    const { values, baseMiles, homeMiles } = criteriaValues(place, profile, base, home);
    const serves = servesChild(place, profile);
    const reasons = [costReason(place, profile.insurance)];
    if (serves) reasons.push(`Serves ${findCategory(profile.disabilityType).label}`);
    if (placeType(place) === 'Schools') reasons.push(`Grades ${place.grades}`);
    if (homeMiles !== null) reasons.push(`${homeMiles.toFixed(1)} mi from home`);
    reasons.push(`${baseMiles.toFixed(1)} mi from ${base.name}`);
    return {
      place,
      type: placeType(place),
      score: Math.round(topsis(values, weights) * 100),
      criteria: values, // 0-1 per criterion, for the "why this score" breakdown
      servesChild: serves,
      forChild: serves !== false && fitsGrade(place, profile),
      reasons,
    };
  });

  if (!showAll) scored = scored.filter((s) => s.forChild);

  scored.sort((a, b) => b.score - a.score);
  const counts = {};
  scored.forEach((s) => {
    counts[s.type] = (counts[s.type] || 0) + 1;
    s.rank = counts[s.type];
  });
  return scored;
}
