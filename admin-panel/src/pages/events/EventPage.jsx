import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, doc, query, orderBy, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { FiEye, FiShoppingBag, FiDollarSign, FiTruck, FiCheckCircle, FiGrid } from 'react-icons/fi';
import { sendPushNotification } from '../../services/NotificationService';
import { notifyUser } from '../../utils/notificationService';
import SearchBar from '../../components/common/SearchBar';
import FilterChips from '../../components/common/FilterChips';

export default function EventPage() {
  const [events, setEvents] = useState([]);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  useEffect(() => {
    // 🔥 LISTENER 1: Payments - Monitor payment changes
    const paymentsQuery = query(collection(db, "payments"));
    const unsubscribePayments = onSnapshot(paymentsQuery, async (paymentSnap) => {
      const allPayments = paymentSnap.docs.map(d => d.data());
      
      // 🔥 Get all events and update status based on payments
      const eventsSnap = await getDocs(query(collection(db, "userEvents")));

      eventsSnap.docs.forEach(async (eventDoc) => {
        const eventData = eventDoc.data();
        const eventUserId = eventData.userId?.trim();
        const eventTotal = eventData.totalEstimatedCost || 0;

        if (!eventUserId || eventTotal === 0) return;

        // 🔥 Calculate total paid from ALL successful payments for this user
        const totalPaid = allPayments
          .filter(p => {
            const paymentUserId = p.userId?.trim();
            const hasSuccessStatus = p.status === 'Success' || p.status === 'approved' || p.status === 'SUCCESS';
            return paymentUserId === eventUserId && hasSuccessStatus;
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        const isFullyPaid = totalPaid >= eventTotal;
        const hasPartialPayment = totalPaid > 0 && totalPaid < eventTotal;

        // 🔥 AUTO-CONFIRM if full payment
        if (isFullyPaid && eventData.status !== 'confirmed') {
          try {
            await updateDoc(doc(db, "userEvents", eventDoc.id), { 
              status: "confirmed", 
              confirmedAt: new Date(),
              paidAmount: totalPaid
            });
            console.log(`✅ Auto-confirmed event ${eventDoc.id}`);
          } catch (err) {
            console.error("Error auto-confirming:", err);
          }
        }
        // 🔥 REVERT if partial payment but currently confirmed
        else if (hasPartialPayment && eventData.status === 'confirmed') {
          try {
            await updateDoc(doc(db, "userEvents", eventDoc.id), { 
              status: "approved",
              confirmedAt: null
            });
            console.log(`⏳ Reverted event ${eventDoc.id} from confirmed to approved`);
          } catch (err) {
            console.error("Error reverting:", err);
          }
        }
      });
    });

    // 🔥 LISTENER 2: Events - Updates UI immediately when status changes
    const eventsQuery = query(collection(db, "userEvents"), orderBy("createdAt", "desc"));
    const unsubscribeEvents = onSnapshot(eventsQuery, async (eventSnap) => {
      const eventsWithScans = await Promise.all(
        eventSnap.docs.map(async (eventDoc) => {
          const scansSnap = await getDocs(collection(db, "userEvents", eventDoc.id, "scans"));
          return {
            id: eventDoc.id,
            scanCount: scansSnap.docs.length,
            ...eventDoc.data()
          };
        })
      );
      console.log("📋 Events updated in UI:", eventsWithScans.map(e => ({name: e.eventName, status: e.status})));
      setEvents(eventsWithScans);
    });

    return () => {
      unsubscribePayments();
      unsubscribeEvents();
    };
  }, []);

  // 🔥 FETCH FULL FINANCIAL & SERVICE DATA
  const openDetails = async (event) => {
    try {
      // 1. Fetch Selected Items (Services picked by User)
      const itemsSnap = await getDocs(collection(db, "userEvents", event.id, "selectedItems"));
      const items = itemsSnap.docs.map(d => d.data());

      // 2. Fetch Budget & Payments data
      const budgetSnap = await getDocs(collection(db, "userEvents", event.id, "budget"));
      const budgetData = budgetSnap.docs.length > 0 ? budgetSnap.docs[0].data() : { totalPaid: 0 };

      // 🔥 3. FETCH PAYMENT INFO - Check if user made a successful payment
      let paymentInfo = { totalPaid: budgetData.totalPaid || 0 };
      try {
        const paymentsSnap = await getDocs(collection(db, "payments"));
        const userPayment = paymentsSnap.docs.find(doc => {
          const p = doc.data();
          const isUserPayment = p.userId === event.userId;
          const isSuccess = p.status === 'Success' || p.status === 'approved' || p.status === 'SUCCESS';
          return isUserPayment && isSuccess;
        });

        if (userPayment) {
          const pData = userPayment.data();
          paymentInfo = {
            totalPaid: pData.amount || 0,
            paymentStatus: pData.status,
            transactionId: pData.transactionId,
            paymentMethod: pData.method,
            timestamp: pData.timestamp
          };
        }
      } catch (err) {
        console.error("Error fetching payment info:", err);
      }

      // 4. Fetch Scan data
      const scansSnap = await getDocs(collection(db, "userEvents", event.id, "scans"));
      const scanCount = scansSnap.docs.length;

      setSelectedDetail({ ...event, items, budgetData: paymentInfo, scanCount });
    } catch (err) {
      console.error("Error fetching full data:", err);
    }
  };

  // 🔥 APPROVE EVENT
  const approveEvent = async (eventId) => {
    try {
      // 1. Fetch event data to get userId
      const eventRef = doc(db, "userEvents", eventId);
      const eventSnap = await getDoc(eventRef);
      const eventData = eventSnap.data();
      const userId = eventData?.userId;

      // 2. Update the Main Event Status to Approved
      await updateDoc(eventRef, { status: "approved" });

      // 3. Update all "pending" bookings inside this event to "approved"
      // This triggers the "PAY NOW" button in the Flutter App
      const bookingsRef = collection(db, "userEvents", eventId, "bookings");
      const q = query(bookingsRef);
      const querySnapshot = await getDocs(q);

      const updatePromises = querySnapshot.docs.map((bookingDoc) => {
        return updateDoc(doc(db, "userEvents", eventId, "bookings", bookingDoc.id), {
          status: "approved" // ✅ This makes the Pay Now button appear in Flutter
        });
      });

      await Promise.all(updatePromises);

      // 4. Fetch User's FCM Token & Send Push Notification
      if (userId) {
        try {
          // 👇 SEND NOTIFICATION (Matches Flutter Logic)
          await notifyUser(
            userId,
            'approved',  // 👈 THIS KEY IS IMPORTANT
            'Booking Approved! 🎉',
            `Your request for "${eventData.eventName || 'your event'}" is approved. Open EVORA to complete payment.`
          );

          // 🚀 Send Live Push Notification via Legacy FCM API
          await sendPushNotification(
            userId,
            "Booking Approved! 🎉",
            `Your request for "${eventData.eventName || 'your event'}" is approved. Open EVORA to complete payment.`
          );
          console.log("✅ Push notification sent to user");
        } catch (notifErr) {
          console.error("⚠️ Could not send push notification:", notifErr);
          // Don't fail the approval if notification fails - it will be sent by Cloud Function
        }
      }

      // Update local state
      setEvents(events.map(e => e.id === eventId ? { ...e, status: "approved" } : e));
      
      alert("Event and all services approved successfully! User notified.");
    } catch (err) {
      console.error("Error approving event:", err);
      alert("Failed to approve event");
    }
  };

  // Filter and search events
  const filteredEvents = events.filter(e => {
    const matchesSearch = 
      e.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.userId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusFilters = [
    { label: 'All Events', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Confirmed', value: 'confirmed' }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>Manage Bookings</h1>
        <p style={{ color: 'var(--secondary)', marginTop: '5px' }}>Track services, payments, and budgets for all events.</p>
      </header>

      {/* Search and Filter Section */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by event name or user ID..."
          />
        </div>
        <FilterChips
          filters={statusFilters}
          active={selectedStatus}
          onChange={setSelectedStatus}
        />
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--secondary)' }}>
        Found <strong>{filteredEvents.length}</strong> event{filteredEvents.length !== 1 ? 's' : ''}
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Event Name</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>User</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Guests</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Scans</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Total Cost</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--secondary)' }}>
                  No events found matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px' }}><strong>{e.eventName}</strong></td>
                <td style={{ padding: '12px' }}>{e.userId.substring(0, 8)}...</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    background: 'rgba(233, 69, 96, 0.1)',
                    color: '#E94560',
                    fontWeight: '600'
                  }}>
                    👥 {e.guestCount || 0}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    background: 'rgba(46, 125, 50, 0.1)',
                    color: '#2E7D32',
                    fontWeight: '600'
                  }}>
                    📱 {e.scanCount || 0}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>₹{e.totalEstimatedCost?.toLocaleString()}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: e.status === 'confirmed' ? '#E8F5E9' : e.status === 'approved' ? '#E8F5E9' : '#FFF3E0',
                    color: e.status === 'confirmed' ? '#2E7D32' : e.status === 'approved' ? '#2E7D32' : '#EF6C00',
                    textTransform: 'uppercase'
                  }}>
                    {e.status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {e.status === 'pending' && (
                      <button 
                        className="btn-premium"
                        onClick={() => approveEvent(e.id)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '5px', 
                          fontSize: '14px',
                          background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                          padding: '8px 16px'
                        }}
                      >
                        ✅ Approve
                      </button>
                    )}
                    <button 
                      className="btn-premium" 
                      onClick={() => openDetails(e)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}
                    >
                      <FiEye /> View Details
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔍 THE MASTER DATA MODAL */}
      {selectedDetail && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.6)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="card" style={{ 
            width: '90%', 
            maxWidth: '900px', 
            padding: '0', 
            maxHeight: '85vh', 
            overflowY: 'auto',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.3s ease'
          }}>
            {/* Modal Header */}
            <div style={{ 
              padding: '30px', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.05) 0%, rgba(197, 157, 137, 0.05) 100%)',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '700' }}>
                  {selectedDetail.eventName}
                </h2>
                <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '13px' }}>
                  Booking Details & Financial Summary
                </p>
              </div>
              <button 
                onClick={() => setSelectedDetail(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '32px', 
                  cursor: 'pointer',
                  color: 'var(--secondary)',
                  padding: '0',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  hover: { background: 'rgba(0,0,0,0.05)' }
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '30px' }}>
              {/* 🔐 QR CODE SECTION */}
              <div style={{ 
                padding: '20px', 
                background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.05) 0%, rgba(46, 125, 50, 0.05) 100%)',
                borderRadius: '12px',
                marginBottom: '24px',
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiGrid size={18} /> Event QR Code
                  </h4>
                  <p style={{ margin: '0', color: 'var(--secondary)', fontSize: '13px' }}>
                    Share this QR code with guests for check-in
                  </p>
                </div>
                <div style={{
                  padding: '12px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '2px solid var(--border-color)'
                }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120&data=${encodeURIComponent(selectedDetail.id)}`}
                    alt="QR Code"
                    style={{ width: '120px', height: '120px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(46, 125, 50, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #2E7D32',
                    minWidth: '150px'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--secondary)', marginBottom: '4px' }}>Total Scans</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#2E7D32' }}>
                      {selectedDetail.scanCount || 0}
                    </div>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(233, 69, 96, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #E94560',
                    minWidth: '150px'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--secondary)', marginBottom: '4px' }}>Check-in Rate</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#E94560' }}>
                      {selectedDetail.guestCount ? Math.round((selectedDetail.scanCount || 0) / selectedDetail.guestCount * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                {/* 🛒 SERVICES PICKED */}
                <div style={{ 
                  padding: '24px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px',
                  background: 'var(--bg-light)',
                  transition: 'all 0.2s ease'
                }}>
                  <h4 style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    marginBottom: '20px',
                    margin: '0 0 20px 0',
                    fontSize: '16px',
                    fontWeight: '700'
                  }}>
                    <FiShoppingBag size={18} style={{ color: '#E94560' }} /> 
                    Selected Services
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedDetail.items && selectedDetail.items.length > 0 ? (
                      <>
                        {selectedDetail.items.map((item, i) => (
                          <div key={i} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '12px',
                            background: 'white',
                            borderRadius: '8px',
                            borderLeft: '3px solid #E94560'
                          }}>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.itemName}</div>
                              <div style={{ fontSize: '12px', color: 'var(--secondary)', marginTop: '2px' }}>
                                {item.sectionName}
                              </div>
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '14px' }}>₹{item.price?.toLocaleString()}</span>
                          </div>
                        ))}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          padding: '14px 12px',
                          background: '#F5F5F5',
                          borderRadius: '8px',
                          marginTop: '8px',
                          fontWeight: '700'
                        }}>
                          <span>Total Services</span>
                          <span style={{ color: '#E94560' }}>₹{selectedDetail.totalEstimatedCost?.toLocaleString()}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--secondary)', padding: '20px' }}>
                        No services selected
                      </div>
                    )}
                  </div>
                </div>

                {/* 💰 BUDGET & PAYMENTS */}
                <div style={{ 
                  padding: '24px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px',
                  background: 'var(--bg-light)',
                  transition: 'all 0.2s ease'
                }}>
                  <h4 style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    margin: '0 0 20px 0',
                    fontSize: '16px',
                    fontWeight: '700'
                  }}>
                    <FiDollarSign size={18} style={{ color: '#2E7D32' }} /> 
                    Budget & Payments
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px'
                    }}>
                      <span style={{ color: 'var(--secondary)' }}>Estimated Total</span>
                      <span style={{ fontWeight: '700' }}>₹{selectedDetail.totalEstimatedCost?.toLocaleString()}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      borderLeft: '3px solid #2E7D32'
                    }}>
                      <span style={{ color: 'var(--secondary)' }}>Total Paid</span>
                      <span style={{ fontWeight: '700', color: '#2E7D32' }}>₹{(selectedDetail.budgetData?.totalPaid || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '14px 12px',
                      background: selectedDetail.totalEstimatedCost - (selectedDetail.budgetData?.totalPaid || 0) === 0 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${selectedDetail.totalEstimatedCost - (selectedDetail.budgetData?.totalPaid || 0) === 0 ? '#2E7D32' : '#C62828'}`,
                      fontWeight: '700'
                    }}>
                      <span>Remaining Balance</span>
                      <span style={{ color: selectedDetail.totalEstimatedCost - (selectedDetail.budgetData?.totalPaid || 0) === 0 ? '#2E7D32' : '#C62828' }}>
                        ₹{(selectedDetail.totalEstimatedCost - (selectedDetail.budgetData?.totalPaid || 0)).toLocaleString()}
                      </span>
                    </div>

                    {/* 🔥 SHOW PAYMENT DETAILS IF PAYMENT EXISTS */}
                    {selectedDetail.budgetData?.paymentStatus && (
                      <>
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
                          <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: 'var(--secondary)' }}>
                            💳 Payment Details
                          </h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                              <span>Status:</span>
                              <strong style={{ color: '#2E7D32' }}>{selectedDetail.budgetData.paymentStatus}</strong>
                            </div>
                            {selectedDetail.budgetData?.transactionId && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span>Transaction ID:</span>
                                <strong style={{ fontFamily: 'monospace', fontSize: '11px' }}>{selectedDetail.budgetData.transactionId}</strong>
                              </div>
                            )}
                            {selectedDetail.budgetData?.paymentMethod && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span>Method:</span>
                                <strong>{selectedDetail.budgetData.paymentMethod}</strong>
                              </div>
                            )}
                            {selectedDetail.budgetData?.timestamp && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span>Paid Date:</span>
                                <strong>{new Date(selectedDetail.budgetData.timestamp.seconds * 1000).toLocaleDateString()}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    background: selectedDetail.totalEstimatedCost - (selectedDetail.budgetData?.totalPaid || 0) === 0 && (selectedDetail.status === 'confirmed' || selectedDetail.status === 'approved') ? 'rgba(46, 125, 50, 0.08)' : 'rgba(239, 108, 0, 0.08)',
                    borderLeft: `3px solid ${selectedDetail.totalEstimatedCost - (selectedDetail.budgetData?.totalPaid || 0) === 0 && (selectedDetail.status === 'confirmed' || selectedDetail.status === 'approved') ? '#2E7D32' : '#EF6C00'}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: selectedDetail.totalEstimatedCost - (selectedDetail.budgetData?.totalPaid || 0) === 0 && (selectedDetail.status === 'confirmed' || selectedDetail.status === 'approved') ? '#2E7D32' : '#EF6C00'
                  }}>
                    {selectedDetail.totalEstimatedCost - (selectedDetail.budgetData?.totalPaid || 0) === 0 && (selectedDetail.status === 'confirmed' || selectedDetail.status === 'approved') ? '✅ Fully Verified & Confirmed' : '⏳ Partially Paid - Awaiting Full Payment'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}