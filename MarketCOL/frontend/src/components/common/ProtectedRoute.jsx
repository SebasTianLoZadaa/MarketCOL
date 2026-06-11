/**
 * ============================================
 * PROTECTED ROUTE COMPONENT
 * ============================================
 * Protege rutas que requieren autenticación.
 * Redirige a /login si el usuario no está autenticado.
 * Opcionalmente restringe por rol (admin/auxiliar).
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, isAdmin, isAuxiliar } = useAuth();

  // Mientras carga el estado de autenticación
  if (loading) {
    return <LoadingSpinner message="Verificando acceso..." />;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta requiere rol de administrador (admin o auxiliar)
  if (requireAdmin && !isAdmin && !isAuxiliar) {
    return <Navigate to="/" replace />;
  }

  // Usuario autenticado y con permisos suficientes
  return children;
};

export default ProtectedRoute;