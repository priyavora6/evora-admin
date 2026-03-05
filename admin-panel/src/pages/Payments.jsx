import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { 
  Download, 
  Search, 
  RefreshCw, 
  Eye, 
  Trash2, 
  RotateCcw, 
  X, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  Banknote,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { notifyUser } from '../utils/notificationService'

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
})

const shortDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventsCache, setEventsCache] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
    refundedAmount: 0,
    totalTransactions: 0,
    methodBreakdown: {},
    typeBreakdown: {},
    avgTransactionValue: 0,
    successRate: 0
  })

  const ROWS_PER_PAGE = 10

  // Fetch event and user details
  const fetchEventDetails = async (payment, cachedEvents = {}) => {
    try {
      const paymentUserId = payment.userId?.trim()
      if (!paymentUserId) return { eventName: '-', eventTotal: 0, userName: '-' }

      if (cachedEvents[paymentUserId]) {
        return cachedEvents[paymentUserId]
      }

      // Fetch user name
      let userName = '-'
      try {
        const userDoc = await getDoc(doc(db, 'users', paymentUserId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          userName = userData.name || userData.displayName || userData.email || '-'
        }
      } catch (err) {
        console.error('Error fetching user details:', err)
      }

      if (payment.eventId) {
        try {
          const eventDoc = await getDoc(doc(db, 'userEvents', payment.eventId))
          if (eventDoc.exists()) {
            const data = eventDoc.data()
            const details = {
              eventName: data.eventName || '-',
              eventTotal: data.totalEstimatedCost || 0,
              userName
            }
            cachedEvents[paymentUserId] = details
            setEventsCache(cachedEvents)
            return details
          }
        } catch (err) {
          console.error('Error fetching by eventId:', err)
        }
      }

      const eventsSnapshot = await getDocs(collection(db, 'userEvents'))
      if (eventsSnapshot.empty) return { eventName: '-', eventTotal: 0, userName }

      const userEventDocs = eventsSnapshot.docs.filter(doc => {
        const eventUserId = doc.data().userId?.trim()
        return eventUserId === paymentUserId
      })

      if (userEventDocs.length === 0) {
        return { eventName: '-', eventTotal: 0, userName }
      }

      const sortedDocs = userEventDocs.sort((a, b) => {
        const timeA = a.data().createdAt?.seconds || 0
        const timeB = b.data().createdAt?.seconds || 0
        return timeB - timeA
      })

      const eventData = sortedDocs[0].data()
      const details = {
        eventName: eventData.eventName || '-',
        eventTotal: eventData.totalEstimatedCost || 0,
        userName
      }
      
      cachedEvents[paymentUserId] = details
      setEventsCache(cachedEvents)
      
      return details
    } catch (err) {
      console.error('Error fetching event details:', err)
      return { eventName: '-', eventTotal: 0, userName: '-' }
    }
  }

  // Calculate statistics
  const calculateStats = useCallback((paymentsList) => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let totalRevenue = 0
    let todayRevenue = 0
    let weekRevenue = 0
    let monthRevenue = 0
    let successCount = 0
    let pendingCount = 0
    let failedCount = 0
    let refundedCount = 0
    let refundedAmount = 0
    const methodBreakdown = {}
    const typeBreakdown = {}

    paymentsList.forEach(payment => {
      const amount = payment.amount || 0
      const status = (payment.status || '').toLowerCase()
      const method = payment.method || 'Unknown'
      const type = payment.type || 'event'
      const timestamp = payment.timestamp?.seconds 
        ? new Date(payment.timestamp.seconds * 1000)
        : null

      // Success: Only count fully paid transactions
      if ((status === 'success' || status === 'approved' || status === 'paid') && payment.isFullyPaid === true) {
        successCount++
        totalRevenue += amount

        if (timestamp) {
          if (timestamp >= todayStart) todayRevenue += amount
          if (timestamp >= weekStart) weekRevenue += amount
          if (timestamp >= monthStart) monthRevenue += amount
        }

        methodBreakdown[method] = (methodBreakdown[method] || 0) + amount
        typeBreakdown[type] = (typeBreakdown[type] || 0) + amount
      }
      // Pending: Count transactions with remaining balance
      else if (payment.remaining > 0) {
        pendingCount++
      } 
      // Failed
      else if (status === 'failed' || status === 'declined') {
        failedCount++
      } 
      // Refunded
      else if (status === 'refunded') {
        refundedCount++
        refundedAmount += amount
      }
    })

    setStats({
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      successCount,
      pendingCount,
      failedCount,
      refundedCount,
      refundedAmount,
      totalTransactions: paymentsList.length,
      methodBreakdown,
      typeBreakdown,
      avgTransactionValue: successCount > 0 ? totalRevenue / successCount : 0,
      successRate: paymentsList.length > 0 ? (successCount / paymentsList.length * 100) : 0
    })
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'payments'), orderBy('timestamp', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const paymentData = snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data()
        }))

        console.log('📦 Fetched payments:', paymentData.length, 'documents')

        const paymentWithDetails = await Promise.all(
          paymentData.map(async (payment) => {
            const { eventName, eventTotal, userName } = await fetchEventDetails(payment, eventsCache)
            const paidAmount = payment.amount || 0
            const remaining = Math.max(0, eventTotal - paidAmount)
            const isFullyPaid = paidAmount >= eventTotal && eventTotal > 0
            
            return { 
              ...payment, 
              eventName, 
              eventTotal,
              userName: payment.userName || userName,
              remaining,
              isFullyPaid
            }
          })
        )

        console.log('✅ Payments with details:', paymentWithDetails)
        setPayments(paymentWithDetails)
        calculateStats(paymentWithDetails)
        setLoading(false)
      },
      (error) => {
        console.error('❌ Error fetching payments:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [eventsCache, calculateStats])

  // Filter payments
  const filteredPayments = useMemo(() => {
    let result = payments

    // Apply status filter
    if (activeFilter !== 'all') {
      result = result.filter(p => {
        const status = (p.status || '').toLowerCase()
        
        // Success: Only fully paid transactions
        if (activeFilter === 'success') {
          return (status === 'success' || status === 'approved' || status === 'paid') && p.isFullyPaid === true
        }
        
        // Pending: Only transactions with remaining balance
        if (activeFilter === 'pending') {
          return p.remaining > 0 && (status === 'pending' || status !== 'refunded' && status !== 'failed' && status !== 'declined')
        }
        
        if (activeFilter === 'refunded') return status === 'refunded'
        if (activeFilter === 'failed') return status === 'failed' || status === 'declined'
        return true
      })
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        (p.userName || '').toLowerCase().includes(query) ||
        (p.transactionId || '').toLowerCase().includes(query) ||
        (p.eventName || '').toLowerCase().includes(query) ||
        (p.method || '').toLowerCase().includes(query) ||
        (p.userId || '').toLowerCase().includes(query)
      )
    }

    return result
  }, [payments, activeFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / ROWS_PER_PAGE)
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE
    return filteredPayments.slice(start, start + ROWS_PER_PAGE)
  }, [filteredPayments, currentPage])

  // Export to CSV
  const handleExport = () => {
    const headers = ['Transaction ID', 'User Name', 'User ID', 'Event Name', 'Amount', 'Method', 'Type', 'Status', 'Date']
    const rows = payments.map(p => {
      const timestamp = p.timestamp?.seconds 
        ? shortDateFormatter.format(new Date(p.timestamp.seconds * 1000))
        : 'N/A'
      return [
        p.transactionId || p.id,
        p.userName || '-',
        p.userId || '-',
        p.eventName || '-',
        p.amount || 0,
        p.method || '-',
        p.type || 'event',
        p.status || '-',
        timestamp
      ]
    })

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payments_${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Refund payment
  const handleRefund = async () => {
    if (!selectedPayment) return

    try {
      const paymentRef = doc(db, 'payments', selectedPayment.id)
      
      // Update payment status
      await updateDoc(paymentRef, {
        status: 'refunded',
        refundedAt: serverTimestamp(),
        refundReason: refundReason || 'No reason provided',
        refundedBy: 'admin'
      })

      // Update event's amountPaid if eventId exists
      if (selectedPayment.eventId) {
        const eventRef = doc(db, 'userEvents', selectedPayment.eventId)
        await updateDoc(eventRef, {
          amountPaid: increment(-(selectedPayment.amount || 0))
        })
      }

      // Create refund record
      await addDoc(collection(db, 'refundRequests'), {
        paymentId: selectedPayment.id,
        userId: selectedPayment.userId,
        amount: selectedPayment.amount,
        reason: refundReason,
        status: 'completed',
        processedAt: serverTimestamp(),
        processedBy: 'admin'
      })

      // Send notification to user
      if (selectedPayment.userId) {
        await notifyUser(
          selectedPayment.userId,
          'refund',
          'Refund Processed 💰',
          `Your payment of ₹${selectedPayment.amount} has been refunded.`
        )
      }

      setShowRefundModal(false)
      setRefundReason('')
      setSelectedPayment(null)
      alert('Refund processed successfully!')
    } catch (err) {
      console.error('Refund error:', err)
      alert('Failed to process refund')
    }
  }

  // Delete payment
  const handleDelete = async (payment) => {
    if (!window.confirm(`Delete transaction ${payment.transactionId || payment.id}? This cannot be undone.`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'payments', payment.id))
      alert('Payment deleted successfully')
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete payment')
    }
  }

  // Get method icon
  const getMethodIcon = (method) => {
    const m = (method || '').toLowerCase()
    if (m.includes('card') || m.includes('credit') || m.includes('debit')) return <CreditCard size={16} />
    if (m.includes('upi') || m.includes('gpay') || m.includes('phonepe')) return <Smartphone size={16} />
    if (m.includes('bank') || m.includes('net')) return <Building2 size={16} />
    if (m.includes('wallet')) return <Wallet size={16} />
    if (m.includes('cash')) return <Banknote size={16} />
    return <CreditCard size={16} />
  }

  // Get status styling
  const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'success' || s === 'approved' || s === 'paid') {
      return { bg: '#d4edda', color: '#155724', icon: <CheckCircle size={12} /> }
    }
    if (s === 'pending') {
      return { bg: '#fff3cd', color: '#856404', icon: <Clock size={12} /> }
    }
    if (s === 'refunded') {
      return { bg: '#cce5ff', color: '#004085', icon: <RotateCcw size={12} /> }
    }
    return { bg: '#f8d7da', color: '#721c24', icon: <XCircle size={12} /> }
  }

  // Format amount
  const formatAmount = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount.toFixed(0)}`
  }

  return (
    <div style={{ padding: '32px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.5px' }}>
              💳 Payment Dashboard
            </h1>
            <p style={{ margin: '8px 0 0', color: '#6c757d', fontSize: 15 }}>
              Real-time transaction monitoring • {payments.length} total transactions
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Live Indicator */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              padding: '8px 16px',
              backgroundColor: '#fff',
              borderRadius: 8,
              border: '2px solid #10b981',
              fontSize: 13,
              fontWeight: 600
            }}>
              <span style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#10b981',
                animation: 'pulse 2s infinite'
              }}></span>
              LIVE
            </div>

            {/* Export Button */}
            <button 
              onClick={handleExport}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '10px 18px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <Download size={16} /> Export
            </button>

            {/* Refresh Button */}
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                backgroundColor: '#fff',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: 500 }}>
          <Search 
            size={20} 
            style={{ 
              position: 'absolute', 
              left: 16, 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#9ca3af' 
            }} 
          />
          <input
            type="text"
            placeholder="Search by transaction ID, user name, event, or method..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              width: '100%',
              padding: '14px 48px 14px 48px',
              border: '2px solid #e5e7eb',
              borderRadius: 12,
              fontSize: 15,
              outline: 'none',
              backgroundColor: '#fff',
              transition: 'all 0.2s',
              fontWeight: 500
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#ef4444',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                color: 'white',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards - Redesigned for clarity */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 20,
        marginBottom: 32 
      }}>
        {/* Total Revenue */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: 16,
          padding: 24,
          color: 'white',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, fontSize: 120 }}>💰</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Wallet size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</span>
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: 36, fontWeight: 800, letterSpacing: '-1px' }}>
              {formatAmount(stats.totalRevenue)}
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 13 }}>From {stats.successCount} successful transactions</p>
          </div>
        </div>

        {/* Today's Revenue */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: 16,
          padding: 24,
          color: 'white',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, fontSize: 120 }}>📅</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Calendar size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</span>
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: 36, fontWeight: 800, letterSpacing: '-1px' }}>
              {formatAmount(stats.todayRevenue)}
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 13 }}>Latest transactions processing</p>
          </div>
        </div>

        {/* This Month */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          borderRadius: 16,
          padding: 24,
          color: 'white',
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, fontSize: 120 }}>📈</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TrendingUp size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>This Month</span>
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: 36, fontWeight: 800, letterSpacing: '-1px' }}>
              {formatAmount(stats.monthRevenue)}
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 13 }}>Monthly performance</p>
          </div>
        </div>

        {/* Success Rate */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: 16,
          padding: 24,
          color: 'white',
          boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, fontSize: 120 }}>✅</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CheckCircle size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Success Rate</span>
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: 36, fontWeight: 800, letterSpacing: '-1px' }}>
              {stats.successRate.toFixed(1)}%
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 13 }}>
              {stats.successCount} of {stats.totalTransactions} succeeded
            </p>
          </div>
        </div>

        {/* Pending */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '2px solid #fbbf24',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={20} color="#f59e0b" />
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#f59e0b' }}>Pending</span>
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 36, fontWeight: 800, letterSpacing: '-1px', color: '#1f2937' }}>
            {stats.pendingCount}
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>Awaiting confirmation</p>
        </div>

        {/* Refunds */}
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: 16,
          padding: 24,
          color: 'white',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, fontSize: 120 }}>↩️</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <RotateCcw size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Refunds</span>
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: 36, fontWeight: 800, letterSpacing: '-1px' }}>
              {formatAmount(stats.refundedAmount)}
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 13 }}>{stats.refundedCount} refunded transactions</p>
          </div>
        </div>
      </div>

      {/* Main Content - Transaction Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
      }}>
        {/* Filter Tabs - Button Style */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '16px 24px',
          borderBottom: '2px solid #f3f4f6',
          gap: 12,
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {[
            { key: 'all', label: 'All Payments', color: '#a0746d' },
            { key: 'success', label: 'Success', color: '#10b981' },
            { key: 'pending', label: 'Pending', color: '#f59e0b' },
            { key: 'refunded', label: 'Refunded', color: '#3b82f6' },
            { key: 'failed', label: 'Failed', color: '#ef4444' }
          ].map(filter => {
            const isActive = activeFilter === filter.key
            return (
              <button
                key={filter.key}
                onClick={() => {
                  setActiveFilter(filter.key)
                  setCurrentPage(1)
                }}
                style={{
                  padding: '8px 22px',
                  borderRadius: 12,
                  border: isActive ? 'none' : `2px solid ${filter.color}`,
                  backgroundColor: isActive ? filter.color : '#fff',
                  color: isActive ? '#fff' : filter.color,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                  minWidth: 'fit-content',
                  boxShadow: isActive ? `0 4px 12px ${filter.color}30` : 'none'
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = `${filter.color}08`
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = '#fff'
                  }
                }}
              >
                {filter.label}
              </button>
            )
          })}
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 13, flexShrink: 0 }}>
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Showing:</span>
            <span style={{ 
              backgroundColor: '#3b82f6', 
              color: 'white',
              padding: '5px 12px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 12,
              whiteSpace: 'nowrap'
            }}>
              {filteredPayments.length} {filteredPayments.length === 1 ? 'transaction' : 'transactions'}
            </span>
          </div>
        </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={thStyle}>Transaction</th>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Event</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Remaining</th>
                    <th style={thStyle}>Method</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '60px 40px' }}>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          gap: 16
                        }}>
                          <RefreshCw size={40} className="spin" style={{ color: '#3b82f6' }} />
                          <div>
                            <p style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: 16, fontWeight: 600 }}>
                              Loading Transactions...
                            </p>
                            <p style={{ margin: 0, color: '#9ca3af', fontSize: 13 }}>
                              Fetching real-time payment data
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '60px 40px' }}>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          gap: 16
                        }}>
                          <div style={{ fontSize: 64 }}>💳</div>
                          <div>
                            <p style={{ 
                              margin: '0 0 8px 0', 
                              color: '#1f2937', 
                              fontSize: 18, 
                              fontWeight: 700 
                            }}>
                              {searchQuery ? 'No matching transactions' : 'No transactions yet'}
                            </p>
                            <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>
                              {searchQuery 
                                ? `No results found for "${searchQuery}". Try a different search.`
                                : 'Transactions will appear here as users make payments.'
                              }
                            </p>
                          </div>
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              style={{
                                marginTop: 8,
                                padding: '10px 20px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: 14
                              }}
                            >
                              Clear Search
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((payment, index) => {
                      const statusStyle = getStatusStyle(payment.status)
                      const timestamp = payment.timestamp?.seconds
                        ? dateFormatter.format(new Date(payment.timestamp.seconds * 1000))
                        : 'N/A'

                      return (
                        <tr 
                          key={payment.id} 
                          style={{ 
                            backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f9ff'
                            e.currentTarget.style.transform = 'scale(1.005)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f9fafb'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937', marginBottom: 4 }}>
                              #{payment.transactionId || payment.id.slice(0, 12).toUpperCase()}
                            </div>
                            <div style={{ 
                              fontSize: 11, 
                              color: '#fff',
                              backgroundColor: '#6b7280',
                              padding: '2px 8px',
                              borderRadius: 4,
                              display: 'inline-block',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              letterSpacing: '0.3px'
                            }}>
                              {payment.type || 'event'}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937', marginBottom: 4 }}>
                              {payment.userName || 'Unknown User'}
                            </div>
                            <div style={{ 
                              fontSize: 11, 
                              color: '#9ca3af',
                              fontFamily: 'monospace'
                            }}>
                              ID: {payment.userId?.slice(0, 12) || '-'}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ 
                              fontWeight: 500,
                              color: '#374151',
                              maxWidth: 180,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {payment.eventName || '-'}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ 
                              fontWeight: 800, 
                              fontSize: 16,
                              color: '#10b981',
                              letterSpacing: '-0.5px'
                            }}>
                              ₹{(payment.amount || 0).toLocaleString('en-IN')}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            {payment.isFullyPaid ? (
                              <span style={{
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                ✓ Fully Paid
                              </span>
                            ) : payment.remaining > 0 ? (
                              <span style={{
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700
                              }}>
                                ₹{payment.remaining.toLocaleString('en-IN')} due
                              </span>
                            ) : (
                              <span style={{ color: '#9ca3af', fontWeight: 500 }}>-</span>
                            )}
                          </td>
                          <td style={tdStyle}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 8,
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#374151'
                            }}>
                              {getMethodIcon(payment.method)}
                              {payment.method || '-'}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                              padding: '6px 14px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px'
                            }}>
                              {statusStyle.icon}
                              {payment.status || 'unknown'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                              {timestamp}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPayment(payment)
                                  setShowModal(true)
                                }}
                                style={actionBtnStyle}
                                title="View Details"
                                onMouseOver={(e) => {
                                  e.target.style.backgroundColor = '#3b82f6'
                                  e.target.style.borderColor = '#3b82f6'
                                  e.target.style.color = '#fff'
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.backgroundColor = '#fff'
                                  e.target.style.borderColor = '#e5e7eb'
                                  e.target.style.color = '#6b7280'
                                }}
                              >
                                <Eye size={16} />
                              </button>
                              {(payment.status?.toLowerCase() === 'success' || 
                                payment.status?.toLowerCase() === 'approved' ||
                                payment.status?.toLowerCase() === 'paid') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedPayment(payment)
                                    setShowRefundModal(true)
                                  }}
                                  style={actionBtnStyle}
                                  title="Refund"
                                  onMouseOver={(e) => {
                                    e.target.style.backgroundColor = '#f59e0b'
                                    e.target.style.borderColor = '#f59e0b'
                                    e.target.style.color = '#fff'
                                  }}
                                  onMouseOut={(e) => {
                                    e.target.style.backgroundColor = '#fff'
                                    e.target.style.borderColor = '#e5e7eb'
                                    e.target.style.color = '#6b7280'
                                  }}
                                >
                                  <RotateCcw size={16} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(payment)
                                }}
                                style={actionBtnStyle}
                                title="Delete"
                                onMouseOver={(e) => {
                                  e.target.style.backgroundColor = '#ef4444'
                                  e.target.style.borderColor = '#ef4444'
                                  e.target.style.color = '#fff'
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.backgroundColor = '#fff'
                                  e.target.style.borderColor = '#e5e7eb'
                                  e.target.style.color = '#6b7280'
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination - Redesigned */}
            {filteredPayments.length > ROWS_PER_PAGE && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '20px 24px',
                borderTop: '2px solid #f3f4f6',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ 
                  color: '#374151', 
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  Showing <span style={{ color: '#3b82f6' }}>{(currentPage - 1) * ROWS_PER_PAGE + 1}</span> to{' '}
                  <span style={{ color: '#3b82f6' }}>{Math.min(currentPage * ROWS_PER_PAGE, filteredPayments.length)}</span> of{' '}
                  <span style={{ color: '#3b82f6' }}>{filteredPayments.length}</span> transactions
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      ...paginationBtnStyle,
                      opacity: currentPage === 1 ? 0.4 : 1,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      backgroundColor: currentPage === 1 ? '#f3f4f6' : '#fff'
                    }}
                    onMouseOver={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.backgroundColor = '#3b82f6'
                        e.target.style.borderColor = '#3b82f6'
                        e.target.style.color = '#fff'
                      }
                    }}
                    onMouseOut={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.backgroundColor = '#fff'
                        e.target.style.borderColor = '#e5e7eb'
                        e.target.style.color = '#374151'
                      }
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <div style={{ 
                    padding: '8px 20px', 
                    backgroundColor: '#3b82f6', 
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    minWidth: 120,
                    textAlign: 'center'
                  }}>
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      ...paginationBtnStyle,
                      opacity: currentPage === totalPages ? 0.4 : 1,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#fff'
                    }}
                    onMouseOver={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.backgroundColor = '#3b82f6'
                        e.target.style.borderColor = '#3b82f6'
                        e.target.style.color = '#fff'
                      }
                    }}
                    onMouseOut={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.backgroundColor = '#fff'
                        e.target.style.borderColor = '#e5e7eb'
                        e.target.style.color = '#374151'
                      }
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

      {/* View Details Modal */}
      {showModal && selectedPayment && (
        <div style={modalOverlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>Payment Details</h2>
              <button onClick={() => setShowModal(false)} style={closeButtonStyle}>
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                ...getStatusStyle(selectedPayment.status),
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                backgroundColor: getStatusStyle(selectedPayment.status).bg,
                color: getStatusStyle(selectedPayment.status).color
              }}>
                {getStatusStyle(selectedPayment.status).icon}
                {selectedPayment.status}
              </div>
              <h1 style={{ margin: '16px 0 0', fontSize: 36 }}>₹{selectedPayment.amount || 0}</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
              <DetailRow label="Transaction ID" value={selectedPayment.transactionId || selectedPayment.id} />
              <DetailRow label="User" value={selectedPayment.userName || '-'} />
              <DetailRow label="Event" value={selectedPayment.eventName || '-'} />
              <DetailRow label="Method" value={selectedPayment.method || '-'} />
              <DetailRow label="Type" value={(selectedPayment.type || 'event').toUpperCase()} />
              <DetailRow 
                label="Date" 
                value={selectedPayment.timestamp?.seconds 
                  ? dateFormatter.format(new Date(selectedPayment.timestamp.seconds * 1000))
                  : 'N/A'
                } 
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {(selectedPayment.status?.toLowerCase() === 'success' ||
                selectedPayment.status?.toLowerCase() === 'approved' ||
                selectedPayment.status?.toLowerCase() === 'paid') && (
                <button
                  onClick={() => {
                    setShowModal(false)
                    setShowRefundModal(true)
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid #fd7e14',
                    backgroundColor: 'transparent',
                    color: '#fd7e14',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <RotateCcw size={16} /> Refund
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div style={modalOverlayStyle} onClick={() => setShowRefundModal(false)}>
          <div style={{ ...modalContentStyle, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px' }}>Confirm Refund</h2>
            <p style={{ margin: '0 0 16px', color: '#6c757d' }}>
              Refund ₹{selectedPayment.amount} to {selectedPayment.userName}?
            </p>
            <textarea
              placeholder="Reason for refund (optional)"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                resize: 'vertical',
                minHeight: 80,
                marginBottom: 20,
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowRefundModal(false)
                  setRefundReason('')
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: 'transparent',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  backgroundColor: '#fd7e14',
                  color: 'white',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

// Helper Components
function DetailRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  )
}

// Styles - Redesigned for better clarity
const thStyle = {
  textAlign: 'left',
  padding: '16px 20px',
  fontWeight: 700,
  fontSize: 12,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  backgroundColor: '#f9fafb',
  borderBottom: '2px solid #e5e7eb'
}

const tdStyle = {
  padding: '20px',
  fontSize: 14,
  borderBottom: '1px solid #f3f4f6',
  color: '#374151'
}

const actionBtnStyle = {
  padding: 8,
  border: '2px solid #e5e7eb',
  backgroundColor: '#fff',
  borderRadius: 8,
  cursor: 'pointer',
  color: '#6b7280',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const paginationBtnStyle = {
  padding: '10px 12px',
  border: '2px solid #e5e7eb',
  backgroundColor: '#fff',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#374151',
  fontWeight: 600,
  transition: 'all 0.2s'
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}

const modalContentStyle = {
  backgroundColor: 'white',
  borderRadius: 16,
  padding: 24,
  maxWidth: 500,
  width: '90%',
  maxHeight: '90vh',
  overflow: 'auto'
}

const closeButtonStyle = {
  padding: 8,
  border: 'none',
  backgroundColor: '#f0f0f0',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex'
}