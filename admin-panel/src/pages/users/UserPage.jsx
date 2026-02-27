import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUsers } from '../../hooks/useUsers'
import { toggleUserActive, updateUserRole, deleteUser } from '../../services/userService'
import SearchBar from '../../components/common/SearchBar'
import FilterChips from '../../components/common/FilterChips'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmModal from '../../components/common/ConfirmModal'
import Loader from '../../components/common/Loader'
import '../../styles/tables.css'

export default function UsersPage() {
  const { users, loading } = useUsers()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)
  const nav = useNavigate()

  if (loading) return <Loader />

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'admin', label: 'Admins' },
  ]

  let filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search) || u.email?.toLowerCase().includes(search.toLowerCase())
    
    if (filter === 'all') return matchSearch
    if (filter === 'active') return matchSearch && u.isActive
    if (filter === 'inactive') return matchSearch && !u.isActive
    if (filter === 'admin') return matchSearch && u.role === 'admin'
    return matchSearch
  })

  const handleAction = async (action, user) => {
    switch (action) {
      case 'toggle':
        setConfirm({
          title: user.isActive ? 'Deactivate User?' : 'Activate User?',
          message: `${user.name} will be ${user.isActive ? 'blocked' : 'unblocked'}.`,
          onConfirm: async () => {
            await toggleUserActive(user.id, !user.isActive)
            setConfirm(null)
          }
        })
        break
      case 'role': {
        const newRole = user.role === 'admin' ? 'user' : 'admin'
        setConfirm({
          title: `Make ${newRole}?`,
          message: `${user.name} will become ${newRole}.`,
          onConfirm: async () => {
            await updateUserRole(user.id, newRole)
            setConfirm(null)
          }
        })
        break
      }
      case 'delete':
        setConfirm({
          title: 'Delete User?',
          message: `Delete ${user.name}? This cannot be undone.`,
          onConfirm: async () => {
            await deleteUser(user.id)
            setConfirm(null)
          }
        })
        break
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <h1>Users ({users.length})</h1>
      </div>

      <div className="search-filter-bar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search users..." />
        <FilterChips filters={filters} active={filter} onChange={setFilter} />
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              const joined = user.createdAt?.toDate?.() || 
                (user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000) : new Date())
              return (
                <tr key={user.id}>
                  <td>
                    <span style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => nav(`/users/${user.id}`)}>
                      {user.name}
                    </span>
                  </td>
                  <td>{user.phone}</td>
                  <td>{user.email || '-'}</td>
                  <td><StatusBadge status={user.role === 'admin' ? 'admin' : 'active'} /></td>
                  <td><StatusBadge status={user.isActive ? 'active' : 'inactive'} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    {joined.toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="action-btn view" onClick={() => nav(`/users/${user.id}`)}>View</button>
                      <button className="action-btn warning" onClick={() => handleAction('toggle', user)}>
                        {user.isActive ? 'Block' : 'Unblock'}
                      </button>
                      <button className="action-btn success" onClick={() => handleAction('role', user)}>
                        {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      <button className="action-btn danger" onClick={() => handleAction('delete', user)}>Delete</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}