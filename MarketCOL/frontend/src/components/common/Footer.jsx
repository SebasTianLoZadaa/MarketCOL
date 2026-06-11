/**
 * ============================================
 * FOOTER - MarketCOL (Rediseño)
 * ============================================
 */

import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';

const Footer = memo(() => {
  return (
    <footer className="mk-footer" style={{ padding: '48px 0 24px' }}>
      <Container>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '48px',
          marginBottom: 40,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 34, height: 34, background: 'var(--red)',
                borderRadius: 'var(--radius)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="21" r="1" fill="white"/>
                  <circle cx="20" cy="21" r="1" fill="white"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'white', lineHeight: 1 }}>
                  MarketCOL
                </div>
                <div style={{ fontSize: 10, color: '#6B7280', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  MerkaCiro
                </div>
              </div>
            </div>
            <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.7, maxWidth: 280, marginBottom: 20 }}>
              Supermercado de barrio con sistema Aliste y Recoja. Productos frescos y de calidad para tu hogar.
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'fb', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg> },
                { label: 'ig', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg> },
                { label: 'wa', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg> },
              ].map(s => (
                <div key={s.label} style={{
                  width: 34, height: 34,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#9CA3AF',
                  transition: 'all 0.15s',
                }}>
                  {s.icon}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#6B7280',
              letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 16,
            }}>
              Navegación
            </div>
            {[
              { to: '/', label: 'Inicio' },
              { to: '/catalogo', label: 'Catálogo' },
              { to: '/mis-pedidos', label: 'Mis Pedidos' },
              { to: '/login', label: 'Iniciar Sesión' },
            ].map(l => (
              <Link key={l.to} to={l.to} className="mk-footer-link">{l.label}</Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#6B7280',
              letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 16,
            }}>
              Contacto
            </div>
            {[
              { icon: '📍', text: 'Calle 123 #45-67, Bogotá' },
              { icon: '✉️', text: 'contacto@merkaciro.com' },
              { icon: '📱', text: '+57 300 123 4567' },
            ].map(c => (
              <div key={c.text} style={{
                display: 'flex', gap: 10, color: '#9CA3AF',
                fontSize: 14, marginBottom: 10, alignItems: 'flex-start',
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
                <span>{c.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ color: '#6B7280', fontSize: 13 }}>
            © {new Date().getFullYear()} MarketCOL · MerkaCiro. Todos los derechos reservados.
          </span>
          <span style={{ color: '#6B7280', fontSize: 13 }}>
            Hecho con ❤️ en Colombia
          </span>
        </div>
      </Container>
    </footer>
  );
});

Footer.displayName = 'Footer';
export default Footer;
