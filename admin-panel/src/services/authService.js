import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

// ── DEFAULT ADMIN CREDENTIALS ──
const DEFAULT_ADMIN_EMAIL = 'admin@evora.com'
const DEFAULT_ADMIN_PASSWORD = 'Admin@123456'

// ── SETUP DEFAULT ADMIN (run once) ──
export const setupDefaultAdmin = async () => {
  try {
    // Try to sign in first
    const cred = await signInWithEmailAndPassword(auth, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD)
    
    // Check if user doc exists
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid))
    if (!userDoc.exists()) {
      // Create admin document
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: 'Admin',
        email: DEFAULT_ADMIN_EMAIL,
        phone: '',
        role: 'admin',
        isActive: true,
        profileUrl: '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      })
    }
    
    await signOut(auth)
    console.log('✅ Admin exists')
    return true
  } catch (error) {
    console.log('Admin not found, attempting to create...', error.code)
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
      try {
        // Create admin user
        console.log('Creating admin account...')
        const cred = await createUserWithEmailAndPassword(auth, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD)
        
        // Create admin document
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: 'Admin',
          email: DEFAULT_ADMIN_EMAIL,
          phone: '',
          role: 'admin',
          isActive: true,
          profileUrl: '',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        })
        
        await signOut(auth)
        console.log('✅ Admin account created successfully')
        return true
      } catch (createError) {
        console.error('❌ Failed to create admin:', createError)
        if (createError.code === 'auth/operation-not-allowed') {
          console.error('🔴 FIREBASE SETUP REQUIRED: Enable Email/Password authentication in Firebase Console')
          console.error('Go to: Firebase Console > Authentication > Sign-in method > Email/Password > Enable')
        }
        return false
      }
    }
    console.error('❌ Setup error:', error)
    return false
  }
}

// ── LOGIN ──
export const loginAdmin = async (email, password) => {
  try {
    console.log('Attempting login for:', email)
    const cred = await signInWithEmailAndPassword(auth, email, password)
    
    try {
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid))

      if (!userDoc.exists()) {
        await signOut(auth)
        throw new Error('User profile not found. Contact support.')
      }

      if (userDoc.data().role !== 'admin') {
        await signOut(auth)
        throw new Error('Access denied. Admin only.')
      }

      if (!userDoc.data().isActive) {
        await signOut(auth)
        throw new Error('Account deactivated. Contact support.')
      }

      // Update last login
      await setDoc(doc(db, 'users', cred.user.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true })

      console.log('✅ Login successful')
      return { uid: cred.user.uid, ...userDoc.data() }
    } catch (firestoreError) {
      await signOut(auth)
      if (firestoreError.code === 'permission-denied') {
        console.error('🔴 FIRESTORE PERMISSION DENIED: Update security rules')
        throw new Error('Database permission error. Update Firestore rules (see console)')
      }
      throw firestoreError
    }
  } catch (error) {
    console.error('❌ Login error:', error.code, error.message)
    
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
      throw new Error('Wrong email or password')
    }
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email')
    }
    if (error.code === 'auth/wrong-password') {
      throw new Error('Wrong password')
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Try again later.')
    }
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password authentication is not enabled. Contact administrator.')
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Check your internet connection.')
    }
    throw error
  }
}

// ── LOGOUT ──
export const logoutAdmin = () => signOut(auth)