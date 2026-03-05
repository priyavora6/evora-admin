import { useState, useEffect } from 'react'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import GuestList from '../components/event-detail/GuestList'
import EventAccessCenter from '../components/event-detail/EventAccessCenter'
import Loader from '../components/common/Loader'
import EmptyState from '../components/common/EmptyState'
import { getAllEvents } from '../services/eventService'

export default function GuestsPage() {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [guests, setGuests] = useState([])
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, vips: 0 })
  const [loading, setLoading] = useState(true)

  // Load events
  useEffect(() => {
    const unsubscribe = getAllEvents((eventsList) => {
      setEvents(eventsList)
      if (eventsList.length > 0 && !selectedEventId) {
        setSelectedEventId(eventsList[0].id)
      }
      setLoading(false)
    })
    return () => unsubscribe && unsubscribe()
  }, [])

  // Load guests for selected event
  useEffect(() => {
    if (!selectedEventId) return

    const q = query(collection(db, 'userEvents', selectedEventId, 'guests'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const guestsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setGuests(guestsList)

      // Calculate stats
      let checkedIn = 0
      let vips = 0
      
      guestsList.forEach(guest => {
        if (guest.status === 'checked_in') checkedIn++
        if (guest.isVIP === true) vips++
      })

      setStats({
        total: guestsList.length,
        checkedIn: checkedIn,
        vips: vips
      })
    })
    return () => unsubscribe()
  }, [selectedEventId])

  if (loading) return <Loader />

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 16 }}>Live Guest Headcount</h1>
        
        {events.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Event</label>
            <select
              value={selectedEventId || ''}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-color)',
                cursor: 'pointer',
                minWidth: '300px'
              }}
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title || event.eventName || 'Untitled Event'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Event Access Center - Show RSVP Link & QR Code */}
        {selectedEventId && (
          <EventAccessCenter 
            eventId={selectedEventId} 
            expectedGuests={stats.total}
            checkedIn={stats.checkedIn}
          />
        )}

        {/* Live Stats */}
        <div className="info-grid" style={{ marginBottom: 24 }}>
          <div className="info-card">
            <div className="label">Total Guests</div>
            <div className="value" style={{ color: 'var(--info)', fontSize: '32px' }}>{stats.total}</div>
          </div>
          <div className="info-card">
            <div className="label">Checked In</div>
            <div className="value" style={{ color: 'var(--success)', fontSize: '32px' }}>{stats.checkedIn}</div>
          </div>
          <div className="info-card">
            <div className="label">VIP Guests</div>
            <div className="value" style={{ color: 'var(--warning)', fontSize: '32px' }}>{stats.vips}</div>
          </div>
        </div>
      </div>

      {guests.length > 0 ? (
        <GuestList guests={guests} />
      ) : (
        <EmptyState emoji="👥" title="No guests" subtitle="No guests for this event" />
      )}
    </div>
  )
}
