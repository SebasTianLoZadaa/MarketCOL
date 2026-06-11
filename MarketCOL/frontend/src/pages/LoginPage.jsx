/**
 * ============================================
 * LOGIN PAGE - MarketCOL (Rediseño)
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [tieneCarrito, setTieneCarrito] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    const carritoLocal = JSON.parse(localStorage.getItem('carrito_local') || '[]');
    setTieneCarrito(carritoLocal.length > 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      const rol = res.data.usuario.rol;
      if (rol === 'cliente') navigate('/catalogo');
      else navigate('/admin');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      background: 'var(--gray-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        display: 'flex', maxWidth: 860, width: '100%',
        borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
      }}>
        {/* Panel izquierdo */}
        <div style={{
          flex: 1, background: 'var(--carbon)',
          padding: '48px 40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          minWidth: 0,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 22, color: 'white', marginBottom: 4,
            }}>MarketCOL</div>
            <div style={{
              fontSize: 11, color: '#6B7280',
              letterSpacing: '1px', textTransform: 'uppercase',
            }}>MerkaCiro</div>
          </div>

          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 'clamp(24px, 3vw, 34px)', color: 'white',
              marginBottom: 16, lineHeight: 1.2,
            }}>
              Tu mercado de<br />
              barrio, <span style={{ color: 'var(--red)' }}>siempre<br />listo</span> para ti.
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: 15, lineHeight: 1.7 }}>
              Haz tu pedido desde casa y recógelo en tienda.
              Sin filas, sin esperas.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['🥛 Lácteos', '🌾 Granos', '🧴 Aseo'].map(t => (
              <div key={t} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 100, padding: '5px 14px',
                fontSize: 12, color: '#9CA3AF',
              }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Panel derecho */}
        <div style={{ flex: 1, background: 'white', padding: '48px 40px', minWidth: 0 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 24, color: 'var(--carbon)', marginBottom: 6,
          }}>
            Bienvenido de vuelta
          </h3>
          <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 28 }}>
            Ingresa a tu cuenta para continuar
          </p>

          {error && (
            <div className="mk-alert mk-alert-danger" style={{ marginBottom: 20 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          {tieneCarrito && (
            <div className="mk-alert mk-alert-success" style={{ marginBottom: 20 }}>
              🛒 Tu carrito se sincronizará al iniciar sesión
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mk-field">
              <label className="mk-label">Correo electrónico</label>
              <input
                className="mk-input"
                type="email" placeholder="tu@correo.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mk-field">
              <label className="mk-label">Contraseña</label>
              <input
                className="mk-input"
                type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="mk-btn mk-btn-primary mk-btn-w"
              style={{ padding: 13, fontSize: 15, marginBottom: 16 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="mk-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Iniciando sesión...
                </>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <div style={{ position: 'relative', textAlign: 'center', margin: '16px 0' }}>
            <hr className="mk-divider" />
            <span style={{
              position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
              background: 'white', padding: '0 12px', fontSize: 12, color: 'var(--gray)',
            }}>¿Nuevo aquí?</span>
          </div>

          <Link to="/register" className="mk-btn mk-btn-ghost mk-btn-w"
            style={{ textDecoration: 'none' }}>
            Crear cuenta gratis
          </Link>

          {/* Cuentas de prueba */}
          <div style={{
            marginTop: 24, background: 'var(--gray-light)',
            borderRadius: 'var(--radius)', padding: '12px 14px',
            border: '1px solid var(--gray-border)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--carbon)', marginBottom: 4 }}>
              Cuentas de prueba:
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)' }}>Admin: admin@ecommerce.com / admin1234</div>
            <div style={{ fontSize: 11, color: 'var(--gray)' }}>Cliente: cliente1@ecommerce.com / cliente1</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
