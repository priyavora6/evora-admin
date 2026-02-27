import StatusBadge from '../common/StatusBadge'
import EmptyState from '../common/EmptyState'

export default function GuestList({ guests }) {
  if (guests.length === 0) return <EmptyState emoji="👥" title="No guests" subtitle="No guests added yet" />

  const confirmed = guests.filter(g => g.rsvpStatus === 'confirmed').length
  const pending = guests.filter(g => g.rsvpStatus === 'pending').length
  const declined = guests.filter(g => g.rsvpStatus === 'declined').length

  return (
    <div>
      <div className="info-grid" style={{ marginBottom: 20 }}>
        <div className="info-card">
          <div className="label">Total</div>
          <div className="value" style={{ color: 'var(--info)' }}>{guests.length}</div>
        </div>
        <div className="info-card">
          <div className="label">Confirmed</div>
          <div className="value" style={{ color: 'var(--success)' }}>{confirmed}</div>
        </div>
        <div className="info-card">
          <div className="label">Pending</div>
          <div className="value" style={{ color: 'var(--warning)' }}>{pending}</div>
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Group</th>
              <th>RSVP</th>
              <th>Checked In</th>
            </tr>
          </thead>
          <tbody>
            {guests.map(g => (
              <tr key={g.id}>
                <td style={{ fontWeight: 600 }}>{g.name}</td>
                <td>{g.phone || '-'}</td>
                <td>{g.email || '-'}</td>
                <td>{g.group || 'General'}</td>
                <td><StatusBadge status={g.rsvpStatus || 'pending'} /></td>
                <td>{g.checkedIn ? '✅' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}