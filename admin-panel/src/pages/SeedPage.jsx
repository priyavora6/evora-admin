import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '../firebase/config'

export default function SeedPage() {
  // ── Auth state ──
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // ── Login form ──
  const [email, setEmail] = useState('admin@evora.com')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // ── Seed state ──
  const [status, setStatus] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  // ── Watch auth state ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u)
        // Check if admin
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid))
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true)
          } else if (u.email === 'admin@evora.com') {
            setIsAdmin(true)
          } else {
            setIsAdmin(false)
          }
        } catch {
          // fallback: allow if email matches
          if (u.email === 'admin@evora.com') setIsAdmin(true)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      setAuthLoading(false)
    })
    return unsub
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // onAuthStateChanged will update state automatically
    } catch (err) {
      setLoginError(
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Wrong email or password.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Try again later.'
          : 'Login failed. Check your credentials.'
      )
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => signOut(auth)

  // ── Vendor data ──
  const vendors = [
    // WEDDING
    { name: "Royal Touch Decorators", category: "Decorator", city: "Rajkot", phone: "9876541001", priceRange: "₹20,000 - ₹80,000", rating: 4.8, description: "Luxury wedding and reception decoration.", sectionId: "wedding", isAvailable: true, totalBookings: 0 },
    { name: "Glam by Priya", category: "Makeup Artist", city: "Rajkot", phone: "9876541002", priceRange: "₹8,000 - ₹30,000", rating: 4.9, description: "Bridal HD and airbrush makeup specialist.", sectionId: "wedding", isAvailable: true, totalBookings: 0 },
    { name: "Click Perfect Photography", category: "Photographer", city: "Rajkot", phone: "9876541003", priceRange: "₹20,000 - ₹80,000", rating: 4.8, description: "Wedding photography with cinematic videography.", sectionId: "wedding", isAvailable: true, totalBookings: 0 },
    { name: "Tasty Caterers", category: "Caterer", city: "Rajkot", phone: "9876541004", priceRange: "₹500 - ₹1,500 per plate", rating: 4.5, description: "Veg and non-veg catering for weddings.", sectionId: "wedding", isAvailable: true, totalBookings: 0 },
    { name: "Beat Drop DJ", category: "DJ", city: "Rajkot", phone: "9876541005", priceRange: "₹10,000 - ₹40,000", rating: 4.5, description: "DJ services for wedding and sangeet nights.", sectionId: "wedding", isAvailable: true, totalBookings: 0 },
    { name: "Florals by Meera", category: "Florist", city: "Rajkot", phone: "9876541006", priceRange: "₹10,000 - ₹40,000", rating: 4.3, description: "Fresh flower decoration for weddings.", sectionId: "wedding", isAvailable: true, totalBookings: 0 },
    // BIRTHDAY
    { name: "Dream Decor Studio", category: "Decorator", city: "Rajkot", phone: "9876541007", priceRange: "₹15,000 - ₹60,000", rating: 4.5, description: "Theme-based decoration for birthday parties.", sectionId: "birthday", isAvailable: true, totalBookings: 0 },
    { name: "Grand Feast Co.", category: "Caterer", city: "Surat", phone: "9876541008", priceRange: "₹1,000 - ₹3,000 per plate", rating: 4.8, description: "Premium catering for birthday events.", sectionId: "birthday", isAvailable: true, totalBookings: 0 },
    { name: "DJ Mania Events", category: "DJ", city: "Rajkot", phone: "9876541009", priceRange: "₹15,000 - ₹60,000", rating: 4.7, description: "Sound lighting and DJ for birthday parties.", sectionId: "birthday", isAvailable: true, totalBookings: 0 },
    { name: "Shutter Stories", category: "Photographer", city: "Rajkot", phone: "9876541010", priceRange: "₹15,000 - ₹60,000", rating: 4.6, description: "Candid photography for birthday events.", sectionId: "birthday", isAvailable: true, totalBookings: 0 },
    // CORPORATE
    { name: "Corporate Visions Events", category: "Corporate Events", city: "Ahmedabad", phone: "9876541011", priceRange: "₹50,000 - ₹5,00,000", rating: 4.8, description: "End-to-end corporate event management.", sectionId: "corporate", isAvailable: true, totalBookings: 0 },
    { name: "ProEvent Solutions", category: "Corporate Events", city: "Rajkot", phone: "9876541012", priceRange: "₹30,000 - ₹2,00,000", rating: 4.6, description: "Seminars conferences and product launches.", sectionId: "corporate", isAvailable: true, totalBookings: 0 },
    { name: "Elegant Events Decor", category: "Decorator", city: "Ahmedabad", phone: "9876541013", priceRange: "₹25,000 - ₹1,00,000", rating: 4.9, description: "Premium corporate decoration and stage setup.", sectionId: "corporate", isAvailable: true, totalBookings: 0 },
    { name: "Golden Frame Studios", category: "Photographer", city: "Ahmedabad", phone: "9876541014", priceRange: "₹25,000 - ₹1,00,000", rating: 4.9, description: "Corporate event photography and videography.", sectionId: "corporate", isAvailable: true, totalBookings: 0 },
    // ENGAGEMENT
    { name: "Aisha Bridal Studio", category: "Makeup Artist", city: "Ahmedabad", phone: "9876541015", priceRange: "₹12,000 - ₹50,000", rating: 4.8, description: "Celebrity makeup artist for engagement looks.", sectionId: "engagement", isAvailable: true, totalBookings: 0 },
    { name: "Petal Perfect Flowers", category: "Florist", city: "Surat", phone: "9876541016", priceRange: "₹5,000 - ₹25,000", rating: 4.5, description: "Fresh flower arrangements for engagement.", sectionId: "engagement", isAvailable: true, totalBookings: 0 },
    { name: "Moments by Raj", category: "Photographer", city: "Rajkot", phone: "9876541017", priceRange: "₹12,000 - ₹45,000", rating: 4.4, description: "Candid and drone photography for engagement.", sectionId: "engagement", isAvailable: true, totalBookings: 0 },
    { name: "Grand Setup Co.", category: "Decorator", city: "Surat", phone: "9876541018", priceRange: "₹30,000 - ₹1,50,000", rating: 4.7, description: "Grand stage setup for engagement ceremony.", sectionId: "engagement", isAvailable: true, totalBookings: 0 },
    // BABYSHOWER
    { name: "Makeover Magic", category: "Makeup Artist", city: "Rajkot", phone: "9876541019", priceRange: "₹4,000 - ₹15,000", rating: 4.2, description: "Affordable makeup for baby shower events.", sectionId: "babyshower", isAvailable: true, totalBookings: 0 },
    { name: "Blossom Florist", category: "Florist", city: "Rajkot", phone: "9876541020", priceRange: "₹8,000 - ₹30,000", rating: 4.4, description: "Beautiful floral arrangements for baby showers.", sectionId: "babyshower", isAvailable: true, totalBookings: 0 },
    { name: "Shree Caterers", category: "Caterer", city: "Ahmedabad", phone: "9876541021", priceRange: "₹400 - ₹1,200 per plate", rating: 4.3, description: "Pure veg catering for baby shower parties.", sectionId: "babyshower", isAvailable: true, totalBookings: 0 },
    // GRADUATION
    { name: "Lens & Light Studio", category: "Photographer", city: "Surat", phone: "9876541022", priceRange: "₹18,000 - ₹70,000", rating: 4.5, description: "Complete photo and video for graduation.", sectionId: "graduation", isAvailable: true, totalBookings: 0 },
    { name: "Spice Garden Catering", category: "Caterer", city: "Rajkot", phone: "9876541023", priceRange: "₹600 - ₹1,800 per plate", rating: 4.6, description: "Live counters buffet for graduation parties.", sectionId: "graduation", isAvailable: true, totalBookings: 0 },
    // ANNIVERSARY
    { name: "Luxe Looks by Nisha", category: "Makeup Artist", city: "Surat", phone: "9876541024", priceRange: "₹10,000 - ₹40,000", rating: 4.7, description: "High-end makeup for anniversary events.", sectionId: "anniversary", isAvailable: true, totalBookings: 0 },
    { name: "Royal Feast Caterers", category: "Caterer", city: "Rajkot", phone: "9876541025", priceRange: "₹800 - ₹2,000 per plate", rating: 4.7, description: "Premium Gujarati thali for anniversary.", sectionId: "anniversary", isAvailable: true, totalBookings: 0 },
    { name: "Studio Blush Makeup", category: "Makeup Artist", city: "Rajkot", phone: "9876541026", priceRange: "₹5,000 - ₹20,000", rating: 4.6, description: "Party makeup for anniversary celebration.", sectionId: "anniversary", isAvailable: true, totalBookings: 0 },
    // PARTY
    { name: "Bass Nation DJ", category: "DJ", city: "Ahmedabad", phone: "9876541027", priceRange: "₹20,000 - ₹80,000", rating: 4.8, description: "Professional DJ with LED dance floor setup.", sectionId: "party", isAvailable: true, totalBookings: 0 },
    { name: "Star Performers Group", category: "Entertainment", city: "Ahmedabad", phone: "9876541028", priceRange: "₹20,000 - ₹1,00,000", rating: 4.7, description: "Live singers dancers and anchors for parties.", sectionId: "party", isAvailable: true, totalBookings: 0 },
    { name: "Shahi Band Baja", category: "Entertainment", city: "Rajkot", phone: "9876541029", priceRange: "₹15,000 - ₹50,000", rating: 4.6, description: "Traditional band baja for parties.", sectionId: "party", isAvailable: true, totalBookings: 0 },
    { name: "The Grand Palace Venue", category: "Venue", city: "Rajkot", phone: "9876541030", priceRange: "₹50,000 - ₹3,00,000", rating: 4.9, description: "Luxury banquet hall for all party events.", sectionId: "party", isAvailable: true, totalBookings: 0 },
  ]

  const eventSummary = [
    { event: '💍 Wedding', count: 6 },
    { event: '🎂 Birthday', count: 4 },
    { event: '🏢 Corporate', count: 4 },
    { event: '💑 Engagement', count: 4 },
    { event: '🍼 Baby Shower', count: 3 },
    { event: '🎓 Graduation', count: 2 },
    { event: '🥂 Anniversary', count: 3 },
    { event: '🎉 Party', count: 4 },
  ]

  const handleSeed = async () => {
    if (!window.confirm(`Add ${vendors.length} vendors to Firestore?`)) return
    setLoading(true)
    setDone(false)
    setProgress(0)

    for (let i = 0; i < vendors.length; i++) {
      const vendor = vendors[i]
      await addDoc(collection(db, 'vendors'), {
        ...vendor,
        createdAt: serverTimestamp(),
      })
      setStatus(`Adding: ${vendor.name}`)
      setProgress(Math.round(((i + 1) / vendors.length) * 100))
    }

    setLoading(false)
    setDone(true)
    setStatus('🎉 All 30 vendors added successfully!')
  }

  // ── Loading ──
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Checking auth...</p>
        </div>
      </div>
    )
  }

  // ── Not logged in ──
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <p className="text-4xl mb-2">🔐</p>
            <h1 className="text-xl font-bold text-gray-800">Admin Login Required</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to access the seed tool</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="admin@evora.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-50"
            >
              {loginLoading ? '⏳ Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Logged in but not admin ──
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <p className="text-4xl mb-3">🚫</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-500 text-sm mb-5">You are not authorized to use this page.</p>
          <button
            onClick={handleLogout}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-xl text-sm font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  // ── Admin logged in — Seed UI ──
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Signed in as <strong>{user.email}</strong></span>
          <button
            onClick={handleLogout}
            className="text-xs text-red-400 hover:text-red-600 font-semibold transition"
          >
            Sign Out
          </button>
        </div>

        <p className="text-5xl mt-4 mb-3">🌱</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Seed Vendors</h1>
        <p className="text-gray-500 text-sm mb-6">
          This will add <strong>30 vendors</strong> to Firestore across all event types.
          Run only once!
        </p>

        {/* Vendor count per event */}
        <div className="grid grid-cols-2 gap-2 mb-6 text-left text-xs">
          {eventSummary.map((item) => (
            <div key={item.event} className="bg-gray-50 rounded-lg p-2">
              <span className="font-semibold">{item.event}</span>
              <span className="text-gray-400 ml-1">({item.count})</span>
            </div>
          ))}
        </div>

        {/* Progress bar (while loading) */}
        {loading && (
          <div className="mb-4">
            <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{progress}% complete</p>
          </div>
        )}

        {/* Status */}
        {status && (
          <div className={`rounded-lg p-3 mb-4 text-sm font-medium ${
            done ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {status}
          </div>
        )}

        {/* Button */}
        {!done ? (
          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-lg transition disabled:opacity-50"
          >
            {loading ? '⏳ Adding vendors...' : '🚀 Seed 30 Vendors'}
          </button>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-bold text-lg">✅ Done!</p>
            <p className="text-green-600 text-sm mt-1">
              All 30 vendors are live in Firestore. You can now delete this page.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}