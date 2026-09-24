import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
