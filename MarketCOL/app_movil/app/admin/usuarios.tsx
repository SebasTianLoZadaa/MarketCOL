/**
 * Gestión de usuarios - Panel de administración - MarketCOL
 * Lista todos los usuarios con búsqueda y paginación.
 * Solo administradores pueden activar/desactivar y eliminar usuarios.
 * Los auxiliares solo pueden ver la lista sin botones de acción.
 */

import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { activarUsuario, desactivarUsuario, deleteUsuario } from '../../src/services/usuarioAdminService';
import { useAuth } from '../../src/context/AuthContext';

type Usuario = {
    id?: number;
    nombre?: string;
    apellido?: string;
    cedula?: string;
    email?: string;
    rol?: string;
    activo?: boolean;
};

const getRolBadge = (rol: string) => {
    const mapping: Record<string, { color: string; bg: string; label: string; icon: string }> = {
        administrador: { color: '#dc2626', bg: '#fee2e2', label: 'Admin', icon: 'shield-checkmark' },
        auxiliar:     { color: '#f59e0b', bg: '#fef3c7', label: 'Auxiliar', icon: 'shield-outline' },
        cliente:      { color: '#3b82f6', bg: '#dbeafe', label: 'Cliente', icon: 'person-outline' },
    };
    return mapping[rol] || { color: '#6b7280', bg: '#f3f4f6', label: rol || '—', icon: 'help-circle-outline' };
};

