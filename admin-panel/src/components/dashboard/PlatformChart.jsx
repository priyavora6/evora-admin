import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export default function PlatformChart({ events }) {
  const types = {}
  events.forEach(e => {
    types[e.eventType] = (types[e.eventType] || 0) + 1
  })

  const data = Object.entries(types).map(([name, value]) => ({ name, value }))
  const COLORS = ['#6C63FF', '#E94560', '#4CAF50', '#FFA726', '#29B6F6']

  if (data.length === 0) return null

  return (
    <div className="dashboard-section">
      <h3>📊 Events by Type</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {data.map((d, i) => (
          <span key={d.name} style={{ fontSize: 12, color: 'var(--text-medium)' }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8,
              borderRadius: '50%', background: COLORS[i % COLORS.length],
              marginRight: 4
            }}></span>
            {d.name} ({d.value})
          </span>
        ))}
      </div>
    </div>
  )
}