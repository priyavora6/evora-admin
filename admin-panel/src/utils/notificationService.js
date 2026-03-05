import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

export const notifyUser = async (userId, type, title, message) => {
  if (!userId) return

  try {
    await addDoc(collection(db, 'notifications', userId, 'items'), {
      title,
      message,
      type,
      isRead: false,
      createdAt: serverTimestamp()
    })
    console.log(`🔔 Notification Sent: ${title}`)
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}
