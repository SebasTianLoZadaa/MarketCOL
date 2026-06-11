// este archivo centraliza axios oara todas las peticiones HTTP al backend
//configura la URL base y el tiempo maximo de espera desde las constantes
//interceptor de peticion: adjunta automaticamente el token JWT si existe
//interceptor de respuesta: normaliza los errorea para que todo el codigo reciba 
//siempre un objeto error con un mensaje legible

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS, STORAGE_KEYS } from '../utils/constants';
import { storageGetItem } from '../utils/storage';

// instancias de axios
const apiClient = axios.create({
    baseURL: API_BASE_URL, // la base de url q se conecta con el backend con puerto
    timeout: API_TIMEOUT_MS, // timpo maximo se cancela si el server dura mas
});

// interceptor de peticion
//se ejecuta antes de enviar cada request
// su hay token lo valida
// autorizacion para que el backend pueda autenticar al usuario

apiClient.interceptors.request.use(
    async (config) => {
        const token = await storageGetItem(STORAGE_KEYS.token);

        if (token) {
            //formato estandar Bearer Authorization: Bearer <token>
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    // si el interceptor mismo falla (error de configuracion) rechaza la peticion
    (error) => Promise.reject(error)
);

// interceptor de respuesta
// se ejecuta despues de recibir cada respuesta
// respuesta 2xx se devuelven sin modificar
// respuestas de error 4xx o 5xx /red extrae el mensaje del backend
// si existe si no usa el mensaje de axios o un mensaje generico

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const backendMessage = error.response?.data?.message;// mensaje del backend si existe, ? permite campo opcional
        const message = backendMessage || error.message || 'Error conexion';
        return Promise.reject(new Error(message));
    }
);

export default apiClient;