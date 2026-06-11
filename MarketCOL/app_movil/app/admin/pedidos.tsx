/**
 * Lista de pedidos en el panel de administrador - MarketCOL
 * Muestra todos los pedidos con filtros, paginación y acciones rápidas.
 * Permite confirmar pagos y cambiar estados directamente.
 * Solo para rol admin y auxiliar.
 */

import { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, TextInput, View, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';

type Pedido = {
    id: number;
    estado?: string;
    estadoPago?: string;
    metodoPago?: string;
    total?: number;
    createdAt?: string;
    usuario?: { nombre?: string; apellido?: string; email?: string };
};

const getEstadoBadge = (estado: string) => {
    const mapping: Record<string, { bg: string; color: string; label: string }> = {
        pendiente:  { bg: '#fef3c7', color: '#f59e0b', label: 'Pendiente' },
        preparando: { bg: '#dbeafe', color: '#3b82f6', label: 'Preparando' },
        listo:      { bg: '#d1fae5', color: '#28a745', label: 'Listo' },
        entregado:  { bg: '#d1fae5', color: '#059669', label: 'Entregado' },
        cancelado:  { bg: '#fee2e2', color: '#ef4444', label: 'Cancelado' },
    };
    return mapping[estado] || { bg: '#f3f4f6', color: '#6b7280', label: estado || '—' };
};

const ESTADOS_FILTRO = [
    { key: '', label: 'Todos' },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'preparando', label: 'Preparando' },
    { key: 'listo', label: 'Listos' },
    { key: 'entregado', label: 'Entregados' },
    { key: 'cancelado', label: 'Cancelados' },
];

const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

