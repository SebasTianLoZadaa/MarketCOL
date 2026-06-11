import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock del contexto de autenticación para evitar errores
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isAuxiliar: false,
    loading: false,
  }),
}));

// Mock de los componentes de página para simplificar el renderizado
jest.mock('./pages/HomePage', () => () => <div data-testid="home-page">Home Page</div>);
jest.mock('./pages/LoginPage', () => () => <div data-testid="login-page">Login Page</div>);
jest.mock('./pages/CatalogoPage', () => () => <div data-testid="catalogo-page">Catálogo Page</div>);

describe('App Component', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Verificar que el navbar está presente (por el texto "MarketCOL" o el ícono de carrito)
    const navbarBrand = screen.getByText(/MarketCOL/i);
    expect(navbarBrand).toBeInTheDocument();
  });

  test('renders footer', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Verificar que el footer contiene el texto esperado
    const footerText = screen.getByText(/MarketCOL - MerkaCiro/i);
    expect(footerText).toBeInTheDocument();
  });

  test('renders home page by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Verificar que la página de inicio se renderiza
    const homePage = screen.getByTestId('home-page');
    expect(homePage).toBeInTheDocument();
  });
});