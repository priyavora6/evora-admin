import { useAuth } from '../../hooks/useAuth'

export default function Topbar() {
  const { admin } = useAuth()

  return (
    <header style={{
      height: 60,
      background: 'white',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'var(--admin-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: 14
        }}>
          {admin?.name?.[0]?.toUpperCase() || 'A'}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{admin?.name || 'Admin'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Administrator</div>
        </div>
      </div>
    </header>
  )
}