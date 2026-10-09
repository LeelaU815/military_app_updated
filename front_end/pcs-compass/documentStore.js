import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';

// Documents are stored only on this device, never uploaded. Each account gets its own folder
// (<app documents>/documents/<uid>/), and the list of names, folders, and notes is kept in AsyncStorage.
// We save just the file name, not the full path, because iOS can move the app's folder after an update.

export const FOLDERS = [
  { id: 'military', label: 'Military & EFMP', icon: 'shield', color: '#5856D6' },
  { id: 'school', label: 'School', icon: 'school', color: '#007AFF' },
  { id: 'medical', label: 'Medical', icon: 'medkit', color: '#FF3B30' },
  { id: 'other', label: 'Other', icon: 'folder', color: '#FF9500' },
];

const indexKey = (uid) => `documents:${uid}`;

function folderFor(uid) {
  const dir = new Directory(Paths.document, 'documents', uid);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function fileFor(uid, doc) {
  return new File(Paths.document, 'documents', uid, doc.fileName);
}

export function isImage(doc) {
  return (doc.mimeType || '').startsWith('image/');
}

export function isPdf(doc) {
  return doc.mimeType === 'application/pdf' || /\.pdf$/i.test(doc.fileName);
}

// 245760 -> '240 KB'
export function formatSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// [{ id, name, folder, notes, fileName, mimeType, size, addedAt }], newest first.
export async function loadStoredDocuments(uid) {
  const saved = await AsyncStorage.getItem(indexKey(uid));
  const docs = saved ? JSON.parse(saved) : [];
  return docs.sort((a, b) => b.addedAt - a.addedAt);
}

async function saveIndex(uid, docs) {
  await AsyncStorage.setItem(indexKey(uid), JSON.stringify(docs));
}

// picked: { uri, name, mimeType, size } from the camera, photo library, or Files.
// fields: { name, folder, notes }
export async function addStoredDocument(uid, picked, fields) {
  const id = `doc-${Date.now()}`;
  const extension = (picked.name && picked.name.includes('.') ? picked.name.split('.').pop() : null)
    || (picked.mimeType === 'application/pdf' ? 'pdf' : 'jpg');
  const fileName = `${id}.${extension.toLowerCase()}`;
  const destination = new File(folderFor(uid), fileName);
  await new File(picked.uri).copy(destination);
  const doc = {
    id,
    ...fields,
    fileName,
    mimeType: picked.mimeType || null,
    size: picked.size || destination.size || null,
    addedAt: Date.now(),
  };
  const docs = await loadStoredDocuments(uid);
  await saveIndex(uid, [doc, ...docs]);
  return doc;
}

export async function updateStoredDocument(uid, id, fields) {
  const docs = await loadStoredDocuments(uid);
  await saveIndex(uid, docs.map((d) => (d.id === id ? { ...d, ...fields } : d)));
}

export async function deleteStoredDocument(uid, doc) {
  try {
    const file = fileFor(uid, doc);
    if (file.exists) file.delete();
  } catch (error) {
    console.log(error);
  }
  const docs = await loadStoredDocuments(uid);
  await saveIndex(uid, docs.filter((d) => d.id !== doc.id));
}
