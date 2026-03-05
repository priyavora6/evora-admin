import StatusBadge from '../common/StatusBadge'
import EmptyState from '../common/EmptyState'

export default function GuestList({ guests }) {
  if (guests.length === 0) return <EmptyState emoji="👥" title="No guests" subtitle="No guests added yet" />

  const checkedIn = guests.filter(g => g.status === 'checked_in').length
  const pending = guests.filter(g => g.status === 'pending').length
  const vips = guests.filter(g => g.isVIP === true).length

  return (
    <div>
      <div className="info-grid" style={{ marginBottom: 20 }}>
        <div className="info-card">
          <div className="label">Total</div>
          <div className="value" style={{ color: 'var(--info)' }}>{guests.length}</div>
        </div>
        <div className="info-card">
          <div className="label">Checked In</div>
          <div className="value" style={{ color: 'var(--success)' }}>{checkedIn}</div>
        </div>
        <div className="info-card">
          <div className="label">VIP Guests</div>
          <div className="value" style={{ color: 'var(--warning)' }}>{vips}</div>
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Source</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {guests.map(g => (
              <tr key={g.id}>
                <td style={{ fontWeight: 600 }}>{g.name}</td>
                <td>
                  <div>{g.phone || '-'}</div>
                  <div style={{ fontSize: '12px', color: 'gray' }}>{g.email || '-'}</div>
                </td>
                <td>
                  <span className={`badge ${g.source === 'rsvp_link' ? 'bg-blue' : 'bg-gray'}`}>
                    {g.source === 'rsvp_link' ? 'Online RSVP' : 'Host Added'}
                  </span>
                </td>
                <td>
                  {g.isVIP ? '🌟 VIP' : 'Regular'}
                </td>
                <td>
                  <span style={{ 
                    color: g.status === 'checked_in' ? 'green' : 'orange',
                    fontWeight: 'bold'
                  }}>
                    {g.status === 'checked_in' ? '✅ In Venue' : '⏳ Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}