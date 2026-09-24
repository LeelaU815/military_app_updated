import AsyncStorage from '@react-native-async-storage/async-storage';

import { normalizeProfile } from './constants';

// All AsyncStorage reads/writes go through here.
// Keys: 'users' (array of accounts), 'currentUser' (who's logged in), 'profile:<email>' (their profile).

export async function loadUsers() {
  const json = await AsyncStorage.getItem('users');
  return json ? JSON.parse(json) : [];
}

export async function saveUsers(users) {
  await AsyncStorage.setItem('users', JSON.stringify(users));
}

export async function getCurrentUser() {
  const json = await AsyncStorage.getItem('currentUser');
  return json ? JSON.parse(json) : null;
}

export async function setCurrentUser(user) {
  await AsyncStorage.setItem('currentUser', JSON.stringify(user));
}

export async function loadProfile(email) {
  const json = await AsyncStorage.getItem(`profile:${email}`);
  return json ? normalizeProfile(JSON.parse(json)) : null;
}

export async function saveProfile(email, profile) {
  await AsyncStorage.setItem(`profile:${email}`, JSON.stringify(profile));
}
