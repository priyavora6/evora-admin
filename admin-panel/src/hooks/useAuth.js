import { useState } from 'react'
import { loginAdmin, logoutAdmin } from '../services/authService'
import { useAuthContext } from '../context/AuthContext'

export function useAuth() {
  const { currentUser, userData, loading } = useAuthContext()
  const [error, setError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const login = async (email, password) => {
    setError('')
    setLoginLoading(true)
    try {
      await loginAdmin(email, password)
    } catch (err) {
      setError(err.message)
    }
    setLoginLoading(false)
  }

  const logout = async () => {
    await logoutAdmin()
  }

  return { currentUser, userData, loading, error, loginLoading, login, logout }
}