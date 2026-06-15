/**
 * ============================================
 * HOME PAGE - MarketCOL (Rediseño)
 * ============================================
 */

import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import catalogoService from '../services/catalogoService';
import ProductCard from '../components/catalogo/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '🏪', text: 'Recoge en tienda' },
  { icon: '📱', text: 'Pago por WhatsApp' },
  { icon: '🌿', text: 'Productos frescos' },
  { icon: '⚡', text: 'Pedido listo en minutos' },
];

const STATS = [
  { label: 'Productos disponibles', value: '75+', icon: '📦' },
  { label: 'Pedidos diarios',       value: '50+',  icon: '🛒' },
  { label: 'Satisfacción',          value: '98%',  icon: '⭐' },
];

const HomePage = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const { isAuthenticated }       = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const res = await catalogoService.getProductosDestacados();
        setProductos(res.data.productos.slice(0, 5));
      } catch (err) {
        console.error('Error al cargar productos:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      {/* ── Hero ── */}
      <section className="mk-hero" style={{ padding: '64px 0' }}>
        <div className="mk-hero-accent" />
        <Container>
          <div style={{ display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Copy */}
            <div style={{ flex: 1, minWidth: 280 }} className="fade-up">
              <div className="mk-badge mk-badge-red" style={{ marginBottom: 20 }}>
                <div style={{
                  width: 6, height: 6, background: 'var(--red)',
                  borderRadius: '50%', animation: 'pulseRed 2s infinite',
                }} />
                Hoy no fio, mañana si.
              </div>

              <h1 style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: 'clamp(36px, 5vw, 56px)',
                color: 'white', lineHeight: 1.05, marginBottom: 20,
              }}>
                Tu mercado<br />
                <span style={{ color: 'var(--red)' }}>de barrio,</span><br />
                en línea.
              </h1>

              <p style={{ color: '#9CA3AF', fontSize: 17, lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
                Selecciona tus productos, haz tu pedido y recógelo en MerkaCiro.
                Sin filas, sin esperas.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/catalogo" className="mk-btn mk-btn-primary mk-btn-lg"
                  style={{ textDecoration: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" fill="white"/>
                    <rect x="14" y="3" width="7" height="7" rx="1.5" fill="white"/>
                    <rect x="3" y="14" width="7" height="7" rx="1.5" fill="white"/>
                    <rect x="14" y="14" width="7" height="7" rx="1.5" fill="white"/>
                  </svg>
                  Ver Catálogo
                </Link>

                {isAuthenticated ? (
                  <Link to="/carrito" className="mk-btn mk-btn-lg"
                    style={{
                      background: 'rgba(255,255,255,0.08)', color: 'white',
                      border: '1.5px solid rgba(255,255,255,0.15)', textDecoration: 'none',
                    }}>
                    Mi Carrito
                  </Link>
                ) : (
                  <Link to="/register" className="mk-btn mk-btn-lg"
                    style={{
                      background: 'rgba(255,255,255,0.08)', color: 'white',
                      border: '1.5px solid rgba(255,255,255,0.15)', textDecoration: 'none',
                    }}>
                    Crear cuenta gratis
                  </Link>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fade-up fade-up-d2">
              {STATS.map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-md)', padding: '16px 24px',
                  display: 'flex', alignItems: 'center', gap: 16, minWidth: 220,
                }}>
                  <span style={{ fontSize: 28 }}>{s.icon}</span>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 24, color: 'white',
                    }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Feature strip ── */}
      <div className="mk-feature-strip">
        <Container>
          <div style={{
            display: 'flex', justifyContent: 'space-around',
            flexWrap: 'wrap', gap: 12,
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* ── Productos destacados ── */}
      <Container style={{ padding: '60px 15px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div className="mk-section-label">Selección del día</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 32, color: 'var(--carbon)', margin: 0,
            }}>
              Productos destacados
            </h2>
          </div>
          <Link to="/catalogo" className="mk-btn mk-btn-outline" style={{ textDecoration: 'none' }}>
            Ver todos →
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Cargando productos..." />
        ) : productos.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20,
          }}>
            {productos.map((p, i) => (
              <div key={p.id} className={`fade-up fade-up-d${Math.min(i + 1, 4)}`}>
                <ProductCard producto={p} showActions={true} />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--gray)' }}>
            No hay productos disponibles en este momento.
          </p>
        )}

        {/* CTA para no autenticados */}
        {!isAuthenticated && (
          <div style={{
            marginTop: 60, background: 'white',
            borderRadius: 'var(--radius-xl)', border: '1px solid var(--gray-border)',
            padding: '48px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🛒</div>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 26, color: 'var(--carbon)', marginBottom: 10,
            }}>
              ¿Listo para hacer tu pedido?
            </h3>
            <p style={{ color: 'var(--gray)', fontSize: 16, marginBottom: 24 }}>
              Regístrate gratis y empieza a comprar en MerkaCiro hoy.
            </p>
            <Link to="/register" className="mk-btn mk-btn-primary mk-btn-lg"
              style={{ textDecoration: 'none' }}>
              Crear cuenta gratis — es gratis
            </Link>
          </div>
        )}
      </Container>
    </>
  );
};

export default HomePage;
