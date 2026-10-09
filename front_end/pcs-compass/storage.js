import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';

import { auth, db } from './firebaseConfig';
import { normalizeProfile } from './constants';

// All Firebase reads/writes go through here.
// Accounts live in Firebase Auth; each family's profile is one Firestore doc at profiles/{uid}.

function toUser(firebaseUser) {
  if (!firebaseUser) return null;
  return { uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName };
}

export async function signUp(name, email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(user, { displayName: name.trim() });
  return toUser(user);
}

export async function logIn(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  return toUser(user);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logOut() {
  await signOut(auth);
}

// Firebase restores the saved login in the background when the app starts,
// so wait for that before saying nobody is logged in.
export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(toUser(user));
    });
  });
}

export async function loadProfile(uid) {
  const snapshot = await getDoc(doc(db, 'profiles', uid));
  return snapshot.exists() ? normalizeProfile(snapshot.data()) : null;
}

// status: 'draft' (saved partway through the wizard) or 'complete'
export async function saveProfile(uid, profile) {
  await setDoc(doc(db, 'profiles', uid), { ...profile, updatedAt: serverTimestamp() });
}

// Places the family picked on the map, at users/{uid}/savedLocations/{placeId}
// (shared with the EFMP Navigator web app, which uses the same users/{uid} path).
export async function loadSavedLocations(uid) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'savedLocations'));
  const saved = {};
  snapshot.forEach((d) => { saved[d.id] = d.data(); });
  return saved;
}

export async function saveLocation(uid, result) {
  const { place } = result;
  await setDoc(doc(db, 'users', uid, 'savedLocations', place.id), {
    placeId: place.id,
    name: place.name,
    type: result.type,
    address: place.address || null,
    phone: place.phone || null,
    score: result.score,
    chosenAt: serverTimestamp(),
  });
}

export async function removeLocation(uid, placeId) {
  await deleteDoc(doc(db, 'users', uid, 'savedLocations', placeId));
}

// Checklist check-offs and custom tasks, at users/{uid}/checklistProgress/{taskId}.
// Built-in tasks only get a doc once they're checked off; custom tasks always have one.
export async function loadChecklistProgress(uid) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'checklistProgress'));
  const progress = {};
  snapshot.forEach((d) => { progress[d.id] = d.data(); });
  return progress;
}

export async function setTaskDone(uid, task, done) {
  const ref = doc(db, 'users', uid, 'checklistProgress', task.id);
  if (task.custom) {
    await setDoc(ref, { done, doneAt: done ? serverTimestamp() : null }, { merge: true });
  } else if (done) {
    await setDoc(ref, { done: true, doneAt: serverTimestamp() });
  } else {
    await deleteDoc(ref);
  }
}

// fields: { title, notes, stage, topic, placeId, dueDate ('YYYY-MM-DD' or null) }
export async function addCustomTask(uid, fields) {
  const id = `custom-${Date.now()}`;
  const task = { custom: true, done: false, ...fields };
  await setDoc(doc(db, 'users', uid, 'checklistProgress', id), { ...task, createdAt: serverTimestamp() });
  return { id, ...task };
}

export async function updateCustomTask(uid, taskId, fields) {
  await setDoc(doc(db, 'users', uid, 'checklistProgress', taskId), fields, { merge: true });
}

export async function deleteCustomTask(uid, taskId) {
  await deleteDoc(doc(db, 'users', uid, 'checklistProgress', taskId));
}

// Contacts the family adds themselves, at users/{uid}/contacts/{contactId}.
export async function loadContacts(uid) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'contacts'));
  const contacts = [];
  snapshot.forEach((d) => contacts.push({ id: d.id, ...d.data() }));
  return contacts;
}

// fields: { name, role, phone, email, notes }. Pass an id to update an existing contact.
export async function saveContact(uid, fields, id) {
  const contactId = id || `contact-${Date.now()}`;
  await setDoc(doc(db, 'users', uid, 'contacts', contactId), { ...fields, updatedAt: serverTimestamp() }, { merge: true });
  return contactId;
}

export async function deleteContact(uid, contactId) {
  await deleteDoc(doc(db, 'users', uid, 'contacts', contactId));
}

// Appointments the family adds to the Calendar, at users/{uid}/events/{eventId}.
export async function loadEvents(uid) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'events'));
  const events = [];
  snapshot.forEach((d) => events.push({ id: d.id, ...d.data() }));
  return events;
}

// fields: { title, date: 'YYYY-MM-DD', time: 'HH:MM' or null for all day, placeId, location, notes }.
// Pass an id to update an existing event.
export async function saveEvent(uid, fields, id) {
  const eventId = id || `event-${Date.now()}`;
  await setDoc(doc(db, 'users', uid, 'events', eventId), { ...fields, updatedAt: serverTimestamp() }, { merge: true });
  return eventId;
}

export async function deleteEvent(uid, eventId) {
  await deleteDoc(doc(db, 'users', uid, 'events', eventId));
}

// Turns Firebase error codes into something a parent can act on.
export function authErrorMessage(error) {
  switch (error && error.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/invalid-email':
      return 'That email address doesn\'t look right.';
    case 'auth/weak-password':
      return 'Passwords need at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many tries. Wait a minute and try again.';
    case 'auth/network-request-failed':
      return 'No internet connection. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
