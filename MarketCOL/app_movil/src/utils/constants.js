/**
 * ============================================
 * CONSTANTES - MarketCOL APP MÓVIL
 * ============================================
 */

/**
 * Tiempo máximo de espera para las peticiones HTTP.
 */
export const API_TIMEOUT_MS = 15000; // 15 segundos

/**
 * URL base de la API.
 *
 * La URL debe proporcionarse mediante una variable
 * de entorno y utilizar obligatoriamente HTTPS.
 *
 * Expo:
 * EXPO_PUBLIC_API_BASE_URL
 */
const configuredApiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL;

if (!configuredApiBaseUrl) {
    throw new Error(
        'La variable EXPO_PUBLIC_API_BASE_URL no está configurada.'
    );
}

let parsedApiUrl;

try {
    parsedApiUrl = new URL(configuredApiBaseUrl);

    if (parsedApiUrl.protocol !== 'https:') {
        throw new Error(
            'API_BASE_URL debe utilizar HTTPS.'
        );
    }
} catch (error) {
    throw new Error(
        'API_BASE_URL debe ser una URL HTTPS válida.'
    );
}

export const API_BASE_URL =
    parsedApiUrl.toString().replace(/\/++$/, '');


/**
 * Claves utilizadas para almacenamiento local.
 */
export const STORAGE_KEYS = {
    token: 'token',
    user: 'user',
    carritoLocal: 'carritoLocal',
};