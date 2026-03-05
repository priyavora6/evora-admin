import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export default function EventRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState({});

  useEffect(() => {
    const q = query(collection(db, "eventRequests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(data);
    });

    return () => unsubscribe();
  }, []);

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const note = adminNotes[requestId] || '';
      await updateDoc(doc(db, "eventRequests", requestId), {
        status: newStatus,
        adminNotes: note,
        updatedAt: new Date()
      });
      setAdminNotes({ ...adminNotes, [requestId]: '' });
    } catch (err) {
      console.error("Error updating request:", err);
      alert("Failed to update request");
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  return (
    <div style={{ padding: '20px' }}>
      <div className="page-header">
        <h1>Event Requests</h1>
        <p>Review and manage user event booking requests</p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.total}</div>
          <div style={{ color: 'var(--text-medium)', marginTop: '5px' }}>Total Requests</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.pending}</div>
          <div style={{ color: 'var(--text-medium)', marginTop: '5px' }}>Pending</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)' }}>{stats.approved}</div>
          <div style={{ color: 'var(--text-medium)', marginTop: '5px' }}>Approved</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--error)' }}>{stats.rejected}</div>
          <div style={{ color: 'var(--text-medium)', marginTop: '5px' }}>Rejected</div>
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            className={`filter-chip ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Event Type</th>
              <th>Date</th>
              <th>Guests</th>
              <th>Budget</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-medium)' }}>
                  No {filter !== 'all' ? filter : ''} requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map(req => (
                <React.Fragment key={req.id}>
                  <tr>
                    <td>
                      <div style={{ fontWeight: '500' }}>{req.userName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>{req.userEmail}</div>
                    </td>
                    <td>{req.userPhone}</td>
                    <td>
                      <span className="filter-chip">{req.eventType}</span>
                    </td>
                    <td>{new Date(req.eventDate).toLocaleDateString()}</td>
                    <td>{req.guestCount}</td>
                    <td>₹{parseInt(req.estimatedBudget).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge status-${req.status}`}>
                        {req.status === 'pending' && <FiClock />}
                        {req.status === 'approved' && <FiCheckCircle />}
                        {req.status === 'rejected' && <FiXCircle />}
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="action-btn"
                            onClick={() => updateRequestStatus(req.id, 'approved')}
                            style={{ 
                              backgroundColor: 'var(--success)', 
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <FiCheckCircle /> Approve
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => updateRequestStatus(req.id, 'rejected')}
                            style={{ 
                              backgroundColor: 'var(--error)', 
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <FiXCircle /> Reject
                          </button>
                        </div>
                      )}
                      {req.status !== 'pending' && (
                        <span style={{ color: 'var(--text-medium)', fontSize: '14px' }}>
                          {req.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="8" style={{ padding: '0 20px 20px 20px', backgroundColor: 'var(--bg)' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Venue:</strong> {req.venue}
                      </div>
                      {req.message && (
                        <div style={{ marginBottom: '10px' }}>
                          <strong>Message:</strong> {req.message}
                        </div>
                      )}
                      {req.status === 'pending' && (
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Admin Notes (optional):
                          </label>
                          <textarea
                            className="search-input"
                            value={adminNotes[req.id] || ''}
                            onChange={(e) => setAdminNotes({ ...adminNotes, [req.id]: e.target.value })}
                            placeholder="Add notes about this request..."
                            rows="2"
                            style={{ width: '100%', resize: 'vertical' }}
                          />
                        </div>
                      )}
                      {req.adminNotes && (
                        <div style={{ 
                          marginTop: '10px', 
                          padding: '10px', 
                          backgroundColor: 'var(--surface)', 
                          borderRadius: 'var(--radius)',
                          borderLeft: '3px solid var(--primary)'
                        }}>
                          <strong>Admin Notes:</strong> {req.adminNotes}
                        </div>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
