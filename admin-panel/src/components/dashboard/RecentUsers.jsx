import { useNavigate } from 'react-router-dom'
import StatusBadge from '../common/StatusBadge'

export default function RecentUsers({ users }) {
  const nav = useNavigate()

  return (
    <div className="dashboard-section">
      <h3>👥 Recent Users</h3>
      {users.slice(0, 5).map(user => (
        <div
          key={user.id}
          onClick={() => nav(`/users/${user.id}`)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--primary)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13
            }}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{user.phone}</div>
            </div>
          </div>
          <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
        </div>
      ))}
    </div>
  )
}