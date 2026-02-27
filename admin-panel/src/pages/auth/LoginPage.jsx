import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/cards.css'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@evora.com')
  const [password, setPassword] = useState('Admin@123456')
  const { login, error, loginLoading, userData } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    if (userData?.role === 'admin') nav('/')
  }, [userData, nav])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="emoji">🛡️</div>
        <h1>Evora Admin</h1>
        <p className="subtitle">Sign in to manage your platform</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@evora.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loginLoading}>
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: 20, padding: 12,
          background: '#F5F5FA', borderRadius: 8,
          fontSize: 12, color: '#555577', textAlign: 'center'
        }}>
          <strong>Default Login:</strong><br />
          Email: admin@evora.com<br />
          Password: Admin@123456
        </div>
      </div>
    </div>
  )
}