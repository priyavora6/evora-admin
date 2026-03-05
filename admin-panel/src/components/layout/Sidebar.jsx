import { NavLink } from 'react-router-dom'
import { 
  FiHome, 
  FiUsers, 
  FiCalendar,
  FiDollarSign,
  FiCheckSquare,
  FiSettings, 
  FiShoppingCart
} from 'react-icons/fi'
import '../../styles/sidebar.css'

export default function Sidebar() {
  const links = [
    { to: '/', icon: <FiHome />, label: 'Dashboard' },
    { to: '/users', icon: <FiUsers />, label: 'Users' },
    { to: '/events', icon: <FiCalendar />, label: 'Bookings' },
    { to: '/payments', icon: <FiDollarSign />, label: 'Transactions' },
    { to: '/task-monitor', icon: <FiCheckSquare />, label: 'Task Monitor' },
    { to: '/vendors', icon: <FiShoppingCart />, label: 'Vendors' },
    { to: '/settings', icon: <FiSettings />, label: 'Settings' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="emoji">✨</span>
        <span style={{ letterSpacing: '2px', fontWeight: 'bold' }}>EVORA</span>
      </div>

      <nav className="sidebar-nav">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="icon">{link.icon}</span>
            <span className="label">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-link" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          🛡️ Admin Control Panel v1.2
        </div>
      </div>
    </aside>
  )
}