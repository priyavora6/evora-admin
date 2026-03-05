import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function BookEventPage() {
  const [formData, setFormData] = useState({
    userName: '',
    userPhone: '',
    userEmail: '',
    eventType: 'Wedding',
    eventDate: '',
    guestCount: '',
    estimatedBudget: '',
    venue: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const eventTypes = ['Wedding', 'Birthday', 'Corporate', 'Engagement', 'Baby Shower', 'Graduation', 'Anniversary', 'Party']

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.userName || !formData.userPhone || !formData.eventType) {
      alert('Please fill required fields')
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, 'eventRequests'), {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setSubmitted(true)
    } catch (error) {
      console.error(error)
      alert('Failed to submit request. Please try again.')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '48px', maxWidth: '500px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <p style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</p>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1B2F5E', marginBottom: '12px' }}>Request Submitted!</h1>
          <p style={{ color: '#7D726E', fontSize: '16px', marginBottom: '24px' }}>
            Your event booking request has been received. Our team will review and contact you within 24 hours.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#667eea', color: 'white', padding: '12px 32px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
          >
            Submit Another Request
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '40px', maxWidth: '600px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '48px', marginBottom: '8px' }}>✨</p>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1B2F5E', marginBottom: '8px' }}>Book Your Event</h1>
          <p style={{ color: '#7D726E', fontSize: '14px' }}>Fill in the details and we'll get back to you</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* User Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2F5E', marginBottom: '6px' }}>Your Name *</label>
              <input
                required
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                placeholder="Full name"
                style={{ width: '100%', padding: '12px', border: '2px solid #E6DCD6', borderRadius: '10px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2F5E', marginBottom: '6px' }}>Phone *</label>
              <input
                required
                type="tel"
                value={formData.userPhone}
                onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
                placeholder="Mobile number"
                style={{ width: '100%', padding: '12px', border: '2px solid #E6DCD6', borderRadius: '10px', fontSize: '14px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2F5E', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              value={formData.userEmail}
              onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
              placeholder="email@example.com"
              style={{ width: '100%', padding: '12px', border: '2px solid #E6DCD6', borderRadius: '10px', fontSize: '14px' }}
            />
          </div>

          {/* Event Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2F5E', marginBottom: '6px' }}>Event Type *</label>
              <select
                required
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '2px solid #E6DCD6', borderRadius: '10px', fontSize: '14px' }}
              >
                {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2F5E', marginBottom: '6px' }}>Event Date</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '2px solid #E6DCD6', borderRadius: '10px', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2F5E', marginBottom: '6px' }}>Guest Count</label>
              <input
                type="number"
                value={formData.guestCount}
                onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                placeholder="Approx. guests"
                style={{ width: '100%', padding: '12px', border: '2px solid #E6DCD6', borderRadius: '10px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2F5E', marginBottom: '6px' }}>Budget (₹)</label>
              <input
                type="number"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                placeholder="Estimated budget"
                style={{ width: '100%', padding: '12px', border: '2px solid #E6DCD6', borderRadius: '10px', fontSize: '14px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2F5E', marginBottom: '6px' }}>Venue/Location</label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="Event venue or city"
              style={{ width: '100%', padding: '12px', border: '2px solid #E6DCD6', borderRadius: '10px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1B2F5E', marginBottom: '6px' }}>Special Requirements</label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us about your event requirements..."
              style={{ width: '100%', padding: '12px', border: '2px solid #E6DCD6', borderRadius: '10px', fontSize: '14px', resize: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white', 
              padding: '16px', 
              borderRadius: '12px', 
              border: 'none', 
              fontSize: '16px', 
              fontWeight: '700', 
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
              marginTop: '8px'
            }}
          >
            {loading ? '⏳ Submitting...' : '🚀 Submit Booking Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
