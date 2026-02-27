import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { streamAllUsers, toggleUserActive } from '../../services/userService';
import toast from 'react-hot-toast';

export default function UsersListPage() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    // Real-time listener — auto-updates when new user registers
    const unsub = streamAllUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    let result = [...users];

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Search filter
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(lower) ||
          u.email?.toLowerCase().includes(lower) ||
          u.phone?.includes(lower)
      );
    }

    return result;
  }, [users, search, roleFilter]);

  const handleBan = async (userId, currentStatus) => {
    const action = currentStatus ? 'ban' : 'unban';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await toggleUserActive(userId, !currentStatus);
      toast.success(`User ${action}ned successfully`);
    } catch {
      toast.error(`Failed to ${action} user`);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive !== false).length;
  const admins = users.filter((u) => u.role === 'admin').length;
  const today = users.filter((u) => {
    if (!u.createdAt) return false;
    const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold text-[#1B2F5E]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          All Users
        </h1>
        <p className="text-gray-400 mt-1">
          Users who registered on the EVORA mobile app
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-[#E8C9B8]/30 shadow-sm">
          <p className="text-3xl font-bold text-[#1B2F5E]">{totalUsers}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Users</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-green-200 shadow-sm">
          <p className="text-3xl font-bold text-green-600">{activeUsers}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Active</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#C9956A]/30 shadow-sm">
          <p className="text-3xl font-bold text-[#C9956A]">{admins}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Admins</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm">
          <p className="text-3xl font-bold text-blue-600">{today}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Joined Today</p>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[250px]">
          <input
            type="text"
            placeholder="🔍  Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#E8C9B8] bg-white focus:outline-none focus:border-[#B08D7A] focus:ring-2 focus:ring-[#B08D7A]/20 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'user', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                roleFilter === role
                  ? 'bg-[#1B2F5E] text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-[#B08D7A]'
              }`}
            >
              {role === 'all' ? '👥 All' : role === 'admin' ? '👑 Admin' : '👤 Users'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white rounded-2xl border border-[#E8C9B8]/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-[#B08D7A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 mt-4">Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-5xl mb-3">👥</p>
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F4F1]">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 hover:bg-[#F8F4F1]/50 transition-colors"
                  >
                    {/* Avatar + Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {user.photoUrl ? (
                          <img
                            src={user.photoUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B2F5E] to-[#243D7A] flex items-center justify-center text-white text-sm font-bold">
                            {(user.name || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#1B2F5E] text-sm">
                            {user.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400">UID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {user.email || '—'}
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {user.phone || '—'}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          user.role === 'admin'
                            ? 'bg-[#C9956A]/15 text-[#C9956A] border border-[#C9956A]/30'
                            : 'bg-[#1B2F5E]/10 text-[#1B2F5E] border border-[#1B2F5E]/20'
                        }`}
                      >
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>

                    {/* Registered */}
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Last Login */}
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {formatDate(user.lastLogin)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          user.isActive !== false
                            ? 'bg-green-50 text-green-600 border border-green-200'
                            : 'bg-red-50 text-red-500 border border-red-200'
                        }`}
                      >
                        {user.isActive !== false ? '● Active' : '● Banned'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/users/${user.id}`)}
                          className="text-xs bg-[#1B2F5E]/10 hover:bg-[#1B2F5E]/20 text-[#1B2F5E] px-3 py-1.5 rounded-lg transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleBan(user.id, user.isActive !== false)}
                          className={`text-xs px-3 py-1.5 rounded-lg transition ${
                            user.isActive !== false
                              ? 'bg-red-50 hover:bg-red-100 text-red-500'
                              : 'bg-green-50 hover:bg-green-100 text-green-600'
                          }`}
                        >
                          {user.isActive !== false ? 'Ban' : 'Unban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Count */}
        <div className="px-5 py-3 border-t border-gray-100 bg-[#F8F4F1]/50">
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {users.length} users
          </p>
        </div>
      </div>
    </div>
  );
}