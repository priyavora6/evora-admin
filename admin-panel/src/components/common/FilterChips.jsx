export default function FilterChips({ filters, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {filters.map(f => (
        <button
          key={f.value}
          className={`filter-chip ${active === f.value ? 'active' : ''}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}