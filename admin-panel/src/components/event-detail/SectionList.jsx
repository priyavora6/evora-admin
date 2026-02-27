import EmptyState from '../common/EmptyState'

export default function SectionList({ sections }) {
  if (sections.length === 0) return <EmptyState emoji="🧩" title="No sections" subtitle="No sections added yet" />

  return (
    <div className="item-list">
      {sections.map(sec => (
        <div key={sec.id} style={{
          background: 'var(--surface-grey)', borderRadius: 12,
          padding: 16, marginBottom: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{sec.sectionName}</div>
            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
              ₹{(sec.totalSectionCost || 0).toLocaleString()}
            </div>
          </div>

          {sec.items && sec.items.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sec.items.map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'white', borderRadius: 8,
                  fontSize: 13
                }}>
                  <span>
                    {item.selected ? '✅' : '⬜'} {item.itemName}
                    {item.quantity > 1 && ` × ${item.quantity}`}
                  </span>
                  <span style={{ fontWeight: 600 }}>₹{(item.totalPrice || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>No items</div>
          )}
        </div>
      ))}
    </div>
  )
}