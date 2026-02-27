import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export const getTickets = (eventId, callback) => {
  const q = query(
    collection(db, 'events', eventId, 'tickets'),
    orderBy('purchasedAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const tickets = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(tickets)
  })
}