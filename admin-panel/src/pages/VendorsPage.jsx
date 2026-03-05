import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, query, orderBy, serverTimestamp, getDocs
} from 'firebase/firestore'
import { db } from '../firebase/config'
import '../styles/tables.css'

const CATEGORIES = ['Decorator', 'Caterer', 'Photographer', 'Makeup Artist', 'DJ', 'Florist', 'Other']

const EMPTY_FORM = {
  name: '',
  category: 'Decorator',
  city: '',
  phone: '',
  priceRange: '',
  rating: 4.5,
  description: '',
  sectionId: '',
  isAvailable: true,
}

export default function VendorsPage() {
  const [activeTab, setActiveTab] = useState('vendors') // 'vendors' | 'bookings' | 'usage'
  const [vendors, setVendors] = useState([])
  const [bookings, setBookings] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [processing, setProcessing] = useState(null)
  const [adminNote, setAdminNote] = useState({})
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  // ── LOAD DATA ──────────────────────────────────────────────
  useEffect(() => {
    // Load vendors real-time
    const vendorUnsub = onSnapshot(
      query(collection(db, 'vendors'), orderBy('name')),
      (snap) => {
        setVendors(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      }
    )

    // Load bookings real-time
    const bookingUnsub = onSnapshot(
      query(collection(db, 'vendorBookings'), orderBy('createdAt', 'desc')),
      (snap) => {
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }
    )

    // Load sections for sectionId dropdown
    getDocs(collection(db, 'sections')).then((snap) => {
      setSections(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })

    return () => {
      vendorUnsub()
      bookingUnsub()
    }
  }, [])

  // ── VENDOR CRUD ────────────────────────────────────────────
  const openAddModal = () => {
    setEditingVendor(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEditModal = (vendor) => {
    setEditingVendor(vendor)
    setForm({
      name: vendor.name || '',
      category: vendor.category || 'Decorator',
      city: vendor.city || '',
      phone: vendor.phone || '',
      priceRange: vendor.priceRange || '',
      rating: vendor.rating || 4.5,
      description: vendor.description || '',
      sectionId: vendor.sectionId || '',
      isAvailable: vendor.isAvailable ?? true,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.city) {
      alert('Name, Phone and City are required!')
      return
    }
    setSaving(true)
    try {
      const data = {
        ...form,
        rating: parseFloat(form.rating),
        updatedAt: serverTimestamp(),
      }

      if (editingVendor) {
        // ✅ Update existing vendor
        await updateDoc(doc(db, 'vendors', editingVendor.id), data)
      } else {
        // ✅ Add new vendor
        await addDoc(collection(db, 'vendors'), {
          ...data,
          totalBookings: 0,
          createdAt: serverTimestamp(),
        })
      }
      setShowModal(false)
    } catch {
      console.error('Failed to save vendor')
      alert('Failed to save vendor')
    }
    setSaving(false)
  }

  const handleDelete = async (vendorId, vendorName) => {
    if (!window.confirm(`Delete vendor "${vendorName}"? This cannot be undone.`)) return
    setDeleting(vendorId)
    try {
      await deleteDoc(doc(db, 'vendors', vendorId))
    } catch {
      alert('Failed to delete vendor')
    }
    setDeleting(null)
  }

  const toggleAvailability = async (vendor) => {
    await updateDoc(doc(db, 'vendors', vendor.id), {
      isAvailable: !vendor.isAvailable,
      updatedAt: serverTimestamp(),
    })
  }

  // ── BOOKING ACTIONS ────────────────────────────────────────
  const updateBookingStatus = async (bookingId, eventId, status) => {
    setProcessing(bookingId)
    try {
      await updateDoc(doc(db, 'vendorBookings', bookingId), {
        status,
        adminNote: adminNote[bookingId] || '',
        updatedAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'userEvents', eventId, 'vendors', bookingId), {
        status,
        adminNote: adminNote[bookingId] || '',
        updatedAt: serverTimestamp(),
      })
    } catch {
      alert('Failed to update booking')
    }
    setProcessing(null)
  }

  // ── COMPUTED ───────────────────────────────────────────────
  const filteredVendors = vendors.filter((v) => {
    const matchCategory = filterCategory === 'All' || v.category === filterCategory
    const matchSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.city?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCategory && matchSearch
  })

  const filteredBookings = bookings.filter((b) =>
    filterStatus === 'all' ? true : b.status === filterStatus
  )

  // Usage: group bookings by vendor
  const vendorUsage = vendors.map((vendor) => {
    const vendorBookings = bookings.filter((b) => b.vendorId === vendor.id)
    return {
      ...vendor,
      totalBookings: vendorBookings.length,
      pendingCount: vendorBookings.filter((b) => b.status === 'pending').length,
      approvedCount: vendorBookings.filter((b) => b.status === 'approved').length,
      rejectedCount: vendorBookings.filter((b) => b.status === 'rejected').length,
      bookings: vendorBookings,
    }
  }).sort((a, b) => b.totalBookings - a.totalBookings)

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Loading vendors...</div>

  return (
    <div style={{ padding: '32px', background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <div className="page-header">
        <div>
          <h1>🏪 Vendor Management</h1>
          <p style={{ color: 'var(--text-medium)', fontSize: '14px', marginTop: '8px' }}>
            {vendors.length} vendors · {bookings.filter(b => b.status === 'pending').length} pending bookings
          </p>
        </div>
        {activeTab === 'vendors' && (
          <button
            onClick={openAddModal}
            className="action-btn primary"
          >
            + Add Vendor
          </button>
        )}
      </div>

      {/* ── STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Total Vendors', value: vendors.length, color: 'var(--primary)', icon: '🏪' },
          { label: 'Available', value: vendors.filter(v => v.isAvailable).length, color: 'var(--success)', icon: '✅' },
          { label: 'Pending Bookings', value: bookings.filter(b => b.status === 'pending').length, color: 'var(--warning)', icon: '⏳' },
          { label: 'Approved Bookings', value: bookings.filter(b => b.status === 'approved').length, color: 'var(--secondary)', icon: '🎉' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: '0 2px 8px var(--shadow)', padding: '24px', transition: 'all 0.3s ease' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: stat.color, marginBottom: '4px' }}>{stat.value}</p>
            <p style={{ fontSize: '13px', color: 'var(--text-medium)', fontWeight: '600' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        {[
          { key: 'vendors', label: '🏪 Vendors' },
          { key: 'bookings', label: `📋 Booking Requests (${bookings.filter(b => b.status === 'pending').length})` },
          { key: 'usage', label: '📊 Usage Table' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="filter-chip"
            style={activeTab === tab.key ? { background: 'var(--secondary)', color: 'white', borderColor: 'var(--secondary)' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 1: VENDORS LIST                                   */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'vendors' && (
        <div>
          {/* Filters */}
          <div className="search-filter-bar" style={{ flexDirection: 'row', gap: '16px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="search-input"
              style={{ minWidth: '200px' }}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Vendors Table */}
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  {['Vendor', 'Category', 'City', 'Phone', 'Price Range', 'Rating', 'Section', 'Status', 'Bookings', 'Actions'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-light)' }}>
                      No vendors found
                    </td>
                  </tr>
                ) : filteredVendors.map((vendor) => {
                  const vendorBookingCount = bookings.filter(b => b.vendorId === vendor.id).length
                  const section = sections.find(s => s.id === vendor.sectionId)
                  return (
                    <tr key={vendor.id}>
                      <td style={{ fontWeight: '600' }}>{vendor.name}</td>
                      <td>
                        <span style={{ background: 'var(--secondary-shimmer)', color: 'var(--secondary-dark)', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                          {vendor.category}
                        </span>
                      </td>
                      <td>{vendor.city}</td>
                      <td>{vendor.phone}</td>
                      <td>{vendor.priceRange}</td>
                      <td>
                        ⭐ {vendor.rating}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                        {section?.name || vendor.sectionId || '—'}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleAvailability(vendor)}
                          className={`status-badge ${vendor.isAvailable ? 'active' : 'inactive'}`}
                        >
                          {vendor.isAvailable ? '✅ Available' : '❌ Busy'}
                        </button>
                      </td>
                      <td>
                        <span style={{ background: 'var(--surface-grey)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                          {vendorBookingCount}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(vendor)}
                            className="action-btn view"
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(vendor.id, vendor.name)}
                            disabled={deleting === vendor.id}
                            className="action-btn danger"
                            style={{ fontSize: '12px', padding: '6px 12px', opacity: deleting === vendor.id ? 0.5 : 1 }}
                          >
                            {deleting === vendor.id ? '...' : '🗑️'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 2: BOOKING REQUESTS                               */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'bookings' && (
        <div>
          {/* Status filter */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { key: 'all', color: 'var(--text-dark)' },
              { key: 'pending', color: 'var(--warning)' },
              { key: 'approved', color: 'var(--success)' },
              { key: 'rejected', color: 'var(--error)' }
            ].map(({ key: s, color }) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="filter-chip"
                style={filterStatus === s ? { background: color, color: 'white', borderColor: color } : { textAlign: 'center' }}
              >
                <p style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                  {s === 'all' ? bookings.length : bookings.filter(b => b.status === s).length}
                </p>
                <p style={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>{s}</p>
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-light)' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>📭</p>
              <p>No {filterStatus} bookings</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredBookings.map((booking) => (
                <div key={booking.id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 8px var(--shadow)', border: '1px solid var(--border)', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontWeight: '700', fontSize: '18px', color: 'var(--text-dark)' }}>{booking.vendorName}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-medium)' }}>{booking.vendorCategory}</p>
                    </div>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px', fontSize: '13px' }}>
                    <div style={{ background: 'var(--surface-grey)', borderRadius: 'var(--radius)', padding: '12px' }}>
                      <p style={{ color: 'var(--text-light)', fontSize: '11px', marginBottom: '4px' }}>👤 User</p>
                      <p style={{ fontWeight: '600' }}>{booking.userName || 'N/A'}</p>
                      <p style={{ color: 'var(--text-medium)' }}>{booking.userPhone || 'N/A'}</p>
                    </div>
                    <div style={{ background: 'var(--surface-grey)', borderRadius: 'var(--radius)', padding: '12px' }}>
                      <p style={{ color: 'var(--text-light)', fontSize: '11px', marginBottom: '4px' }}>🎉 Event</p>
                      <p style={{ fontWeight: '600' }}>{booking.eventName || 'N/A'}</p>
                      <p style={{ color: 'var(--text-medium)', fontSize: '11px' }}>{booking.eventId}</p>
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-grey)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px' }}>💬 Message</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{booking.message || '—'}</p>
                  </div>

                  {booking.status === 'pending' && (
                    <>
                      <textarea
                        placeholder="Add admin note (optional)..."
                        rows={2}
                        value={adminNote[booking.id] || ''}
                        onChange={(e) => setAdminNote(prev => ({ ...prev, [booking.id]: e.target.value }))}
                        className="search-input"
                        style={{ width: '100%', marginBottom: '12px', resize: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          disabled={processing === booking.id}
                          onClick={() => updateBookingStatus(booking.id, booking.eventId, 'approved')}
                          className="action-btn success"
                          style={{ flex: 1, opacity: processing === booking.id ? 0.5 : 1 }}
                        >
                          {processing === booking.id ? '...' : '✅ Approve'}
                        </button>
                        <button
                          disabled={processing === booking.id}
                          onClick={() => updateBookingStatus(booking.id, booking.eventId, 'rejected')}
                          className="action-btn danger"
                          style={{ flex: 1, opacity: processing === booking.id ? 0.5 : 1 }}
                        >
                          {processing === booking.id ? '...' : '❌ Reject'}
                        </button>
                      </div>
                    </>
                  )}

                  {booking.adminNote && booking.status !== 'pending' && (
                    <div style={{ background: 'var(--surface-grey)', borderRadius: 'var(--radius)', padding: '12px', marginTop: '12px' }}>
                      <p style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px' }}>📝 Admin Note</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{booking.adminNote}</p>
                    </div>
                  )}

                  <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '12px' }}>
                    📅 {booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleString() : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 3: USAGE TABLE                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'usage' && (
        <div>
          <div className="data-table" style={{ marginBottom: '32px' }}>
            <table>
              <thead>
                <tr>
                  {['Vendor', 'Category', 'Total Bookings', 'Pending', 'Approved', 'Rejected', 'Availability'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendorUsage.map((vendor) => (
                  <tr key={vendor.id}>
                    <td style={{ fontWeight: '600' }}>{vendor.name}</td>
                    <td>
                      <span style={{ background: 'var(--secondary-shimmer)', color: 'var(--secondary-dark)', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{vendor.category}</span>
                    </td>
                    <td>
                      <span style={{ background: 'var(--surface-grey)', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>{vendor.totalBookings}</span>
                    </td>
                    <td>
                      <span className="status-badge pending" style={{ fontSize: '10px', padding: '4px 10px' }}>{vendor.pendingCount}</span>
                    </td>
                    <td>
                      <span className="status-badge confirmed" style={{ fontSize: '10px', padding: '4px 10px' }}>{vendor.approvedCount}</span>
                    </td>
                    <td>
                      <span className="status-badge declined" style={{ fontSize: '10px', padding: '4px 10px' }}>{vendor.rejectedCount}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${vendor.isAvailable ? 'active' : 'inactive'}`}>
                        {vendor.isAvailable ? '✅ Available' : '❌ Busy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed booking rows per vendor */}
          <h3 className="page-header" style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '20px' }}>📋 All Bookings Detail</h1>
          </h3>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  {['Vendor', 'Category', 'User', 'Phone', 'Event', 'Message', 'Status', 'Date'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-light)' }}>No bookings yet</td>
                  </tr>
                ) : bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td style={{ fontWeight: '600' }}>{booking.vendorName}</td>
                    <td>
                      <span style={{ background: 'var(--secondary-shimmer)', color: 'var(--secondary-dark)', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{booking.vendorCategory}</span>
                    </td>
                    <td>{booking.userName}</td>
                    <td>{booking.userPhone}</td>
                    <td>{booking.eventName}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.message}</td>
                    <td>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                      {booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ADD / EDIT MODAL                                      */}
      {/* ══════════════════════════════════════════════════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-grey)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary)' }}>
                {editingVendor ? '✏️ Edit Vendor' : '➕ Add New Vendor'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-light)', fontSize: '32px', fontWeight: '300', cursor: 'pointer', background: 'none', border: 'none', transition: 'color 0.3s' }}
                onMouseOver={(e) => e.target.style.color = 'var(--text-dark)'}
                onMouseOut={(e) => e.target.style.color = 'var(--text-light)'}
              >×</button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>Vendor Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  className="search-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Royal Decorators"
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                  className="search-input"
                  style={{ width: '100%' }}
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* City + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>City *</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))}
                    className="search-input"
                    placeholder="e.g. Rajkot"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>Phone *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="search-input"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              {/* Price Range + Rating */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>Price Range</label>
                  <input
                    value={form.priceRange}
                    onChange={(e) => setForm(p => ({ ...p, priceRange: e.target.value }))}
                    className="search-input"
                    placeholder="e.g. ₹15,000 - ₹50,000"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>Rating (0-5)</label>
                  <input
                    type="number"
                    min="0" max="5" step="0.1"
                    value={form.rating}
                    onChange={(e) => setForm(p => ({ ...p, rating: e.target.value }))}
                    className="search-input"
                  />
                </div>
              </div>

              {/* Section */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>Link to Section</label>
                <select
                  value={form.sectionId}
                  onChange={(e) => setForm(p => ({ ...p, sectionId: e.target.value }))}
                  className="search-input"
                  style={{ width: '100%' }}
                >
                  <option value="">— No Section —</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  className="search-input"
                  style={{ width: '100%', resize: 'none' }}
                  placeholder="About this vendor..."
                />
              </div>

              {/* Availability toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>Available</label>
                <button
                  onClick={() => setForm(p => ({ ...p, isAvailable: !p.isAvailable }))}
                  style={{ width: '48px', height: '24px', borderRadius: '20px', background: form.isAvailable ? 'var(--success)' : 'var(--disabled)', transition: 'all 0.3s', border: 'none', cursor: 'pointer', position: 'relative' }}
                >
                  <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.3s', position: 'absolute', top: '2px', left: form.isAvailable ? '26px' : '2px' }} />
                </button>
                <span style={{ fontSize: '13px', color: 'var(--text-medium)' }}>{form.isAvailable ? 'Available' : 'Busy'}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '16px', background: 'var(--surface-grey)' }}>
              <button
                onClick={() => setShowModal(false)}
                className="action-btn"
                style={{ flex: 1, background: 'var(--surface)', color: 'var(--text-dark)', border: '2px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="action-btn primary"
                style={{ flex: 1, opacity: saving ? 0.5 : 1 }}
              >
                {saving ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Add Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}