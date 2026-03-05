import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function VendorBookingRequests() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [adminNote, setAdminNote] = useState({})
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'vendorBookings'), orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(
      q,
      (snap) => {
        setBookings(snap.docs.map((item) => ({ id: item.id, ...item.data() })))
        setLoading(false)
      },
      (error) => {
        console.error('Error loading vendor bookings:', error)
        setLoading(false)
      }
    )

    return () => unsub()
  }, [])

  const updateStatus = async (bookingId, eventId, status) => {
    setProcessing(bookingId)
    try {
      await updateDoc(doc(db, 'vendorBookings', bookingId), {
        status,
        adminNote: adminNote[bookingId] || '',
        updatedAt: serverTimestamp(),
      })

      await updateDoc(doc(db, 'userEvents', eventId, 'vendors', bookingId), {
        status,
        adminNote: adminNote[bookingId] || '',
        updatedAt: serverTimestamp(),
      })

      alert(`Booking ${status} successfully!`)
    } catch (error) {
      console.error(error)
      alert('Failed to update booking')
    }
    setProcessing(null)
  }

  const filtered = bookings.filter((booking) => (filter === 'all' ? true : booking.status === filter))

  if (loading) return <div className="p-8 text-center">Loading bookings...</div>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📋 Vendor Booking Requests</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-xl p-4 text-center border-2 transition ${
              filter === status ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
          >
            <p className="text-2xl font-bold text-gray-800">
              {status === 'all'
                ? bookings.length
                : bookings.filter((booking) => booking.status === status).length}
            </p>
            <p className="text-sm text-gray-500 capitalize mt-1">{status}</p>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📭</p>
          <p>No {filter} bookings</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{booking.vendorName}</h3>
                  <p className="text-sm text-gray-500">{booking.vendorCategory}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    STATUS_COLORS[booking.status] || STATUS_COLORS.cancelled
                  }`}
                >
                  {booking.status || 'unknown'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">👤 User</p>
                  <p className="font-medium">{booking.userName || 'N/A'}</p>
                  <p className="text-gray-500">{booking.userPhone || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">🎉 Event</p>
                  <p className="font-medium">{booking.eventName || 'N/A'}</p>
                  <p className="text-gray-500 text-xs">{booking.eventId || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-400 mb-1">💬 User Message</p>
                <p className="text-sm text-blue-800">{booking.message || 'No message provided.'}</p>
              </div>

              {booking.status === 'pending' && (
                <div className="mb-4">
                  <textarea
                    placeholder="Add admin note (optional)..."
                    rows={2}
                    value={adminNote[booking.id] || ''}
                    onChange={(event) =>
                      setAdminNote((prev) => ({
                        ...prev,
                        [booking.id]: event.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-blue-400"
                  />
                </div>
              )}

              {booking.adminNote && booking.status !== 'pending' && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-400 mb-1">📝 Admin Note</p>
                  <p className="text-sm text-gray-700">{booking.adminNote}</p>
                </div>
              )}

              {booking.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    disabled={processing === booking.id}
                    onClick={() => updateStatus(booking.id, booking.eventId, 'approved')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50"
                  >
                    {processing === booking.id ? '...' : '✅ Approve'}
                  </button>
                  <button
                    disabled={processing === booking.id}
                    onClick={() => updateStatus(booking.id, booking.eventId, 'rejected')}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50"
                  >
                    {processing === booking.id ? '...' : '❌ Reject'}
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-3">
                📅{' '}
                {booking.createdAt?.toDate
                  ? booking.createdAt.toDate().toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}