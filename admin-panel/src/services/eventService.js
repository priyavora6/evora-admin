import {
  collection, doc, getDoc, deleteDoc,
  query, orderBy, onSnapshot, where
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'events'

export const getAllEvents = (callback) => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const events = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(events)
  })
}

export const getUserEvents = (userId, callback) => {
  const q = query(
    collection(db, COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const events = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(events)
  })
}

export const getEvent = async (eventId) => {
  const d = await getDoc(doc(db, COL, eventId))
  if (d.exists()) return { id: d.id, ...d.data() }

  const userDoc = await getDoc(doc(db, 'userEvents', eventId))
  if (!userDoc.exists()) return null
  return { id: userDoc.id, ...userDoc.data(), _source: 'userEvents' }
}

export const deleteEvent = async (eventId) => {
  await deleteDoc(doc(db, COL, eventId))
}