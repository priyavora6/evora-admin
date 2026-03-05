import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Users, Calendar, DollarSign, Clock } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    pending: 0,
    revenue: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Users Count
        const usersSnap = await getDocs(collection(db, "users"));
        
        // 2. Fetch Events (All) - without orderBy to avoid index issues
        const eventsSnap = await getDocs(collection(db, "userEvents"));
        
        let allEvents = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort by createdAt if available (client-side)
        allEvents = allEvents.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });

        // 3. Calculate Stats
        let totalRev = 0;
        let pendingCount = 0;

        allEvents.forEach((event) => {
          // 💰 REVENUE CALCULATION LOGIC
          // Count revenue for APPROVED or PAID events
          if (event.status === "approved" || event.status === "paid") {
            // Ensure amount is treated as a number (stripping symbols like ₹ or ,)
            let amount = event.totalEstimatedCost || event.amount || 0;
            
            if (typeof amount === 'string') {
              amount = parseFloat(amount.replace(/[^0-9.]/g, '')); 
            }
            
            totalRev += amount;
          }

          // ⏳ PENDING LOGIC
          if (event.status === "pending") {
            pendingCount++;
          }
        });

        setStats({
          users: usersSnap.size,
          events: allEvents.length,
          pending: pendingCount,
          revenue: totalRev
        });

        // 4. Set Recent Events (Top 5)
        setRecentEvents(allEvents.slice(0, 5));

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Loading Dashboard...</div>;

  return (
    <div style={{ padding: '40px', backgroundColor: '#F9F6F3', minHeight: '100vh' }}>
      
      {/* Header */}
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1B2F5E', margin: 0 }}>Dashboard Overview</h1>
        <p style={{ color: '#7D726E' }}>Welcome back, Admin. Here's what's happening today.</p>
      </header>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px', 
        marginBottom: '40px' 
      }}>
        <StatCard 
          title="Total Users" 
          value={stats.users} 
          icon={<Users size={24} color="#1B2F5E" />} 
          color="#E3F2FD" 
        />
        <StatCard 
          title="Total Bookings" 
          value={stats.events} 
          icon={<Calendar size={24} color="#1B2F5E" />} 
          color="#EDE7F6" 
        />
        <StatCard 
          title="Pending Requests" 
          value={stats.pending} 
          icon={<Clock size={24} color="#E65100" />} 
          color="#FFF3E0" 
          textColor="#E65100"
        />
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats.revenue.toLocaleString('en-IN')}`} 
          icon={<DollarSign size={24} color="#2E7D32" />} 
          color="#E8F5E9" 
          textColor="#2E7D32"
        />
      </div>

      {/* Recent Activity Table */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '25px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)' 
      }}>
        <h3 style={{ color: '#1B2F5E', marginBottom: '20px' }}>Recent Bookings</h3>
        {recentEvents.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#7D726E' }}>
            No events found. Start by adding your first event!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#7D726E', borderBottom: '2px solid #F9F6F3' }}>
                <th style={{ padding: '15px' }}>Event Name</th>
                <th style={{ padding: '15px' }}>Type</th>
                <th style={{ padding: '15px' }}>Date</th>
                <th style={{ padding: '15px' }}>Amount</th>
                <th style={{ padding: '15px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map(event => (
                <tr key={event.id} style={{ borderBottom: '1px solid #F9F6F3' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#1B2F5E' }}>
                    {event.eventName || 'Untitled Event'}
                  </td>
                  <td style={{ padding: '15px' }}>{event.eventTypeName || 'N/A'}</td>
                  <td style={{ padding: '15px' }}>
                    {event.eventDate?.toDate ? event.eventDate.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>
                    ₹{(event.totalEstimatedCost || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: getStatusColor(event.status || 'pending').bg,
                      color: getStatusColor(event.status || 'pending').text
                    }}>
                      {(event.status || 'pending').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

// --- Helper Components ---

const StatCard = ({ title, value, icon, color, textColor }) => (
  <div style={{ 
    backgroundColor: 'white', 
    padding: '25px', 
    borderRadius: '16px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  }}>
    <div style={{ 
      width: '50px', 
      height: '50px', 
      borderRadius: '12px', 
      backgroundColor: color, 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, color: '#7D726E', fontSize: '14px' }}>{title}</p>
      <h2 style={{ margin: '5px 0 0 0', color: textColor || '#1B2F5E', fontSize: '24px' }}>{value}</h2>
    </div>
  </div>
);

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed': return { bg: '#E8F5E9', text: '#2E7D32' };
    case 'pending': return { bg: '#FFF3E0', text: '#EF6C00' };
    case 'rejected': return { bg: '#FFEBEE', text: '#C62828' };
    default: return { bg: '#F5F5F5', text: '#616161' };
  }
};