import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export const getBudget = (eventId, callback) => {
  const q = query(
    collection(db, 'events', eventId, 'budget'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const budget = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(budget)
  })
}