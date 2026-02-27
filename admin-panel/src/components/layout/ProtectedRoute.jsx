import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import Loader from '../common/Loader'

export default function ProtectedRoute({ children }) {
  const { userData, loading } = useAuthContext()

  if (loading) return <Loader />
  if (!userData || userData.role !== 'admin') return <Navigate to="/login" />

  return children
}