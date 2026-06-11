/**
 * Contexto global de autenticación - MarketCOL
 * 
 * - Restaura la sesión guardada al iniciar la app (token, usuario)
 * - Expone funciones: login, register, logout, updatePerfil
 * - Cualquier componente usa useAuth() en lugar de leer AsyncStorage directamente
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';

// Valor inicial null; useAuth() valida que está dentro de un provider
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Usuario autenticado: objeto con id, nombre, apellido, email, rol, cedula, etc.
    const [user, setUser] = useState(null);
    // JWT recibido del backend; su presencia indica sesión activa
    const [token, setToken] = useState(null);
    // true mientras se lee AsyncStorage al arrancar; evita redirigir antes de tiempo
    const [isLoading, setIsLoading] = useState(true);

    /**
     * restoreSession
     * Lee el token y el usuario guardados en AsyncStorage al abrir la app.
     * Si no hay sesión guardada, deja los estados en null.
     */
    const restoreSession = useCallback(async () => {
        try {
            const session = await authService.getSession();
            setToken(session?.token || null);
            setUser(session?.user || null);
        } finally {
            // Siempre marca la carga como terminada, aunque falle la lectura
            setIsLoading(false);
        }
    }, []);

    // Se ejecuta una sola vez al montar el provider (al iniciar la app)
    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    /**
     * login
     * Llama POST /auth/login, guarda el token en AsyncStorage y actualiza el estado global.
     */
    const login = useCallback(async (email, password) => {
        const response = await authService.login(email, password);
        // El backend de MarketCOL devuelve: { success, data: { usuario, token } }
        const payload = response?.data?.data || response?.data || response;

        setToken(payload?.token || null);
        setUser(payload?.usuario || payload?.user || null);

        return response;
    }, []);

    /**
     * register
     * Llama POST /auth/register con los datos del usuario (incluyendo cédula).
     * Después del registro exitoso, inicia sesión automáticamente.
     */
    const register = useCallback(async (data) => {
        const response = await authService.register(data);
        // El backend de MarketCOL devuelve: { success, data: { usuario, token } }
        const payload = response?.data?.data || response?.data || response;

        // Si el registro devuelve token, iniciamos sesión automáticamente
        if (payload?.token) {
            setToken(payload.token);
            setUser(payload.usuario || payload.user || null);
        }

        return response;
    }, []);

    /**
     * logout
     * Elimina el token del AsyncStorage y limpia el estado global.
     */
    const logout = useCallback(async () => {
        await authService.logout();
        setToken(null);
        setUser(null);
    }, []);

    /**
     * updatePerfil
     * Actualiza los datos del usuario en el backend y sincroniza el estado local.
     */
    const updatePerfil = useCallback(async (data) => {
        const response = await authService.updatePerfil(data);
        const payload = response?.data?.data || response?.data || response;
        const usuario = payload?.usuario || payload?.user || payload;
        if (usuario) setUser(usuario);
        return usuario;
    }, []);

    /**
     * Valor del contexto
     * useMemo evita recrear el objeto en cada render. Solo cambia si alguna dependencia cambia.
     */
    const value = useMemo(
        () => ({
            user,               // Objeto del usuario autenticado o null
            token,              // JWT o null
            isAuthenticated: Boolean(token), // Booleano derivado del token
            isLoadingSession: isLoading,     // true mientras se restaura la sesión
            isAdmin: user?.rol === 'administrador',      // Helper para rol admin
            isAuxiliar: user?.rol === 'auxiliar',        // Helper para rol auxiliar
            isCliente: user?.rol === 'cliente',           // Helper para rol cliente
            login,
            register,
            logout,
            updatePerfil,
            refreshSession: restoreSession, // Permite forzar una re-lectura del storage
        }),
        [user, token, isLoading, login, register, logout, updatePerfil, restoreSession]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook useAuth()
 * Simplifica el acceso al contexto y lanza un error descriptivo si se usa fuera del provider.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
}