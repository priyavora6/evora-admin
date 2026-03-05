import { useEffect, useState } from 'react'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function EmailOtpMonitor() {
  const [otps, setOtps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'email_otps'),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
        setOtps(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching OTPs:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleDelete = async (email) => {
    try {
      await deleteDoc(doc(db, 'email_otps', email))
      alert(`OTP for ${email} deleted`)
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const isExpired = (expiresAt) => Date.now() > Number(expiresAt || 0)

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(Number(timestamp)).toLocaleTimeString()
  }

  if (loading) return <div className="text-center p-8">Loading OTPs...</div>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📧 Email OTP Monitor</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{otps.length}</p>
          <p className="text-sm text-blue-500 mt-1">Total Pending</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {otps.filter((otp) => !isExpired(otp.expiresAt)).length}
          </p>
          <p className="text-sm text-green-500 mt-1">Active</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600">
            {otps.filter((otp) => isExpired(otp.expiresAt)).length}
          </p>
          <p className="text-sm text-red-500 mt-1">Expired</p>
        </div>
      </div>

      {otps.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-lg">No pending OTPs</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-gray-600 font-semibold">Email</th>
                <th className="text-left px-6 py-4 text-gray-600 font-semibold">OTP</th>
                <th className="text-left px-6 py-4 text-gray-600 font-semibold">Expires At</th>
                <th className="text-left px-6 py-4 text-gray-600 font-semibold">Status</th>
                <th className="text-left px-6 py-4 text-gray-600 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {otps.map((otp) => {
                const expired = isExpired(otp.expiresAt)
                return (
                  <tr
                    key={otp.id}
                    className={`hover:bg-gray-50 transition ${expired ? 'opacity-50' : ''}`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">{otp.email || otp.id}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-mono">
                        🔒 Hashed (Secure)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatTime(otp.expiresAt)}</td>
                    <td className="px-6 py-4">
                      {expired ? (
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                          ❌ Expired
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">
                          ✅ Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(otp.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-semibold transition"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-yellow-800 text-sm">
          🔒 <strong>Security:</strong> OTPs are stored as SHA-256 hashes. Raw OTPs are never
          stored in the database — only sent to user's email.
        </p>
      </div>
    </div>
  )
}