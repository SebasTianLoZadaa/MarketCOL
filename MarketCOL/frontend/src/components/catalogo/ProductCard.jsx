/**
 * ============================================
 * PRODUCT CARD - MarketCOL (Rediseño)
 * ============================================
 */

import React, { memo, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, getImageUrl, getImageUrlCandidates } from '../../utils/helpers';

const ProductCard = memo(({ producto, onAddToCart, showActions = true }) => {
  const [imgSrc, setImgSrc] = useState(() => getImageUrl(producto.imagen));
  const fallbackUrls = useMemo(() => getImageUrlCandidates(producto.imagen).slice(1), [producto.imagen]);

  const handleImageError = useCallback((e) => {
    if (fallbackUrls.length > 0) {
      const nextUrl = fallbackUrls.shift();
      setImgSrc(nextUrl);
      return;
    }

    e.target.src = '/images/producto-default.svg';
  }, [fallbackUrls]);

  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(producto);
  }, [producto, onAddToCart]);

  const isLowStock   = producto.stock > 0 && producto.stock < 10;
  const isOutOfStock = producto.stock === 0;

  return (
    <div className="mk-card mk-card-hover fade-up" style={{ opacity: isOutOfStock ? 0.7 : 1 }}>
      {/* Imagen */}
      <Link to={`/producto/${producto.id}`} style={{ textDecoration: 'none' }}>
        <div className="mk-product-img">
          <img
            src={imgSrc}
            alt={producto.nombre}
            onError={handleImageError}
          />
          {isLowStock && (
            <span className="mk-badge mk-badge-warning"
              style={{ position: 'absolute', top: 8, right: 8, fontSize: 10 }}>
              ¡Últimas!
            </span>
          )}
          {isOutOfStock && (
            <span className="mk-badge mk-badge-gray"
              style={{ position: 'absolute', top: 8, right: 8, fontSize: 10 }}>
              Agotado
            </span>
          )}
        </div>
      </Link>

      {/* Cuerpo */}
      <div style={{ padding: '14px 16px' }}>
        {/* Categoría */}
        {producto.subcategoria?.nombre && (
          <div style={{
            fontSize: 10, color: 'var(--gray)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
          }}>
            {producto.subcategoria.nombre}
          </div>
        )}

        {/* Nombre */}
        <Link to={`/producto/${producto.id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            fontWeight: 600, fontSize: 14, color: 'var(--carbon)',
            lineHeight: 1.35, marginBottom: 6,
          }}>
            {producto.nombre}
          </div>
        </Link>

        {/* Descripción corta */}
        {producto.descripcion && (
          <p style={{
            fontSize: 12, color: 'var(--gray)', lineHeight: 1.5,
            marginBottom: 10,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {producto.descripcion}
          </p>
        )}

        {/* Precio + stock */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 18, color: 'var(--red)',
          }}>
            {formatCurrency(producto.precio)}
          </span>
          <span className={`mk-badge ${isOutOfStock ? 'mk-badge-gray' : 'mk-badge-green'}`}
            style={{ fontSize: 10 }}>
            {isOutOfStock ? 'Sin stock' : `Stock: ${producto.stock}`}
          </span>
        </div>

        {/* Acción */}
        {showActions && (
          <button
            className={`mk-btn ${isOutOfStock ? 'mk-btn-ghost' : 'mk-btn-primary'} mk-btn-w`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            style={{ fontSize: 13 }}
          >
            {!isOutOfStock && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="8" x2="12" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="9" y1="11" x2="15" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
            {isOutOfStock ? 'No disponible' : 'Agregar al carrito'}
          </button>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;
