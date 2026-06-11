export const API_TIMEOUT_MS = 15000; // 15 segundos

// Android emulador accede al localhost de la PC mediante 10.0.2.2
// Si usas dispositivo físico, cambia por la IP LAN: http://192.168.X.X:5000/api
// Si usas Expo Go en el mismo equipo, puedes usar: http://localhost:5000/api
export const API_BASE_URL = 'http://10.0.2.2:5000/api';

export const STORAGE_KEYS = {
    token: 'token',
    user: 'user',
    carritoLocal: 'carritoLocal',
};