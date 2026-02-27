import EmptyState from '../common/EmptyState'
import StatusBadge from '../common/StatusBadge'

export default function TicketList({ tickets }) {
  if (tickets.length === 0) return <EmptyState emoji="🎫" title="No tickets" subtitle="No tickets sold yet" />

  const totalRevenue = tickets.reduce((s, t) => s + (t.totalAmount || 0), 0)

  return (
    <div>
      <div className="info-grid" style={{ marginBottom: 20 }}>
        <div className="info-card">
          <div className="label">Total Tickets</div>
          <div className="value">{tickets.length}</div>
        </div>
        <div className="info-card">
          <div className="label">Revenue</div>
          <div className="value" style={{ color: 'var(--success)' }}>₹{totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{t.buyerName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{t.buyerPhone}</div>
                </td>
                <td>{t.ticketType}</td>
                <td>{t.quantity}</td>
                <td>₹{(t.totalAmount || 0).toLocaleString()}</td>
                <td><StatusBadge status={t.status || 'active'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}