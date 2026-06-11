/**
 * ============================================
 * CATALOGO PAGE - MarketCOL (Rediseño)
 * ============================================
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import catalogoService from '../services/catalogoService';
import carritoService from '../services/carritoService';
import ProductCard from '../components/catalogo/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const CatalogoPage = () => {
  const [productos, setProductos]       = useState([]);
  const [categorias, setCategorias]     = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [mensaje, setMensaje]           = useState({ tipo: '', texto: '' });
  const [paginacion, setPaginacion]     = useState({ total: 0, pagina: 1, totalPaginas: 1 });
  const [filtros, setFiltros]           = useState({
    categoriaId: '', subcategoriaId: '', buscar: '', pagina: 1, limite: 15,
  });

  const timeoutRef  = useRef(null);
  const debounceRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchProductos = useCallback(async (f) => {
    setLoading(true);
    try {
      const res = await catalogoService.getProductos(f);
      setProductos(res.data.productos);
      setPaginacion(res.data.paginacion);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setMensaje({ tipo: 'danger', texto: 'Error al cargar productos' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategorias = useCallback(async () => {
    try {
      const res = await catalogoService.getCategorias();
      setCategorias(res.data.categorias);
    } catch {}
  }, []);

  const loadSubcategorias = useCallback(async (catId) => {
    if (!catId) { setSubcategorias([]); return; }
    try {
      const res = await catalogoService.getSubcategoriasPorCategoria(catId);
      setSubcategorias(res.data.subcategorias);
    } catch {}
  }, []);

  useEffect(() => { loadCategorias(); }, [loadCategorias]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const delay = filtros.buscar ? 500 : 0;
    debounceRef.current = setTimeout(() => fetchProductos(filtros), delay);
    return () => clearTimeout(debounceRef.current);
  }, [filtros, fetchProductos]);

  useEffect(() => {
    loadSubcategorias(filtros.categoriaId);
    setFiltros(prev => ({ ...prev, subcategoriaId: '', pagina: 1 }));
  }, [filtros.categoriaId, loadSubcategorias]);

  useEffect(() => () => {
    clearTimeout(timeoutRef.current);
    clearTimeout(debounceRef.current);
  }, []);

  const handleFiltroChange = useCallback(e => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value, pagina: 1 }));
  }, []);

  const handleLimpiar = useCallback(() =>
    setFiltros({ categoriaId: '', subcategoriaId: '', buscar: '', pagina: 1 }), []);

  const handlePageChange = useCallback(p =>
    setFiltros(prev => ({ ...prev, pagina: p })), []);

  const handleAddToCart = useCallback(async (producto) => {
    try {
      await carritoService.agregarAlCarrito(producto.id, 1, producto);
      setMensaje({ tipo: 'success', texto: `${producto.nombre} agregado al carrito` });
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (err) {
      setMensaje({ tipo: 'danger', texto: err.message || 'Error al agregar al carrito' });
    }
  }, []);

  const handleCheckout = useCallback(() => {
    if (!isAuthenticated) {
      setMensaje({ tipo: 'warning', texto: 'Debes iniciar sesión para finalizar tu pedido' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    navigate('/checkout');
  }, [isAuthenticated, navigate]);

  /* Paginación visible */
  const getPages = () => {
    const { pagina: p, totalPaginas: total } = paginacion;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, p - 2);
    let end   = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      {/* ── Sidebar filtros ── */}
      <div style={{
        width: 240, background: 'white',
        borderRight: '1px solid var(--gray-border)',
        padding: 20, flexShrink: 0,
        position: 'sticky', top: 60,
        height: 'calc(100vh - 60px)', overflowY: 'auto',
      }}>
        {/* Buscador (mobile) */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              className="mk-input"
              style={{ paddingLeft: 34, fontSize: 13 }}
              name="buscar" placeholder="Buscar..."
              value={filtros.buscar} onChange={handleFiltroChange}
            />
          </div>
        </div>

        {/* Categorías */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 10 }}>
          Categorías
        </div>
        <button
          className={`mk-sidebar-link ${!filtros.categoriaId ? 'active' : ''}`}
          onClick={handleLimpiar}
          style={{ marginBottom: 2 }}
        >
          Todas las categorías
        </button>
        {categorias.map(cat => (
          <button
            key={cat.id}
            className={`mk-sidebar-link ${filtros.categoriaId === String(cat.id) ? 'active' : ''}`}
            onClick={() => setFiltros(prev => ({ ...prev, categoriaId: String(cat.id), subcategoriaId: '', pagina: 1 }))}
            style={{ marginBottom: 2 }}
          >
            {cat.nombre}
          </button>
        ))}

        {/* Subcategorías */}
        {subcategorias.length > 0 && (
          <>
            <hr className="mk-divider" style={{ margin: '16px 0' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 10 }}>
              Subcategorías
            </div>
            <button
              className={`mk-sidebar-link ${!filtros.subcategoriaId ? 'active' : ''}`}
              onClick={() => setFiltros(prev => ({ ...prev, subcategoriaId: '', pagina: 1 }))}
              style={{ marginBottom: 2 }}
            >
              Todas
            </button>
            {subcategorias.map(sub => (
              <button
                key={sub.id}
                className={`mk-sidebar-link ${filtros.subcategoriaId === String(sub.id) ? 'active' : ''}`}
                onClick={() => setFiltros(prev => ({ ...prev, subcategoriaId: String(sub.id), pagina: 1 }))}
                style={{ marginBottom: 2 }}
              >
                {sub.nombre}
              </button>
            ))}
          </>
        )}

        <hr className="mk-divider" style={{ margin: '16px 0' }} />
        <button className="mk-btn mk-btn-danger-soft mk-btn-w mk-btn-sm" onClick={handleLimpiar}>
          Limpiar filtros
        </button>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, padding: '28px 32px', minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--carbon)', margin: 0 }}>
              Catálogo
            </h1>
            {!loading && (
              <p style={{ color: 'var(--gray)', fontSize: 14, margin: '4px 0 0' }}>
                {paginacion.total} productos encontrados
              </p>
            )}
          </div>
          <button
            className="mk-btn mk-btn-primary"
            onClick={handleCheckout}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {isAuthenticated ? 'Finalizar Pedido' : 'Iniciar Sesión para Pedir'}
          </button>
        </div>

        {/* Alerta */}
        {mensaje.texto && (
          <div className={`mk-alert mk-alert-${mensaje.tipo}`} style={{ marginBottom: 20 }}>
            {mensaje.tipo === 'success' && '✓ '}
            {mensaje.tipo === 'danger' && '⚠️ '}
            {mensaje.tipo === 'warning' && '⚠️ '}
            {mensaje.texto}
            <button
              onClick={() => setMensaje({ tipo: '', texto: '' })}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, lineHeight: 1, padding: 0 }}
            >×</button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <LoadingSpinner message="Cargando productos..." />
        ) : productos.length > 0 ? (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 18,
            }}>
              {productos.map((p, i) => (
                <div key={p.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <ProductCard producto={p} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </div>

            {/* Paginación */}
            {paginacion.totalPaginas > 1 && (
              <div className="mk-pagination">
                <button
                  className="mk-btn mk-btn-ghost mk-btn-sm"
                  disabled={paginacion.pagina === 1}
                  onClick={() => handlePageChange(paginacion.pagina - 1)}
                >← Anterior</button>

                {getPages().map(n => (
                  <button
                    key={n}
                    className={`mk-btn mk-btn-sm ${paginacion.pagina === n ? 'mk-btn-primary' : 'mk-btn-ghost'}`}
                    onClick={() => handlePageChange(n)}
                  >{n}</button>
                ))}

                <button
                  className="mk-btn mk-btn-ghost mk-btn-sm"
                  disabled={paginacion.pagina === paginacion.totalPaginas}
                  onClick={() => handlePageChange(paginacion.pagina + 1)}
                >Siguiente →</button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--carbon)', marginBottom: 8 }}>
              No se encontraron productos
            </h4>
            <p style={{ color: 'var(--gray)', marginBottom: 24 }}>
              Intenta cambiar los filtros de búsqueda
            </p>
            <button className="mk-btn mk-btn-primary" onClick={handleLimpiar}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogoPage;
