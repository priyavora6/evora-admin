import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export const getMedia = (eventId, callback) => {
  const q = query(
    collection(db, 'events', eventId, 'media'),
    orderBy('uploadedAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const media = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(media)
  })
}