import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEvent } from '../../services/eventService'
import { getUserById } from '../../services/userService'
import { useEventDetails } from '../../hooks/useEventDetails'
import EventOverview from '../../components/event-detail/EventOverview'
import GuestList from '../../components/event-detail/GuestList'
import TaskList from '../../components/event-detail/TaskList'
import BudgetSummary from '../../components/event-detail/BudgetSummary'
import VendorList from '../../components/event-detail/VendorList'
import TicketList from '../../components/event-detail/TicketList'
import MediaGrid from '../../components/event-detail/MediaGrid'
import SectionList from '../../components/event-detail/SectionList'
import StatusBadge from '../../components/common/StatusBadge'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import '../../styles/cards.css'

export default function EventDetailPage() {
  const { eventId } = useParams()
  const nav = useNavigate()
  const [event, setEvent] = useState(null)
  const [creator, setCreator] = useState(null)
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  const { guests, tasks, budget, vendors, tickets, media, sections } = useEventDetails(eventId)

  useEffect(() => {
    const load = async () => {
      const e = await getEvent(eventId)
      setEvent(e)
      if (e && e.userId) {
        const u = await getUserById(e.userId)
        setCreator(u)
      }
      setLoading(false)
    }
    load()
  }, [eventId])

  if (loading) return <Loader />
  if (!event) return <EmptyState emoji="❌" title="Event not found" subtitle="This event does not exist" />

  const eventTitle = event.title || event.eventName || 'Event'
  const eventTypeLabel = event.eventType || event.eventTypeName || '-'
  const statusLabel = event.status
    ? (event.status === 'active' ? 'upcoming' : event.status)
    : (event.isPublic ? 'confirmed' : 'completed')

  const tabs = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'guests', label: `👥 Guests (${guests.length})` },
    { id: 'tasks', label: `✅ Tasks (${tasks.length})` },
    { id: 'budget', label: `💰 Budget (${budget.length})` },
    { id: 'vendors', label: `🏪 Vendors (${vendors.length})` },
    { id: 'tickets', label: `🎫 Tickets (${tickets.length})` },
    { id: 'media', label: `📸 Media (${media.length})` },
    { id: 'sections', label: `🧩 Sections (${sections.length})` },
  ]

  const renderTab = () => {
    switch (tab) {
      case 'overview': return <EventOverview event={event} />
      case 'guests': return <GuestList guests={guests} />
      case 'tasks': return <TaskList tasks={tasks} />
      case 'budget': return <BudgetSummary budget={budget} />
      case 'vendors': return <VendorList vendors={vendors} />
      case 'tickets': return <TicketList tickets={tickets} />
      case 'media': return <MediaGrid media={media} />
      case 'sections': return <SectionList sections={sections} />
      default: return <EventOverview event={event} />
    }
  }

  return (
    <div className="detail-page">
      <button onClick={() => nav('/events')} style={{
        background: 'none', color: 'var(--primary)', fontWeight: 600,
        fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4
      }}>
        ← Back to Events
      </button>

      <div className="detail-header">
        <div className="detail-emoji" style={{ background: '#EDE7F6' }}>
          {event.emoji || '🎉'}
        </div>
        <div className="detail-info" style={{ flex: 1 }}>
          <h1>{eventTitle}</h1>
          <p>
            {eventTypeLabel} • {event.location}
            {creator && (
              <span> • Created by{' '}
                <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => nav(`/users/${event.userId}`)}>
                  {creator.name}
                </span>
              </span>
            )}
          </p>
        </div>
        <StatusBadge status={statusLabel} />
      </div>

      <div className="detail-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`detail-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="detail-content">
        {renderTab()}
      </div>
    </div>
  )
}