export default function AdminUsuariosScreen() {
    const { user } = useAuth() as { user?: { rol?: string } };
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const isAdmin = user?.rol === 'administrador';

    const fetchUsuarios = async (page = 1, search = '') => {
        setLoading(true);
        setErrorMessage('');
        try {
            const params: string[] = [];
            if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`);
            params.push(`pagina=${page}`);
            params.push('limite=10');
            const url = `/admin/usuarios?${params.join('&')}`;
            const res = await apiClient.get(url);
            const usuariosData: Usuario[] = res.data?.data?.usuarios || [];
            setUsuarios(usuariosData);
            setPagina(page);
            setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
        } catch (error: unknown) {
            setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleBuscar = () => fetchUsuarios(1, busqueda);
    const handlePagina = (next: number) => {
        const nueva = Math.max(1, Math.min(totalPaginas, pagina + next));
        fetchUsuarios(nueva, busqueda);
    };

    return (
        <View style={styles.container}>
            <ThemedText type="title">Usuarios</ThemedText>

            {/* BARRA DE BÚSQUEDA */}
            <View style={styles.searchRow}>
                <TextInput
                    placeholder="Buscar por nombre, email o cédula..."
                    value={busqueda}
                    onChangeText={(text) => { setBusqueda(text); fetchUsuarios(1, text); }}
                    style={styles.input}
                />
                <Pressable style={styles.searchBtn} onPress={handleBuscar}>
                    <Ionicons name="search" size={18} color="#fff" />
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#28a745" />
                    <ThemedText>Cargando usuarios...</ThemedText>
                </View>
            ) : null}

            {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

            <FlatList
                data={usuarios}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                    const rolInfo = getRolBadge(item.rol || 'cliente');
                    return (
                        <View style={styles.card}>
                            {/* Avatar con inicial */}
                            <View style={styles.avatar}>
                                <ThemedText style={styles.avatarText}>
                                    {item.nombre?.charAt(0)?.toUpperCase() || 'U'}
                                </ThemedText>
                            </View>

                            <View style={styles.cardBody}>
                                <ThemedText type="defaultSemiBold">{item.nombre} {item.apellido}</ThemedText>
                                <ThemedText style={styles.email}>{item.email}</ThemedText>
                                
                                {/* Cédula */}
                                {item.cedula ? (
                                    <View style={styles.cedulaRow}>
                                        <Ionicons name="card-outline" size={11} color="#888" />
                                        <ThemedText style={styles.cedulaText}>C.C. {item.cedula}</ThemedText>
                                    </View>
                                ) : null}

                                {/* Badges de rol y estado */}
                                <View style={styles.badgesRow}>
                                    <View style={[styles.rolBadge, { backgroundColor: rolInfo.bg }]}>
                                        <Ionicons name={rolInfo.icon as any} size={10} color={rolInfo.color} />
                                        <ThemedText style={[styles.rolBadgeText, { color: rolInfo.color }]}>
                                            {rolInfo.label}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.estadoRow}>
                                        <View style={[styles.estadoDot, { backgroundColor: item.activo ? '#28a745' : '#ef4444' }]} />
                                        <ThemedText style={styles.estadoText}>{item.activo ? 'Activo' : 'Inactivo'}</ThemedText>
                                    </View>
                                </View>
                            </View>

                            {/* BOTONES DE ACCIÓN (solo admin) */}
                            {isAdmin && (
                                <View style={styles.actionsRow}>
                                    <Pressable
                                        style={[styles.actionBtn, { backgroundColor: item.activo ? '#f59e0b' : '#28a745' }]}
                                        onPress={async () => {
                                            try {
                                                if (item.activo) {
                                                    await desactivarUsuario(item.id!);
                                                } else {
                                                    await activarUsuario(item.id!);
                                                }
                                                fetchUsuarios(pagina, busqueda);
                                            } catch {
                                                Alert.alert('Error', 'No se pudo cambiar el estado');
                                            }
                                        }}>
                                        <Ionicons name={item.activo ? 'eye-off-outline' : 'eye-outline'} size={14} color="#fff" />
                                    </Pressable>
                                    <Pressable
                                        style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                                        onPress={() => {
                                            Alert.alert('Eliminar usuario', '¿Estás seguro de eliminar este usuario?', [
                                                { text: 'Cancelar', style: 'cancel' },
                                                {
                                                    text: 'Eliminar', style: 'destructive',
                                                    onPress: async () => {
                                                        try {
                                                            await deleteUsuario(item.id!);
                                                            fetchUsuarios(pagina, busqueda);
                                                        } catch {
                                                            Alert.alert('Error', 'No se pudo eliminar. Puede tener pedidos asociados.');
                                                        }
                                                    },
                                                },
                                            ]);
                                        }}>
                                        <Ionicons name="trash-outline" size={14} color="#fff" />
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={!loading && !errorMessage ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={60} color="#ccc" />
                        <ThemedText style={styles.emptyText}>No hay usuarios.</ThemedText>
                    </View>
                ) : null}
                style={styles.list}
            />

            {/* PAGINACIÓN */}
            <View style={styles.paginationRow}>
                <Pressable style={styles.pageBtn} onPress={() => handlePagina(-1)} disabled={pagina <= 1}>
                    <Ionicons name="chevron-back" size={18} color={pagina <= 1 ? '#ccc' : '#fff'} />
                </Pressable>
                <ThemedText style={styles.pageLabel}>Página {pagina} de {totalPaginas}</ThemedText>
                <Pressable style={styles.pageBtn} onPress={() => handlePagina(1)} disabled={pagina >= totalPaginas}>
                    <Ionicons name="chevron-forward" size={18} color={pagina >= totalPaginas ? '#ccc' : '#fff'} />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 10 },
    centered: { alignItems: 'center', gap: 10, marginVertical: 20 },
    error: { color: '#ef4444' },
    emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40 },
    emptyText: { color: '#888', fontSize: 14 },
    
    // Búsqueda
    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    input: { flex: 1, borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
    searchBtn: { backgroundColor: '#28a745', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },

    list: { flex: 1 },
    
    // Card
    card: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 12, backgroundColor: '#fff', marginBottom: 8, alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#28a745', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
    cardBody: { flex: 1, gap: 2 },
    email: { color: '#555', fontSize: 13 },
    
    // Cédula
    cedulaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    cedulaText: { color: '#888', fontSize: 11 },
    
    // Badges
    badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    rolBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    rolBadgeText: { fontWeight: '600', fontSize: 10 },
    estadoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    estadoDot: { width: 8, height: 8, borderRadius: 4 },
    estadoText: { color: '#888', fontSize: 11 },

    // Acciones
    actionsRow: { flexDirection: 'column', gap: 6, marginLeft: 8 },
    actionBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },

    // Paginación
    paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
    pageBtn: { backgroundColor: '#28a745', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
    pageLabel: { fontWeight: '600', color: '#333' },
});