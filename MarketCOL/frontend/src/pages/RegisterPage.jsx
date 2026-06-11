/**
 * ============================================
 * REGISTER PAGE - MarketCOL (Rediseño)
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, isValidPhone } from '../utils/helpers';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '',
    password: '', confirmPassword: '',
    telefono: '', direccion: '', cedula: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [tieneCarrito, setTieneCarrito] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const carritoLocal = JSON.parse(localStorage.getItem('carrito_local') || '[]');
    setTieneCarrito(carritoLocal.length > 0);
  }, []);

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden'); return;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres'); return;
    }
    if (!isValidEmail(formData.email)) {
      setError('Email inválido'); return;
    }
    if (formData.telefono && !isValidPhone(formData.telefono)) {
      setError('Teléfono inválido (10 dígitos iniciando con 3)'); return;
    }
    if (formData.cedula && !/^\d+$/.test(formData.cedula)) {
      setError('La cédula debe contener solo números'); return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      navigate('/catalogo');
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder, hint }) => (
    <div className="mk-field">
      <label className="mk-label">{label}</label>
      <input
        className="mk-input"
        type={type} name={name} placeholder={placeholder}
        value={formData[name]} onChange={handleChange}
      />
      {hint && <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4 }}>{hint}</div>}
    </div>
  );

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)', background: 'var(--gray-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="mk-card fade-up" style={{ maxWidth: 520, width: '100%', padding: '40px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, background: 'var(--red)', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2"/>
              <line x1="19" y1="8" x2="19" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="11" x2="22" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 24, color: 'var(--carbon)', marginBottom: 4,
          }}>
            Crear cuenta
          </h2>
          <p style={{ color: 'var(--gray)', fontSize: 14, margin: 0 }}>
            Únete a MarketCOL · MerkaCiro
          </p>
        </div>

        {error && (
          <div className="mk-alert mk-alert-danger" style={{ marginBottom: 20 }}>
            ⚠️ {error}
          </div>
        )}
        {tieneCarrito && (
          <div className="mk-alert mk-alert-success" style={{ marginBottom: 20 }}>
            🛒 Tu carrito se sincronizará al crear tu cuenta
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Nombre *" name="nombre" placeholder="Tu nombre" />
            <Field label="Apellido *" name="apellido" placeholder="Tu apellido" />
            <Field label="Email *" name="email" type="email" placeholder="tu@correo.com" />
            <Field label="Cédula" name="cedula" placeholder="Solo números" hint="Sin puntos ni guiones" />
            <Field label="Contraseña *" name="password" type="password" placeholder="Mín. 6 caracteres" />
            <Field label="Confirmar contraseña *" name="confirmPassword" type="password" placeholder="Repite la contraseña" />
          </div>

          <Field label="Teléfono" name="telefono" placeholder="3001234567" hint="10 dígitos, iniciando con 3" />

          <div className="mk-field">
            <label className="mk-label">Dirección (opcional)</label>
            <textarea
              className="mk-input mk-textarea"
              name="direccion" placeholder="Calle 123 #45-67"
              value={formData.direccion} onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="mk-btn mk-btn-primary mk-btn-w"
            style={{ padding: 13, fontSize: 15, marginTop: 4 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="mk-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Registrando...
              </>
            ) : 'Crear mi cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray)', marginTop: 20 }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--red)', fontWeight: 600, textDecoration: 'none' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
