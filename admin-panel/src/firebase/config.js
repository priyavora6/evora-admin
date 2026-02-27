import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'
const firebaseConfig = {
  apiKey: "AIzaSyCHB-2Qde78kQmDbRD1KD6L8vdbtXafGfM",
  authDomain: "online-voting-system-76856.firebaseapp.com",
  projectId: "online-voting-system-76856",
  storageBucket: "online-voting-system-76856.firebasestorage.app",
  messagingSenderId: "107763524926",
  appId: "1:107763524926:web:49cd23b80017f2670af86f",
  measurementId: "G-HQFTPBYTFH"
};



const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const analytics = getAnalytics(app)
export default app

