import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export const getGuests = (eventId, callback) => {
  const q = query(
    collection(db, 'events', eventId, 'guests'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const guests = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(guests)
  })
}