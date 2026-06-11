/**
 * Servicio de Autenticación - MarketCOL
 * 
 * Centraliza todas las funciones relacionadas con autenticación:
 * - Inicia sesión, guarda token/usuario en almacenamiento local
 * - Registra nuevo usuario (con cédula), guarda token/usuario
 * - Cierra sesión eliminando los datos
 * - Restaura la sesión guardada
 * - Actualiza el perfil del usuario autenticado
 */

import apiClient from '../api/apiClient';
import { STORAGE_KEYS } from '../utils/constants';
import { storageGetItem, storageMultiRemove, storageSetItem } from '../utils/storage';

const authService = {
    /**
     * login
     * Envía credenciales al backend y persiste token + usuario si son válidos.
     */
    login: async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const payload = response.data?.data || response.data;

        if (payload?.token) {
            await storageSetItem(STORAGE_KEYS.token, payload.token);
        }

        if (payload?.usuario) {
            await storageSetItem(STORAGE_KEYS.user, JSON.stringify(payload.usuario));
        }

        return payload;
    },

    /**
     * register
     * Registra un nuevo usuario (incluye cédula) e inicia sesión automáticamente
     * guardando token y usuario en el almacenamiento local.
     * 
     * @param {Object} data - { nombre, apellido, email, password, telefono, direccion, cedula }
     */
    register: async (data) => {
        const response = await apiClient.post('/auth/register', data);
        const payload = response.data?.data || response.data;

        // MarketCOL devuelve token y usuario al registrarse
        if (payload?.token) {
            await storageSetItem(STORAGE_KEYS.token, payload.token);
        }

        if (payload?.usuario) {
            await storageSetItem(STORAGE_KEYS.user, JSON.stringify(payload.usuario));
        }

        return payload;
    },

    /**
     * logout
     * Cierra sesión eliminando token y usuario del almacenamiento local.
     */
    logout: async () => {
        await storageMultiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
    },

    /**
     * getSession
     * Lee del almacenamiento local la sesión previamente guardada.
     * @returns {Object} { token, user }
     */
    getSession: async () => {
        const token = await storageGetItem(STORAGE_KEYS.token);
        const userRaw = await storageGetItem(STORAGE_KEYS.user);
        const user = userRaw ? JSON.parse(userRaw) : null;
        return { token, user };
    },

    /**
     * updatePerfil
     * Actualiza el perfil del usuario autenticado y persiste los cambios.
     * @param {Object} data - { nombre, apellido, telefono, direccion, cedula }
     */
    updatePerfil: async (data) => {
        const response = await apiClient.put('/auth/me', data);
        const usuario = response.data?.data?.usuario || response.data?.usuario || null;
        if (usuario) {
            await storageSetItem(STORAGE_KEYS.user, JSON.stringify(usuario));
        }
        return usuario;
    },
};

export default authService;