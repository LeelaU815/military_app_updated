// Turns a street address into map coordinates with the free U.S. Census geocoder (no API key).
// Used once when a profile is saved, so scoring can measure distance from home.

const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

// Returns { lat, lng }, or null if the address can't be found (or there's no internet).
export async function geocodeAddress(address, city, state, zip) {
  const oneLine = [address, city, state, zip].filter(Boolean).join(', ');
  const url = `${CENSUS_URL}?address=${encodeURIComponent(oneLine)}&benchmark=Public_AR_Current&format=json`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const json = await response.json();
    const match = json.result && json.result.addressMatches && json.result.addressMatches[0];
    if (!match) return null;
    return { lat: match.coordinates.y, lng: match.coordinates.x };
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Adds homeLat/homeLng to a profile before saving. Only looks the address up again if it changed.
// Returns { profile, found } -- found is false when they gave an address we couldn't place on the map.
export async function withHomeLocation(profile, previous) {
  if (profile.residentialDecided !== 'Yes') {
    return { profile: { ...profile, homeLat: null, homeLng: null }, found: true };
  }
  const sameAddress = previous &&
    ['address', 'city', 'state', 'zip'].every((field) => previous[field] === profile[field]) &&
    previous.homeLat != null;
  if (sameAddress) {
    return { profile: { ...profile, homeLat: previous.homeLat, homeLng: previous.homeLng }, found: true };
  }
  const location = await geocodeAddress(profile.address, profile.city, profile.state, profile.zip);
  return {
    profile: { ...profile, homeLat: location ? location.lat : null, homeLng: location ? location.lng : null },
    found: !!location,
  };
}
