/**
 * ============================================
 * ARCHIVO PRINCIPAL DE LA APLICACIÓN REACT - MarketCOL
 * ============================================
 * Punto de entrada de la aplicación.
 * Configura React, importa estilos globales y monta el componente App.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

// Importar estilos de Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
// Importar íconos de Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css';
// Importar estilos personalizados
import './index.css';

// Importar el componente principal
import App from './App';

/**
 * Crear el root de React 18
 * Busca el elemento con id="root" en public/index.html
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * Renderizar la aplicación
 * Se envuelve en React.StrictMode para detectar problemas potenciales en desarrollo
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);