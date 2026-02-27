import EmptyState from '../common/EmptyState'

export default function BudgetSummary({ budget }) {
  if (budget.length === 0) return <EmptyState emoji="💰" title="No budget" subtitle="No budget entries yet" />

  const totalEstimated = budget.reduce((s, b) => s + (b.estimatedAmount || 0), 0)
  const totalPaid = budget.reduce((s, b) => s + (b.paidAmount || 0), 0)
  const remaining = totalEstimated - totalPaid
  const pct = totalEstimated > 0 ? ((totalPaid / totalEstimated) * 100).toFixed(0) : 0

  return (
    <div>
      <div className="info-grid">
        <div className="info-card">
          <div className="label">Estimated</div>
          <div className="value" style={{ color: 'var(--info)' }}>₹{totalEstimated.toLocaleString()}</div>
        </div>
        <div className="info-card">
          <div className="label">Paid</div>
          <div className="value" style={{ color: 'var(--success)' }}>₹{totalPaid.toLocaleString()}</div>
        </div>
        <div className="info-card">
          <div className="label">Remaining</div>
          <div className="value" style={{ color: 'var(--warning)' }}>₹{remaining.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ margin: '16px 0', background: 'var(--surface-grey)', borderRadius: 8, height: 12, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: pct > 80 ? 'var(--error)' : 'var(--success)',
          borderRadius: 8, transition: 'width 0.3s'
        }}></div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'center' }}>{pct}% paid</div>

      <div className="item-list" style={{ marginTop: 20 }}>
        {budget.map(b => (
          <div className="item-row" key={b.id}>
            <div>
              <div className="name">{b.category || 'Uncategorized'}</div>
              <div className="meta">{b.description || ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>₹{(b.estimatedAmount || 0).toLocaleString()}</div>
              <span className={`status-badge ${b.isPaid ? 'confirmed' : 'pending'}`}>
                {b.isPaid ? 'Paid' : 'Unpaid'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}