/**
 * ============================================
 * LOADING SPINNER - MarketCOL (Rediseño)
 * ============================================
 */

import React from 'react';

const LoadingSpinner = ({ message = 'Cargando...' }) => (
  <div className="mk-loading-wrap">
    <div className="mk-spinner" />
    <span>{message}</span>
  </div>
);

export default LoadingSpinner;
