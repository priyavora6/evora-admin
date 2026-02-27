import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext()

export function useAuthContext() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)

      if (user) {
        const userDocRef = doc(db, 'users', user.uid)

        const unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data())
            } else {
              setUserData({
                email: user.email,
                role: user.email === 'admin@evora.com' ? 'admin' : 'user'
              })
            }
            setLoading(false)
          },
          (error) => {
            console.warn('Auth snapshot error:', error.message)
            setUserData({
              email: user.email,
              role: user.email === 'admin@evora.com' ? 'admin' : 'user'
            })
            setLoading(false)
          }
        )

        return () => unsubscribeSnapshot()
      }

      setUserData(null)
      setLoading(false)
    })

    return () => unsubscribeAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}