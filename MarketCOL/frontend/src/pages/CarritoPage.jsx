/**
 * ============================================
 * CARRITO PAGE - MarketCOL (Rediseño)
 * ============================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import carritoService from '../services/carritoService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const CarritoPage = () => {
  const [carrito, setCarrito]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [mensaje, setMensaje]   = useState({ tipo: '', texto: '' });
  const { isAuthenticated }     = useAuth();
  const navigate                = useNavigate();

  const showMsg = (tipo, texto, ms = 2500) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), ms);
  };

  useEffect(() => { loadCarrito(); }, []);

  const loadCarrito = async () => {
    setLoading(true);
    try {
      const res = await carritoService.getCarrito();
      setCarrito(res.data || res.carrito);
    } catch {
      showMsg('danger', 'Error al cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  const handleCantidad = async (itemId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    try {
      await carritoService.actualizarItem(itemId, nuevaCantidad);
      await loadCarrito();
    } catch (err) {
      showMsg('danger', err.message || 'Error al actualizar cantidad');
    }
  };

  const handleEliminar = async (itemId) => {
    if (!window.confirm('¿Eliminar este producto del carrito?')) return;
    try {
      await carritoService.eliminarItem(itemId);
      await loadCarrito();
      showMsg('success', 'Producto eliminado');
    } catch (err) {
      showMsg('danger', err.message || 'Error al eliminar producto');
    }
  };

  const handleVaciar = async () => {
    if (!window.confirm('¿Vaciar todo el carrito?')) return;
    try {
      await carritoService.vaciarCarrito();
      await loadCarrito();
      showMsg('success', 'Carrito vaciado');
    } catch (err) {
      showMsg('danger', err.message || 'Error al vaciar carrito');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      showMsg('warning', 'Debes iniciar sesión para finalizar tu pedido');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    navigate('/checkout');
  };

  const fmt = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

  if (loading) return <LoadingSpinner message="Cargando carrito..." />;

  const items = carrito?.items || [];
  const total = parseFloat(carrito?.resumen?.total || carrito?.total || 0);

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '36px 24px' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26,
        color: 'var(--carbon)', marginBottom: 24,
      }}>
        Mi carrito{' '}
        <span style={{ color: 'var(--gray)', fontSize: 18, fontFamily: 'var(--font-body)', fontWeight: 400 }}>
          ({items.length} {items.length === 1 ? 'producto' : 'productos'})
        </span>
      </h1>

      {!isAuthenticated && (
        <div className="mk-alert mk-alert-info" style={{ marginBottom: 20 }}>
          ℹ️ Puedes agregar productos sin sesión. Al pedir, deberás ingresar o crear una cuenta.
        </div>
      )}

      {mensaje.texto && (
        <div className={`mk-alert mk-alert-${mensaje.tipo}`} style={{ marginBottom: 20 }}>
          {mensaje.texto}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mk-card" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--carbon)', marginBottom: 8 }}>
            Tu carrito está vacío
          </h3>
          <p style={{ color: 'var(--gray)', marginBottom: 24 }}>
            Agrega productos para comenzar tu compra
          </p>
          <button className="mk-btn mk-btn-primary" onClick={() => navigate('/catalogo')}>
            Ir al Catálogo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Lista de items */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Encabezado */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 14, padding: '0 4px',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--carbon)' }}>
                Productos en tu carrito
              </span>
              <button className="mk-btn mk-btn-danger-soft mk-btn-sm" onClick={handleVaciar}>
                Vaciar carrito
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(item => (
                <div key={item.id} className="mk-card fade-up"
                  style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Imagen */}
                  <div style={{
                    width: 64, height: 64, background: 'var(--gray-light)',
                    borderRadius: 'var(--radius)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
                  }}>
                    <img
                      src={item.producto?.imagen || item.imagen || '/images/producto-default.svg'}
                      alt={item.producto?.nombre || item.nombre}
                      style={{ maxWidth: 54, maxHeight: 54, objectFit: 'contain' }}
                      onError={e => { e.target.src = '/images/producto-default.svg'; }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--carbon)', marginBottom: 2 }}>
                      {item.producto?.nombre || item.nombre}
                    </div>
                    {item.producto?.categoria && (
                      <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                        {item.producto.categoria.nombre}
                      </div>
                    )}
                    <div style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700,
                      color: 'var(--red)', fontSize: 15, marginTop: 2,
                    }}>
                      {fmt(item.precioUnitario || item.precio)}
                    </div>
                  </div>

                  {/* Qty */}
                  <div className="mk-qty">
                    <button className="mk-qty-btn"
                      onClick={() => handleCantidad(item.id, item.cantidad - 1)}>−</button>
                    <span className="mk-qty-val">{item.cantidad}</span>
                    <button className="mk-qty-btn" style={{ color: 'var(--red)' }}
                      onClick={() => handleCantidad(item.id, item.cantidad + 1)}>+</button>
                  </div>

                  {/* Subtotal */}
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 16, color: 'var(--carbon)', minWidth: 90, textAlign: 'right',
                  }}>
                    {fmt((item.precioUnitario || item.precio) * item.cantidad)}
                  </div>

                  {/* Eliminar */}
                  <button
                    onClick={() => handleEliminar(item.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--gray)', fontSize: 18, padding: '4px 6px',
                      borderRadius: 'var(--radius-sm)', transition: 'color 0.15s',
                    }}
                    title="Eliminar"
                  >×</button>
                </div>
              ))}
            </div>

            <button className="mk-btn mk-btn-ghost" style={{ marginTop: 20 }}
              onClick={() => navigate('/catalogo')}>
              ← Seguir comprando
            </button>
          </div>

          {/* Resumen */}
          <div style={{ width: 280, flexShrink: 0 }}>
            <div className="mk-card" style={{ padding: 24, position: 'sticky', top: 80 }}>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 18, color: 'var(--carbon)', marginBottom: 20,
              }}>
                Resumen del pedido
              </h3>

              {items.map(i => (
                <div key={i.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: 10, fontSize: 13,
                }}>
                  <span style={{ color: 'var(--gray)' }}>
                    {(i.producto?.nombre || i.nombre || '').substring(0, 20)}{(i.producto?.nombre || i.nombre || '').length > 20 ? '…' : ''} ×{i.cantidad}
                  </span>
                  <span style={{ fontWeight: 500, color: 'var(--carbon)' }}>
                    {fmt((i.precioUnitario || i.precio) * i.cantidad)}
                  </span>
                </div>
              ))}

              <hr className="mk-divider" style={{ margin: '16px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--gray)' }}>Modalidad:</span>
                <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>
                  🏪 Aliste y recoja
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 12 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--red)' }}>
                  {fmt(total)}
                </span>
              </div>

              <button className="mk-btn mk-btn-primary mk-btn-w" style={{ padding: 13, fontSize: 15 }}
                onClick={handleCheckout}>
                {isAuthenticated ? 'Finalizar pedido' : 'Iniciar sesión para pedir'}
              </button>

              <div style={{
                marginTop: 14, background: 'var(--gray-light)', borderRadius: 'var(--radius)',
                padding: '11px 13px', fontSize: 12, color: 'var(--gray)',
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <span>📱</span>
                <span>Coordina tu pago por WhatsApp al confirmar el pedido.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarritoPage;
