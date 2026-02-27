import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)' }}>
        <Topbar />
        <main style={{ minHeight: 'calc(100vh - 60px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}