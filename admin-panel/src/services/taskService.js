import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export const getTasks = (eventId, callback) => {
  const q = query(
    collection(db, 'events', eventId, 'tasks'),
    orderBy('dueDate')
  )
  return onSnapshot(q, (snap) => {
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(tasks)
  })
}