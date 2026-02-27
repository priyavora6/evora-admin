import { useNavigate } from 'react-router-dom'

export default function RecentEvents({ events }) {
  const nav = useNavigate()

  return (
    <div className="dashboard-section">
      <h3>📅 Recent Events</h3>
      {events.slice(0, 5).map(event => (
        <div
          key={event.id}
          onClick={() => nav(`/events/${event.id}`)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{event.emoji || '🎉'}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{event.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                {event.eventType} • {event.guestCount || 0} guests
              </div>
            </div>
          </div>
          <span className={`status-badge ${event.status === 'active' ? 'upcoming' : 'completed'}`}>
            {event.status}
          </span>
        </div>
      ))}
    </div>
  )
}