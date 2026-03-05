import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { setupDefaultAdmin } from './services/authService'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import UserPage from './pages/users/UserPage'
import UserDetailPage from './pages/users/UserDetailPage'
import EventPage from './pages/events/EventPage'
import EventDetail from './pages/events/EventDetail'
import GuestsPage from './pages/GuestsPage'
import EventTypesPage from './pages/EventTypesPage'
import SectionsPage from './pages/SectionsPage'
import PackagesPage from './pages/PackagesPage'
import VendorsPage from './pages/VendorsPage'
import TaskTemplatesPage from './pages/TaskTemplatesPage'
import SettingPage from './pages/settings/SettingPage'
import Rsvp from './pages/Rsvp'
import EmailOtpMonitor from './components/EmailOtpMonitor'
import SeedPage from './pages/SeedPage'
import EventRequestsPage from './pages/EventRequestsPage'
import Payments from './pages/Payments'
import TaskMonitor from './pages/TaskMonitor'


export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      await setupDefaultAdmin()
      setReady(true)
    }
    init()
  }, [])

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1A1A2E',
        color: 'white',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Setting up Evora Admin...</div>
        <div className="spinner" style={{
          width: 36, height: 36,
          border: '3px solid rgba(255,255,255,0.2)',
          borderTopColor: '#E94560',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/rsvp" element={<Rsvp />} />
          <Route path="/seed" element={<SeedPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UserPage />} />
            <Route path="users/:userId" element={<UserDetailPage />} />
            <Route path="events" element={<EventPage />} />
            <Route path="events/:eventId" element={<EventDetail />} />
            <Route path="event-requests" element={<EventRequestsPage />} />
            <Route path="payments" element={<Payments />} />
            <Route path="task-monitor" element={<TaskMonitor />} />
            <Route path="guests" element={<GuestsPage />} />
            <Route path="event-types" element={<EventTypesPage />} />
            <Route path="sections" element={<SectionsPage />} />
            <Route path="packages" element={<PackagesPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="tasks" element={<TaskTemplatesPage />} />
            <Route path="settings" element={<SettingPage />} />
            <Route path="admin/otps" element={<EmailOtpMonitor />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}