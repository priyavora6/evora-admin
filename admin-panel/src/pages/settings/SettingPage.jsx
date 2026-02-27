import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import '../../styles/cards.css'

export default function SettingsPage() {
  const { admin, logout } = useAuth()
  const nav = useNavigate()

  const handleLogout = async () => {
    await logout()
    nav('/login')
  }

  return (
    <div className="settings-page">
      <h1 style={{ marginBottom: 24 }}>⚙️ Settings</h1>

      <div className="settings-card">
        <h3>👤 Admin Profile</h3>
        <div className="setting-row">
          <span className="label">Name</span>
          <span className="value">{admin?.name || 'Admin'}</span>
        </div>
        <div className="setting-row">
          <span className="label">Email</span>
          <span className="value">{admin?.email || '-'}</span>
        </div>
        <div className="setting-row">
          <span className="label">Phone</span>
          <span className="value">{admin?.phone || '-'}</span>
        </div>
        <div className="setting-row">
          <span className="label">Role</span>
          <span className="value">🛡️ Administrator</span>
        </div>
      </div>

      <div className="settings-card">
        <h3>ℹ️ About</h3>
        <div className="setting-row">
          <span className="label">App Name</span>
          <span className="value">Evora Admin Panel</span>
        </div>
        <div className="setting-row">
          <span className="label">Version</span>
          <span className="value">1.0.0</span>
        </div>
        <div className="setting-row">
          <span className="label">Platform</span>
          <span className="value">React + Vite + Firebase</span>
        </div>
      </div>

      <div className="settings-card">
        <h3>🚪 Session</h3>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: 14, background: 'var(--error)',
            color: 'white', borderRadius: 12, fontSize: 15, fontWeight: 600,
            marginTop: 8
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}