import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store'

export default function SellerRoute() {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'seller' && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
