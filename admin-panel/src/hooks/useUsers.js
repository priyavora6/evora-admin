import { useState, useEffect } from 'react'
import { streamAllUsers } from '../services/userService'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = streamAllUsers((data) => {
      setUsers(data)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { users, loading }
}