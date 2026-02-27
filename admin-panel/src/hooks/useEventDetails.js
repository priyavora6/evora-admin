import { useState, useEffect } from 'react'
import { getGuests } from '../services/guestService'
import { getTasks } from '../services/taskService'
import { getBudget } from '../services/budgetService'
import { getVendors } from '../services/venderService'
import { getTickets } from '../services/ticketService'
import { getMedia } from '../services/mediaService'
import { getSections } from '../services/sectionService'

export function useEventDetails(eventId) {
  const [guests, setGuests] = useState([])
  const [tasks, setTasks] = useState([])
  const [budget, setBudget] = useState([])
  const [vendors, setVendors] = useState([])
  const [tickets, setTickets] = useState([])
  const [media, setMedia] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return

    const unsubs = []
    unsubs.push(getGuests(eventId, setGuests))
    unsubs.push(getTasks(eventId, setTasks))
    unsubs.push(getBudget(eventId, setBudget))
    unsubs.push(getVendors(eventId, setVendors))
    unsubs.push(getTickets(eventId, setTickets))
    unsubs.push(getMedia(eventId, setMedia))
    unsubs.push(getSections(eventId, setSections))

    setLoading(false)

    return () => unsubs.forEach(u => u && u())
  }, [eventId])

  return { guests, tasks, budget, vendors, tickets, media, sections, loading }
}