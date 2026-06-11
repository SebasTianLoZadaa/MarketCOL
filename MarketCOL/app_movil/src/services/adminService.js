/**
 * Encapsula las operaciones del panel administrativo sobre productos
 * crea, edita, elimina activa/desactiva productos
 * todas las funciones usan el cliente http central para incluir el token y manejo de errores
 */

import api from '../api/apiClient';

//crea un producto en el backend usando payload del formulario del admin
export async function createProduct(data) {
    const res = await api.post('/admin/productos', data);
    return res.data;
}

//actualia un producto por id usando payload del formulario del admin

export async function updateProduct(data, id) {
    const res = await api.put(`/admin/productos/${id}`, data);
    return res.data;
    
}

//eliminar producto por id usando payload del formulario del admin

export async function deleteProduct(id, data) {
    const res = await api.delete(`/admin/productos/${id}`, data);
    return res.data;
    
}

//activar o desactivar producto por id usando payload del formulario del admin

export async function activarProducto(id) {
    const res = await api.patch(`/admin/productos/${id}/toggle`);
    return res.data;
    
}

//desactivar producto por id usando payload del formulario del admin

export async function desactivarProducto(id) {
    const res = await api.patch(`/admin/productos/${id}/toggle`);
    return res.data;
    
}


