import { collection, query, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

export const getSections = (eventId, callback) => {
  const q = query(collection(db, 'events', eventId, 'sections'))
  return onSnapshot(q, async (snap) => {
    const sections = []
    for (const d of snap.docs) {
      const itemsSnap = await getDocs(
        collection(db, 'events', eventId, 'sections', d.id, 'items')
      )
      const items = itemsSnap.docs.map(i => ({ id: i.id, ...i.data() }))
      sections.push({ id: d.id, ...d.data(), items })
    }
    callback(sections)
  })
}