export default function AdminPedidoScreen() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const fetchPedidos = async (page = 1, search = '', estado = filtroEstado) => {
        setLoading(true);
        setErrorMessage('');
        try {
            const params: string[] = [];
            if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`);
            if (estado) params.push(`estado=${estado}`);
            params.push(`pagina=${page}`);
            params.push('limite=10');
            const url = `/admin/pedidos?${params.join('&')}`;
            const res = await apiClient.get(url);
            const pedidosData: Pedido[] = res.data?.data?.pedidos || [];
            setPedidos(pedidosData);
            setPagina(page);
            setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
        } catch (error: unknown) {
            setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar los pedidos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPedidos(1, '');
    }, []);

    const handlePagina = (next: number) => {
        const nueva = Math.max(1, Math.min(totalPaginas, pagina + next));
        fetchPedidos(nueva, busqueda);
    };

    const handleConfirmarPago = async (pedidoId: number) => {
        Alert.alert(
            'Confirmar Pago',
            '¿Confirmar que el cliente ha pagado? El pedido pasará a "preparando".',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            await apiClient.put(`/admin/pedidos/${pedidoId}/confirmar-pago`);
                            fetchPedidos(pagina, busqueda);
                        } catch (error: unknown) {
                            Alert.alert('Error', (error as { message?: string })?.message || 'No se pudo confirmar el pago');
                        }
                    },
                },
            ]
        );
    };

    const handleCambiarEstado = async (pedidoId: number, nuevoEstado: string) => {
        try {
            await apiClient.put(`/admin/pedidos/${pedidoId}/estado`, { estado: nuevoEstado });
            fetchPedidos(pagina, busqueda);
        } catch (error: unknown) {
            Alert.alert('Error', (error as { message?: string })?.message || 'No se pudo cambiar el estado');
        }
    };

    return (
        <View style={styles.container}>
            <ThemedText type="title">Pedidos</ThemedText>

            {/* BARRA DE BÚSQUEDA */}
            <View style={styles.searchRow}>
                <TextInput
                    placeholder="Buscar por cliente..."
                    value={busqueda}
                    onChangeText={(text) => { setBusqueda(text); fetchPedidos(1, text); }}
                    style={styles.input}
                />
                <Pressable style={styles.searchBtn} onPress={() => fetchPedidos(1, busqueda)}>
                    <Ionicons name="search" size={18} color="#fff" />
                </Pressable>
            </View>

            {/* CHIPS DE FILTRO POR ESTADO */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {ESTADOS_FILTRO.map((f) => {
                    const activo = filtroEstado === f.key;
                    return (
                        <Pressable
                            key={f.key}
                            onPress={() => { setFiltroEstado(f.key); fetchPedidos(1, busqueda, f.key); }}
                            style={[styles.chip, activo && styles.chipActive]}>
                            <ThemedText style={[styles.chipText, activo && styles.chipTextActive]}>
                                {f.label}
                            </ThemedText>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#28a745" />
                    <ThemedText>Cargando pedidos...</ThemedText>
                </View>
            ) : null}

            {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

            <FlatList
                data={pedidos}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                    const estadoInfo = getEstadoBadge(item.estado || 'pendiente');
                    const pagoPendiente = item.estadoPago === 'pendiente';
                    
                    return (
                        <Pressable
                            style={styles.card}
                            onPress={() =>
                                (router as unknown as { push: (p: { pathname: string; params: Record<string, string> }) => void }).push({
                                    pathname: '/admin/pedidos/[id]',
                                    params: { id: String(item.id) },
                                })
                            }>
                            {/* Cabecera: ID + Estado */}
                            <View style={styles.cardHeader}>
                                <ThemedText type="defaultSemiBold">Pedido #{item.id}</ThemedText>
                                <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.bg }]}>
                                    <ThemedText style={[styles.estadoText, { color: estadoInfo.color }]}>
                                        {estadoInfo.label}
                                    </ThemedText>
                                </View>
                            </View>

                            {/* Cliente y fecha */}
                            <View style={styles.cardInfo}>
                                <Ionicons name="person-outline" size={14} color="#888" />
                                <ThemedText style={styles.cardInfoText}>
                                    {item.usuario?.nombre} {item.usuario?.apellido}
                                </ThemedText>
                            </View>
                            <View style={styles.cardInfo}>
                                <Ionicons name="calendar-outline" size={14} color="#888" />
                                <ThemedText style={styles.cardInfoText}>
                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-CO') : '—'}
                                </ThemedText>
                            </View>

                            {/* Pago + Método + Total */}
                            <View style={styles.cardFooter}>
                                <View style={styles.pagoRow}>
                                    <View style={[styles.pagoBadge, { backgroundColor: pagoPendiente ? '#fef3c7' : '#d1fae5' }]}>
                                        <Ionicons
                                            name={pagoPendiente ? 'time-outline' : 'checkmark-circle'}
                                            size={12}
                                            color={pagoPendiente ? '#f59e0b' : '#28a745'}
                                        />
                                        <ThemedText style={{ color: pagoPendiente ? '#f59e0b' : '#28a745', fontWeight: '600', fontSize: 11 }}>
                                            {pagoPendiente ? 'Pendiente' : 'Pagado'}
                                        </ThemedText>
                                    </View>
                                    <Ionicons
                                        name={item.metodoPago === 'whatsapp' ? 'logo-whatsapp' : 'cash-outline'}
                                        size={12}
                                        color={item.metodoPago === 'whatsapp' ? '#25D366' : '#28a745'}
                                    />
                                </View>
                                <ThemedText style={styles.total}>{fmt(item.total || 0)}</ThemedText>
                            </View>

                            {/* Acciones rápidas */}
                            <View style={styles.accionesRow}>
                                {pagoPendiente && (
                                    <Pressable style={styles.btnConfirmar} onPress={() => handleConfirmarPago(item.id)}>
                                        <Ionicons name="cash-outline" size={14} color="#fff" />
                                        <ThemedText style={styles.btnConfirmarText}>Confirmar Pago</ThemedText>
                                    </Pressable>
                                )}
                                {item.estado === 'preparando' && (
                                    <Pressable style={styles.btnListo} onPress={() => handleCambiarEstado(item.id, 'listo')}>
                                        <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                                        <ThemedText style={styles.btnListoText}>Listo</ThemedText>
                                    </Pressable>
                                )}
                                {item.estado === 'listo' && (
                                    <Pressable style={styles.btnEntregado} onPress={() => handleCambiarEstado(item.id, 'entregado')}>
                                        <Ionicons name="home-outline" size={14} color="#fff" />
                                        <ThemedText style={styles.btnEntregadoText}>Entregado</ThemedText>
                                    </Pressable>
                                )}
                                {(item.estado === 'pendiente' || item.estado === 'preparando') && (
                                    <Pressable style={styles.btnCancelar} onPress={() => handleCambiarEstado(item.id, 'cancelado')}>
                                        <Ionicons name="close-circle-outline" size={14} color="#fff" />
                                        <ThemedText style={styles.btnCancelarText}>Cancelar</ThemedText>
                                    </Pressable>
                                )}
                            </View>
                        </Pressable>
                    );
                }}
                ListEmptyComponent={!loading && !errorMessage ? <ThemedText style={styles.empty}>No hay pedidos.</ThemedText> : null}
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
    empty: { textAlign: 'center', color: '#888', marginTop: 20 },
    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    input: { flex: 1, borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
    searchBtn: { backgroundColor: '#28a745', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
    searchBtnText: { color: '#fff', fontWeight: '700' },
    chipsRow: { gap: 6, paddingVertical: 4, marginBottom: 4 },
    chip: { borderRadius: 999, borderWidth: 1.5, borderColor: '#d1d5db', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fff' },
    chipActive: { backgroundColor: '#28a745', borderColor: '#28a745' },
    chipText: { color: '#374151', fontWeight: '600', fontSize: 12 },
    chipTextActive: { color: '#fff' },
    list: { flex: 1 },
    card: { borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 12, backgroundColor: '#fff', marginBottom: 8, gap: 6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    estadoBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    estadoText: { fontWeight: '600', fontSize: 11 },
    cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardInfoText: { color: '#555', fontSize: 13 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    pagoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pagoBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    total: { fontWeight: '700', fontSize: 16, color: '#28a745' },
    accionesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
    btnConfirmar: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#28a745', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    btnConfirmarText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    btnListo: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    btnListoText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    btnEntregado: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#059669', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    btnEntregadoText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    btnCancelar: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    btnCancelarText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    paginationRow: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    pageBtn: { backgroundColor: '#28a745', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    pageBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    pageLabel: { fontWeight: '600', color: '#333' },
});