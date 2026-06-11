/**
 * administra funciones de usuario
 * activa  desactiva y eimina desde el panel de administrador
 */

import api from "../api/apiClient";

//activa usuarios
export async function activarUsuario(id) {
    const res = await api.patch(`/admin/usuarios/${id}/toggle`);
    return res.data;
}
// desactiva usuario
export async function desactivarUsuario(id) {
    const res = await api.patch(`/admin/usuarios/${id}/toggle`);
    return res.data;
    
}


// elimina usuario
export async function deleteUsuario(id, data) {
    const res = await api.delete(`/admin/usuarios/${id}`, data);
    return res.data;
    
}