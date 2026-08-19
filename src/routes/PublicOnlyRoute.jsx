import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    // If user is already authenticated, redirect to the previous page or dashboard
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children ? children : <Outlet />;
}
