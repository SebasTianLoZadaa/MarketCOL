/**
 * ============================================
 * COMPONENTE PRINCIPAL - MarketCOL
 * ============================================
 * Configuración de rutas y contexto global
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Páginas públicas (están en pages/)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CatalogoPage from './pages/CatalogoPage';
import ProductoDetallePage from './pages/ProductoDetallePage';
import CarritoPage from './pages/CarritoPage';
import CheckoutPage from './pages/CheckoutPage';
import PedidoConfirmadoPage from './pages/PedidoConfirmadoPage';

// Páginas de administración (están en pages/)
import AdminDashboardPage from './pages/AdminDashboardPage'; // ← usar este
import AdminCategoriasPage from './pages/AdminCategoriasPage';
import AdminSubcategoriasPage from './pages/AdminSubcategoriasPage';
import AdminProductosPage from './pages/AdminProductosPage';
import AdminUsuariosPage from './pages/AdminUsuariosPage';
import AdminPedidosPage from './pages/AdminPedidosPage';

// Componentes específicos que están en components/admin/
import MisPedidosPage from './components/admin/pedidos/MisPedidosPage';
import PedidoDetail from './components/admin/pedidos/pedidoDetail';
import ProveedorList from './components/admin/proveedores/proveedorList';

// Estilos
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          
          <main className="flex-grow-1">
            <Routes>
              {/* ========== RUTAS PÚBLICAS ========== */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/catalogo" element={<CatalogoPage />} />
              <Route path="/producto/:id" element={<ProductoDetallePage />} />
              <Route path="/carrito" element={<CarritoPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/pedido/:id" element={<PedidoDetail />} />
              <Route path="/pedido-confirmado/:id" element={<PedidoConfirmadoPage />} />
              <Route path="/mis-pedidos" element={<MisPedidosPage />} />
              
              {/* ========== RUTAS DE ADMINISTRACIÓN (PROTEGIDAS) ========== */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/categorias" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminCategoriasPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/subcategorias" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminSubcategoriasPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/productos" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminProductosPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/usuarios" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminUsuariosPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/pedidos" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPedidosPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/proveedores" element={
                <ProtectedRoute requireAdmin={true}>
                  <ProveedorList />
                </ProtectedRoute>
              } />
              
              {/* Ruta por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;