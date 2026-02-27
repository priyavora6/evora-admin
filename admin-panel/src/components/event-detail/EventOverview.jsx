export default function EventOverview({ event }) {
  const startDate = event.startDate?.toDate?.() ||
    (event.startDate?.seconds ? new Date(event.startDate.seconds * 1000) : null)
  const eventDate = event.eventDate?.toDate?.() ||
    (event.eventDate?.seconds ? new Date(event.eventDate.seconds * 1000) : null)
  const date = eventDate || startDate
  const budget = event.totalBudget ?? event.totalEstimatedCost ?? 0
  const eventType = event.eventType || event.eventTypeName || '-'

  return (
    <div>
      <div className="info-grid">
        <div className="info-card">
          <div className="label">📅 Date</div>
          <div className="value">
            {date
              ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '-'}
          </div>
        </div>
        <div className="info-card">
          <div className="label">📍 Location</div>
          <div className="value">{event.location || '-'}</div>
        </div>
        <div className="info-card">
          <div className="label">🏛️ Venue</div>
          <div className="value">{event.venue || '-'}</div>
        </div>
        <div className="info-card">
          <div className="label">👥 Guests</div>
          <div className="value">{event.guestCount || 0}</div>
        </div>
        <div className="info-card">
          <div className="label">💰 Budget</div>
          <div className="value">₹{budget.toLocaleString()}</div>
        </div>
        <div className="info-card">
          <div className="label">📋 Type</div>
          <div className="value">{eventType}</div>
        </div>
      </div>
      {event.description && (
        <div style={{ padding: 16, background: 'var(--surface-grey)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>Description</div>
          <div style={{ fontSize: 14 }}>{event.description}</div>
        </div>
      )}
    </div>
  )
}