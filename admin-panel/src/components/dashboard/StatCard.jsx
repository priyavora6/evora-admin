export default function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="icon-box" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <div className="value" style={{ color }}>{value}</div>
        <div className="label">{label}</div>
      </div>
    </div>
  )
}