import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if email is verified for authenticated users
  if (currentUser && !currentUser.emailVerified) {
    // Allow access to email verification page
    if (location.pathname === '/verify-email') {
      return <>{children}</>;
    }
    // Redirect unverified users to verification page
    return <Navigate to="/verify-email" replace />;
  }

  if (requiredRole && userRole !== requiredRole && !(requiredRole === 'user' && userRole === 'admin')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 