import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../../hooks/useEvents';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'; 
import { deleteEvent } from '../../services/eventService';
import SearchBar from '../../components/common/SearchBar';
import FilterChips from '../../components/common/FilterChips';
import ConfirmModal from '../../components/common/ConfirmModal';
import Loader from '../../components/common/Loader';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import '../../styles/tables.css';

// Simple Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: { bg: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9' },
    pending: { bg: '#FFF3E0', color: '#EF6C00', border: '1px solid #FFE0B2' },
    rejected: { bg: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2' },
    completed: { bg: '#E3F2FD', color: '#1565C0', border: '1px solid #BBDEFB' }
  };
  
  const style = styles[status] || styles.pending;

  return (
    <span style={{
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: style.bg,
      color: style.color,
      border: style.border,
      textTransform: 'uppercase'
    }}>
      {status}
    </span>
  );
};

export default function EventsPage() {
  const { events, loading } = useEvents();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [confirm, setConfirm] = useState(null);
  const [userNames, setUserNames] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null); // For Modal
  const [modalLoading, setModalLoading] = useState(false);
  const nav = useNavigate();

  // Fetch User Names for Events
  useEffect(() => {
    const loadNames = async () => {
      const names = {};
      const uniqueIds = [...new Set(events.map(e => e.userId).filter(Boolean))];
      
      for (const uid of uniqueIds) {
        if (!names[uid]) {
          try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              names[uid] = userDoc.data().name || 'Unknown';
            } else {
              names[uid] = 'Unknown User';
            }
          } catch (error) {
            console.error("Error fetching user:", error);
            names[uid] = 'Error';
          }
        }
      }
      setUserNames(names);
    };
    
    if (events.length > 0) loadNames();
  }, [events]);

  if (loading) return <Loader />;

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'rejected', label: 'Rejected' },
  ];

  // Get unique event types for dropdown
  const eventTypes = ['all', ...new Set(events.map(e => e.eventTypeName).filter(Boolean))];

  // Filter Logic
  let filtered = events.filter(e => {
    const matchSearch = 
      e.eventName?.toLowerCase().includes(search.toLowerCase()) ||
      e.eventTypeName?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = filter === 'all' || e.status === filter;
    const matchType = eventTypeFilter === 'all' || e.eventTypeName === eventTypeFilter;
    
    return matchSearch && matchStatus && matchType;
  });

  // Sort Logic
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      case 'oldest':
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      case 'name':
        return (a.eventName || '').localeCompare(b.eventName || '');
      case 'budget-high':
        return (b.totalEstimatedCost || 0) - (a.totalEstimatedCost || 0);
      case 'budget-low':
        return (a.totalEstimatedCost || 0) - (b.totalEstimatedCost || 0);
      case 'guests':
        return (b.guestCount || 0) - (a.guestCount || 0);
      default:
        return 0;
    }
  });

  const handleDelete = (event) => {
    setConfirm({
      title: 'Delete Event?',
      message: `Delete "${event.eventName}"? This cannot be undone.`,
      onConfirm: async () => {
        await deleteEvent(event.id);
        setConfirm(null);
        // Ideally trigger a refresh here or use local state update
        window.location.reload(); 
      }
    });
  };

  const handleApprove = async (eventId) => {
    try {
      const eventRef = doc(db, 'userEvents', eventId);
      await updateDoc(eventRef, { status: 'confirmed' });
    } catch (error) {
      console.error('Error approving event:', error);
    }
  };

  // 🔥 FETCH DETAILS (ITEMS + GUESTS)
  const handleViewDetails = async (event) => {
    setModalLoading(true);
    try {
      // 1. Fetch Selected Items
      const itemsSnapshot = await getDocs(collection(db, "userEvents", event.id, "selectedItems"));
      const items = itemsSnapshot.docs.map(doc => doc.data());

      // 2. Fetch Guests
      const guestsSnapshot = await getDocs(collection(db, "userEvents", event.id, "guests"));
      const guests = guestsSnapshot.docs.map(doc => doc.data());
      
      setSelectedEvent({ ...event, items, guests });
    } catch (error) {
      console.error("Error fetching details:", error);
      alert("Could not load details");
    } finally {
      setModalLoading(false);
    }
  };

  // Update Status from Modal
  const handleStatusUpdate = async (eventId, newStatus) => {
    try {
      const eventRef = doc(db, "userEvents", eventId);
      await updateDoc(eventRef, { status: newStatus });
      
      // Update local state
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(prev => ({ ...prev, status: newStatus }));
      }
      
      alert(`Event marked as ${newStatus}!`);
      window.location.reload(); // Refresh to show updated status
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setFilter('all');
    setEventTypeFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters = search || filter !== 'all' || eventTypeFilter !== 'all' || sortBy !== 'newest';

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <h1>Events ({events.length})</h1>
      </div>

      <div className="search-filter-bar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search events..." />
        <FilterChips filters={filters} active={filter} onChange={setFilter} />
      </div>

      {/* Advanced Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Event Type:</label>
          <select 
            value={eventTypeFilter} 
            onChange={(e) => setEventTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            <option value="all">All Types</option>
            {eventTypes.filter(t => t !== 'all').map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Sort By:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="budget-high">Cost (High to Low)</option>
            <option value="budget-low">Cost (Low to High)</option>
            <option value="guests">Most Guests</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-light)', fontWeight: 500 }}>
          Showing {filtered.length} of {events.length} events
          {hasActiveFilters && (
            <button onClick={resetFilters} style={{ marginLeft: 10, padding: '6px 12px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}>
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h3>No events found</h3>
          <p>{hasActiveFilters ? 'Try adjusting your filters' : 'No events have been created yet'}</p>
          {hasActiveFilters && (
            <button onClick={resetFilters} style={{ marginTop: 16, padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8 }}>
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Created By</th>
                <th>Type</th>
                <th>Date</th>
                <th>Guests</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(event => {
                const date = event.eventDate?.toDate ? event.eventDate.toDate() : new Date();
                
                return (
                  <tr key={event.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }} onClick={() => nav(`/events/${event.id}`)}>
                        {event.eventName}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-light)' }}>
                        {userNames[event.userId] || 'Loading...'}
                      </span>
                    </td>
                    <td>{event.eventTypeName}</td>
                    <td style={{ fontSize: 12 }}>{date.toLocaleDateString()}</td>
                    <td>{event.guestCount || 0}</td>
                    <td>₹{(event.totalEstimatedCost || 0).toLocaleString()}</td>
                    <td><StatusBadge status={event.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="action-btn view" onClick={() => handleViewDetails(event)}>Details</button>
                        {event.status === 'pending' && (
                          <button className="action-btn success" onClick={() => handleApprove(event.id)}>Approve</button>
                        )}
                        <button className="action-btn danger" onClick={() => handleDelete(event)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* GUEST DETAILS MODAL */}
      {selectedEvent && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1B2F5E' }}>{selectedEvent.eventName}</h2>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Event Info Summary */}
            <div style={{ marginBottom: '20px', padding: '15px', background: '#F9F6F3', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                <div><strong>Type:</strong> {selectedEvent.eventTypeName}</div>
                <div><strong>Date:</strong> {selectedEvent.eventDate?.toDate ? selectedEvent.eventDate.toDate().toLocaleDateString() : 'N/A'}</div>
                <div><strong>Guest Count:</strong> {selectedEvent.guestCount}</div>
                <div><strong>Cost:</strong> ₹{selectedEvent.totalEstimatedCost?.toLocaleString()}</div>
              </div>
            </div>

            {/* TABS (Simple Toggle) */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ color: '#C59D89', borderBottom: '2px solid #C59D89', display: 'inline-block', paddingBottom: '5px' }}>Guest List</h3>
            </div>

            {modalLoading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading guest details...</div>
            ) : (
              <>
                {/* GUEST STATS */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <GuestStat 
                    icon={<CheckCircle size={16} />} 
                    label="Confirmed" 
                    count={selectedEvent.guests?.filter(g => g.rsvpStatus === 'confirmed').length || 0} 
                    color="green" 
                  />
                  <GuestStat 
                    icon={<Clock size={16} />} 
                    label="Pending" 
                    count={selectedEvent.guests?.filter(g => g.rsvpStatus === 'pending').length || 0} 
                    color="orange" 
                  />
                  <GuestStat 
                    icon={<XCircle size={16} />} 
                    label="Declined" 
                    count={selectedEvent.guests?.filter(g => g.rsvpStatus === 'declined').length || 0} 
                    color="red" 
                  />
                </div>

                {/* GUEST TABLE */}
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                  {selectedEvent.guests && selectedEvent.guests.length > 0 ? (
                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#F9F6F3' }}>
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Phone</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Side</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Relation</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEvent.guests.map((guest, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{guest.name || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{guest.phone || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{guest.side || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>{guest.relation || 'N/A'}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{
                                padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                backgroundColor: getStatusColor(guest.rsvpStatus || 'pending').bg,
                                color: getStatusColor(guest.rsvpStatus || 'pending').text
                              }}>
                                {(guest.rsvpStatus || 'pending').toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#7D726E' }}>No guests added yet.</div>
                  )}
                </div>

                {/* LIVE GUEST COUNTER */}
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '20px' }}>
                  Live Entry Status
                </h3>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  background: '#F9F6F3', 
                  padding: '20px', 
                  borderRadius: '12px',
                  marginTop: '15px'
                }}>
                  <div>
                    <p style={{ margin: 0, color: '#7D726E', fontSize: '14px' }}>Guests Checked In</p>
                    <h1 style={{ margin: '5px 0 0 0', color: '#1B2F5E', fontSize: '36px' }}>
                      {selectedEvent.checkedInCount || 0}
                      <span style={{ fontSize: '18px', color: '#7D726E', fontWeight: 'normal' }}> / {selectedEvent.guestCount || 0}</span>
                    </h1>
                  </div>

                  {/* Progress Circle (CSS only) */}
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#eee"
                        strokeWidth="4"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#4CAF50"
                        strokeWidth="4"
                        strokeDasharray={`${(selectedEvent.guestCount || 0) ? ((selectedEvent.checkedInCount || 0) / (selectedEvent.guestCount || 0)) * 100 : 0}, 100`}
                      />
                    </svg>
                    <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#4CAF50' }}>
                      {(selectedEvent.guestCount || 0) ? Math.round(((selectedEvent.checkedInCount || 0) / (selectedEvent.guestCount || 0)) * 100) : 0}%
                    </div>
                  </div>
                </div>

                {/* APPROVE / REJECT BUTTONS */}
                {selectedEvent.status === 'pending' && (
                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleStatusUpdate(selectedEvent.id, 'rejected')} style={rejectBtnStyle}>Reject Event</button>
                    <button onClick={() => handleStatusUpdate(selectedEvent.id, 'confirmed')} style={approveBtnStyle}>Approve Event</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components & Styles
const GuestStat = ({ icon, label, count, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color }}>
    {icon} <strong>{count}</strong> {label}
  </div>
);

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed': return { bg: '#E8F5E9', text: '#2E7D32' };
    case 'pending': return { bg: '#FFF3E0', text: '#EF6C00' };
    case 'declined': return { bg: '#FFEBEE', text: '#C62828' };
    default: return { bg: '#F5F5F5', text: '#616161' };
  }
};

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
};

const modalStyle = {
  backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '700px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
};

const approveBtnStyle = {
  padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold', cursor: 'pointer'
};

const rejectBtnStyle = {
  padding: '10px 20px', borderRadius: '8px', border: '1px solid #D9534F', backgroundColor: 'white', color: '#D9534F', fontWeight: 'bold', cursor: 'pointer'
};