import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  orderBy,
  where,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const usersRef = collection(db, 'users');

// ─── GET ALL USERS ───
export async function getAllUsers() {
  const q = query(usersRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── REAL-TIME ALL USERS ───
export function streamAllUsers(callback) {
  const q = query(usersRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(users);
  });
}

// ─── GET SINGLE USER ───
export async function getUserById(userId) {
  if (!userId) return null;
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ─── GET USER'S EVENTS ───
export async function getUserEvents(userId) {
  const q = query(
    collection(db, 'events'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── BAN / UNBAN USER ───
export async function toggleUserActive(userId, isActive) {
  await updateDoc(doc(db, 'users', userId), { isActive });
}

// ─── UPDATE USER ROLE ───
export async function updateUserRole(userId, role) {
  await updateDoc(doc(db, 'users', userId), { role });
}

// ─── DELETE USER ───
export async function deleteUser(userId) {
  await deleteDoc(doc(db, 'users', userId));
}

// ─── STATS ───
export async function getUserStats() {
  const totalSnap = await getCountFromServer(usersRef);
  const activeSnap = await getCountFromServer(
    query(usersRef, where('isActive', '==', true))
  );
  return {
    total: totalSnap.data().count,
    active: activeSnap.data().count,
  };
}