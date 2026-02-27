import { collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export const getVendors = (eventId, callback) => {
  const q = query(collection(db, 'events', eventId, 'vendors'))
  return onSnapshot(q, (snap) => {
    const vendors = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(vendors)
  })
}