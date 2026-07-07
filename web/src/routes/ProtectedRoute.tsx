import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { FullPageSpinner } from '@/components/ui/Spinner';
import type { Role } from '@/types';

/** Gate that requires authentication and (optionally) a set of roles. */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <FullPageSpinner label="Restoring your session…" />;
  }
  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <Outlet />;
}

/** Inverse gate: redirects authenticated users away from login/landing auth pages. */
export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status);
  if (status === 'authenticated') return <Navigate to="/app/dashboard" replace />;
  return <Outlet />;
}
