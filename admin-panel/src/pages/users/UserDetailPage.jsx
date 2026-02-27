import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, getUserEvents, toggleUserActive, updateUserRole } from '../../services/userService';
import toast from 'react-hot-toast';

const eventTypeEmojis = {
  marriage: '💍', birthday: '🎂', engagement: '💕',
  baby_shower: '👶', corporate: '🏢', custom: '✨',
};

export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, userEvents] = await Promise.all([
          getUserById(userId),
          getUserEvents(userId),
        ]);
        setUser(userData);
        setEvents(userEvents);
      } catch {
        toast.error('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleToggleBan = async () => {
    const newStatus = !(user.isActive !== false);
    await toggleUserActive(userId, newStatus);
    setUser({ ...user, isActive: newStatus });
    toast.success(newStatus ? 'User unbanned' : 'User banned');
  };

  const handleMakeAdmin = async () => {
    if (!window.confirm('Make this user an admin?')) return;
    await updateUserRole(userId, 'admin');
    setUser({ ...user, role: 'admin' });
    toast.success('User is now admin');
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-3 border-[#B08D7A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-20 text-gray-400">User not found</div>;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/users')}
        className="text-sm text-gray-400 hover:text-[#1B2F5E] mb-4"
      >
        ← Back to Users
      </button>

      {/* ── Profile Card ── */}
      <div className="bg-gradient-to-r from-[#1B2F5E] to-[#243D7A] rounded-2xl p-8 mb-6 text-white">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          {user.photoUrl ? (
            <img src={user.photoUrl} alt="" className="w-20 h-20 rounded-full object-cover border-3 border-white/20" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold">
              {(user.name || 'U')[0].toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {user.name || 'Unknown User'}
            </h1>
            <p className="text-white/60 mt-1">{user.email}</p>

            <div className="flex gap-3 mt-3">
              <span className={`text-xs px-3 py-1 rounded-full ${
                user.role === 'admin' ? 'bg-[#C9956A]/30 text-[#CFAA95]' : 'bg-white/10 text-white/70'
              }`}>
                {user.role === 'admin' ? '👑 Admin' : '👤 User'}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full ${
                user.isActive !== false ? 'bg-green-400/20 text-green-200' : 'bg-red-400/20 text-red-200'
              }`}>
                {user.isActive !== false ? '● Active' : '● Banned'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleToggleBan}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                user.isActive !== false
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200'
                  : 'bg-green-500/20 hover:bg-green-500/30 text-green-200'
              }`}
            >
              {user.isActive !== false ? '🚫 Ban' : '✅ Unban'}
            </button>
            {user.role !== 'admin' && (
              <button
                onClick={handleMakeAdmin}
                className="bg-[#C9956A]/20 hover:bg-[#C9956A]/30 text-[#CFAA95] px-4 py-2 rounded-xl text-sm font-semibold transition"
              >
                👑 Make Admin
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            ['📧 Email', user.email || '—'],
            ['📱 Phone', user.phone || '—'],
            ['📅 Registered', formatDate(user.createdAt)],
            ['🕐 Last Login', formatDate(user.lastLogin)],
          ].map(([label, value]) => (
            <div key={label} className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-white/40">{label}</p>
              <p className="text-sm font-medium mt-1 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── User's Events ── */}
      <div className="bg-white rounded-2xl border border-[#E8C9B8]/30 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1B2F5E]">
            📋 User's Events ({events.length})
          </h2>
          <p className="text-xs text-gray-400 mt-1">All events created by this user</p>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-400">This user hasn't created any events yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="flex items-center justify-between p-5 hover:bg-[#F8F4F1]/50 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {eventTypeEmojis[event.eventType] || '📋'}
                  </span>
                  <div>
                    <p className="font-semibold text-[#1B2F5E]">{event.eventName}</p>
                    <p className="text-xs text-gray-400">
                      {event.eventType} · {event.location || 'No location'} · 👥 {event.guestCount || 0}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    event.status === 'active' ? 'bg-green-50 text-green-600' :
                    event.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>
                    {event.status || 'active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}