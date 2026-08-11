/**
 * unifica el manejo del carrito para dos escenarios
 * usuario sin sesion carrito local asyncStorage
 * usuario autenticado carrito persistido en el backend
 * tambien normaliza la estructura de items y calcula totales para el contexto cosuma un formato consistente
 */

import apiClient from "../api/apiClient";
import { STORAGE_KEYS } from "../utils/constants";
import {storageGetItem, storageSetItem } from '../utils/storage';

// lee el carrito guardado localmente. si no existe o esta corrupto devuelve []

async function readLocalCart() {
    const raw = await storageGetItem(STORAGE_KEYS.carritoLocal);
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// guarda el carrito local completo reemplazando el valor anterior
async function writeLocalCart(items) {
    await storageSetItem(STORAGE_KEYS.carritoLocal, JSON.stringify(items));
}

//convierte en diferentes formatos de items del backend/local a una estructura unica
function normalizeItem(item) {
    const producto = item.Producto || item.producto || {};
    const precio = Number (item.precio ?? item.precioUnitario ?? producto.precio ?? 0);
    const cantidad = Number (item.cantidad || 0);
    const stock = Number(item.stock ?? producto.stock ?? 0);

    return {
        id: item.id,
        productoId: item.productoId ?? producto.id,
        nombre: item.nombre ?? producto.nombre ?? 'producto',
        imagen: item.imagen ?? producto.imagen ?? '',
        precio,
        cantidad,
        stock,
        subtotal: precio * cantidad,
    };
}

function getStockValue(producto) {
    return Number(producto?.stock ?? producto?.stockDisponible ?? producto?.stock_disponible ?? producto?.cantidadDisponible ?? 0);
}

function buildStockError(producto, stock) {
    const nombre = producto?.nombre || 'este producto';
    return new Error(`Solo quedan ${stock} unidad${stock === 1 ? '' : 'es'} disponibles de ${nombre}.`);
}

//calcula resumen del carrito: items normalizados, cantidad total y monto total
function summarize(items) {
    const normalized = items.map(normalizeItem);
    const totalItems = normalized.reduce((acc, item) => acc + item.cantidad, 0);
    const total = normalized.reduce((acc, item) => acc + item.subtotal, 0);

    return { items: normalized, totalItems, total };
}

const carritoService = {
    // obtiene el carrito desde el backend o desde storage segun la sesion
    getCarrito: async (isAuthenticated) => {
        if (isAuthenticated) {
            const response = await apiClient.get('/cliente/carrito');
            const payload = response.data?.data || response.data || {};
            // El backend devuelve { success: true, data: { items: [...], resumen: {...} } }
            const items = payload.items || payload.carrito?.Items || payload.carrito?.items || [];
            return summarize(items);
        }

        const localItems = await readLocalCart();
        return summarize(localItems);
    },

    //agrega un producto al carrito correspondiente
    addToCarrito: async ({ isAuthenticated, producto, cantidad = 1 }) => {
        const stock = getStockValue(producto);

        if (isAuthenticated) {
            if (stock > 0 && cantidad > stock) {
                throw buildStockError(producto, stock);
            }
            await apiClient.post('/cliente/carrito', {
                productoId: producto.id,
                cantidad,
            });
            return; 
        }
        const localItems = await readLocalCart();
        const existing = localItems.find((item) => Number(item.productoId) === Number(producto.id));

        if (existing) {
            const nextCantidad = existing.cantidad + cantidad;
            if (stock > 0 && nextCantidad > stock) {
                throw buildStockError(producto, stock);
            }
            existing.cantidad = nextCantidad;
        } else {
            if (stock > 0 && cantidad > stock) {
                throw buildStockError(producto, stock);
            }
            localItems.push({
                id: Date.now(),
                productoId: producto.id,
                nombre: producto.nombre,
                precio: Number(producto.precio || 0),
                cantidad,
                stock,
            });
        }
        await writeLocalCart(localItems);
    },

    //cambia la cantidad de un item ya existente
    updateCantidad: async ({ isAuthenticated, itemId, cantidad}) => {
        if (isAuthenticated) {
            await apiClient.put(`/cliente/carrito/${itemId}`, { cantidad });
            return;
        }

        const localItems = await readLocalCart();
        const item = localItems.find((it) => Number(it.id) === Number (itemId));
        if (!item) {
            return;
        }

        const stock = Number(item.stock ?? 0);
        if (stock > 0 && cantidad > stock) {
            throw buildStockError(item, stock);
        }

        item.cantidad = cantidad;
        await writeLocalCart(localItems);
    },

    //elimina un item puntual del carrito
    removeItem: async({isAuthenticated, itemId }) => {
        if (isAuthenticated) {
            await apiClient.delete(`/cliente/carrito/${itemId}`);
            return;
        }

        const localItems = await readLocalCart();
        const filtered = localItems.filter((it) => Number(it.id) !== Number(itemId));
        await writeLocalCart(filtered);
    },

    // vacia por completo el carrito local o remoto
    clearCarrito: async (isAuthenticated) => {
        if (isAuthenticated) {
            await apiClient.delete('/cliente/carrito');
            return;
        }

        await writeLocalCart([]);
    },
    
    //migrar todos los items guardados localmente al carrito del backend despues que el usuario inicia sesion

    mergeLocalToBackend: async () => {
        const localItems = await readLocalCart();
        if (localItems.length === 0) {
            return;
        }

        for (const item of localItems) {
            try {
                await apiClient.post('/cliente/carrito', {
                    productoId: item.productoId,
                    cantidad: item.cantidad
                });
            } catch {
                //si un item falla "producto eliminado continua con el otro"
            }
        }

        await writeLocalCart([]);
    },
};

export default carritoService;