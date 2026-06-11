/**
 * Detalle de un pedido específico para el administrador - MarketCOL
 * Recibe el parámetro dinámico id desde la URL.
 * Permite confirmar pago, cambiar estado y ver detalles completos.
 */

import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from "expo-router";
import { ThemedText } from '../../../components/themed-text';
import apiClient from '../../../src/api/apiClient';

type Detalle = {
    producto?: { nombre?: string; imagen?: string };
    cantidad?: number;
    precioUnitario?: number;
    subtotal?: number;
};

type Pedido = {
    id: number;
    estado?: string;
    estadoPago?: string;
    metodoPago?: string;
    modalidadEntrega?: string;
    total?: number;
    createdAt?: string;
    telefono?: string;
    notas?: string;
    usuario?: { nombre?: string; apellido?: string; email?: string; cedula?: string };
    detalles?: Detalle[];
};

const getEstadoBadge = (estado: string) => {
    const mapping: Record<string, { bg: string; color: string; label: string; icon: string }> = {
        pendiente:  { bg: '#fef3c7', color: '#f59e0b', label: 'Pendiente', icon: 'time-outline' },
        preparando: { bg: '#dbeafe', color: '#3b82f6', label: 'Preparando', icon: 'construct-outline' },
        listo:      { bg: '#d1fae5', color: '#28a745', label: 'Listo para recoger', icon: 'checkmark-circle-outline' },
        entregado:  { bg: '#d1fae5', color: '#059669', label: 'Entregado', icon: 'home-outline' },
        cancelado:  { bg: '#fee2e2', color: '#ef4444', label: 'Cancelado', icon: 'close-circle-outline' },
    };
    return mapping[estado] || { bg: '#f3f4f6', color: '#6b7280', label: estado || '—', icon: 'help-circle-outline' };
};

const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

const formatDate = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};

export default function AdminPedidoDetalleScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [cambiando, setCambiando] = useState(false);

    const fetchPedido = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const res = await apiClient.get(`/admin/pedidos/${id}`);
            setPedido(res.data?.data?.pedido || null);
        } catch (error: unknown) {
            setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar el pedido');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPedido();
    }, [id]);

    const confirmarPago = async () => {
        setCambiando(true);
        try {
            await apiClient.put(`/admin/pedidos/${id}/confirmar-pago`);
            await fetchPedido();
        } catch {
            Alert.alert('Error', 'No se pudo confirmar el pago');
        } finally {
            setCambiando(false);
        }
    };

    const cambiarEstado = async (nuevoEstado: string) => {
        setCambiando(true);
        try {
            await apiClient.put(`/admin/pedidos/${id}/estado`, { estado: nuevoEstado });
            await fetchPedido();
        } catch {
            Alert.alert('Error', 'No se pudo cambiar el estado');
        } finally {
            setCambiando(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#28a745" />
                <ThemedText>Cargando pedido...</ThemedText>
            </View>
        );
    }

    if (errorMessage || !pedido) {
        return (
            <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={60} color="#ef4444" />
                <ThemedText style={styles.errorText}>{errorMessage || 'No se encontró el pedido.'}</ThemedText>
            </View>
        );
    }

    const estadoInfo = getEstadoBadge(pedido.estado || 'pendiente');
    const pagoPendiente = pedido.estadoPago === 'pendiente';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <ThemedText type="title">Pedido #{pedido.id}</ThemedText>
                    <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.bg }]}>
                        <Ionicons name={estadoInfo.icon as any} size={14} color={estadoInfo.color} />
                        <ThemedText style={[styles.estadoText, { color: estadoInfo.color }]}>
                            {estadoInfo.label}
                        </ThemedText>
                    </View>
                </View>
                <ThemedText style={styles.fecha}>{formatDate(pedido.createdAt)}</ThemedText>
            </View>

            {/* ESTADO DE PAGO */}
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <ThemedText style={styles.cardLabel}>Estado de Pago</ThemedText>
                    <View style={[styles.pagoBadge, { backgroundColor: pagoPendiente ? '#fef3c7' : '#d1fae5' }]}>
                        <Ionicons
                            name={pagoPendiente ? 'time-outline' : 'checkmark-circle'}
                            size={14}
                            color={pagoPendiente ? '#f59e0b' : '#28a745'}
                        />
                        <ThemedText style={{ color: pagoPendiente ? '#f59e0b' : '#28a745', fontWeight: '600', fontSize: 13 }}>
                            {pagoPendiente ? 'Pendiente' : 'Confirmado'}
                        </ThemedText>
                    </View>
                </View>
                <View style={styles.cardRow}>
                    <ThemedText style={styles.cardLabel}>Método de Pago</ThemedText>
                    <View style={styles.valorRow}>
                        <Ionicons
                            name={pedido.metodoPago === 'whatsapp' ? 'logo-whatsapp' : 'cash-outline'}
                            size={14}
                            color={pedido.metodoPago === 'whatsapp' ? '#25D366' : '#28a745'}
                        />
                        <ThemedText>{pedido.metodoPago === 'whatsapp' ? 'WhatsApp' : 'Efectivo'}</ThemedText>
                    </View>
                </View>
                <View style={styles.cardRow}>
                    <ThemedText style={styles.cardLabel}>Modalidad</ThemedText>
                    <View style={styles.valorRow}>
                        <Ionicons name="storefront-outline" size={14} color="#28a745" />
                        <ThemedText style={{ color: '#28a745' }}>Aliste y recoja</ThemedText>
                    </View>
                </View>
                <View style={styles.cardRow}>
                    <ThemedText style={styles.cardLabel}>Teléfono</ThemedText>
                    <ThemedText>{pedido.telefono || '—'}</ThemedText>
                </View>
                {pedido.notas ? (
                    <View style={styles.cardRow}>
                        <ThemedText style={styles.cardLabel}>Notas</ThemedText>
                        <ThemedText style={styles.notas}>{pedido.notas}</ThemedText>
                    </View>
                ) : null}
            </View>

            {/* CLIENTE */}
            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={16} color="#28a745" />
                    <ThemedText type="defaultSemiBold">Cliente</ThemedText>
                </View>
                <ThemedText style={styles.clienteNombre}>
                    {pedido.usuario?.nombre} {pedido.usuario?.apellido}
                </ThemedText>
                <ThemedText style={styles.clienteInfo}>{pedido.usuario?.email}</ThemedText>
                {pedido.usuario?.cedula ? (
                    <ThemedText style={styles.clienteInfo}>Cédula: {pedido.usuario.cedula}</ThemedText>
                ) : null}
            </View>

            {/* PRODUCTOS */}
            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="cube-outline" size={16} color="#28a745" />
                    <ThemedText type="defaultSemiBold">Productos</ThemedText>
                </View>
                {pedido.detalles?.length ? (
                    pedido.detalles.map((detalle, index) => (
                        <View key={index} style={[styles.productRow, index > 0 && styles.productBorder]}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.productName}>
                                    {detalle.producto?.nombre || 'Producto'}
                                </ThemedText>
                                <ThemedText style={styles.productQty}>
                                    {detalle.cantidad} x {fmt(detalle.precioUnitario || 0)}
                                </ThemedText>
                            </View>
                            <ThemedText style={styles.productSubtotal}>
                                {fmt(detalle.subtotal || (detalle.precioUnitario || 0) * (detalle.cantidad || 0))}
                            </ThemedText>
                        </View>
                    ))
                ) : (
                    <ThemedText style={styles.emptyText}>No hay productos en este pedido.</ThemedText>
                )}
                <View style={styles.totalRow}>
                    <ThemedText style={styles.totalLabel}>Total</ThemedText>
                    <ThemedText style={styles.totalValue}>{fmt(pedido.total || 0)}</ThemedText>
                </View>
            </View>

            {/* ACCIONES */}
            <View style={styles.accionesCard}>
                <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>Acciones</ThemedText>
                
                <View style={styles.accionesGrid}>
                    {/* Confirmar Pago */}
                    {pagoPendiente && (
                        <Pressable
                            style={[styles.btnAccion, styles.btnConfirmar]}
                            onPress={confirmarPago}
                            disabled={cambiando}>
                            <Ionicons name="cash-outline" size={18} color="#fff" />
                            <ThemedText style={styles.btnAccionText}>Confirmar Pago</ThemedText>
                        </Pressable>
                    )}

                    {/* Preparando */}
                    {pedido.estado === 'pendiente' && !pagoPendiente && (
                        <Pressable
                            style={[styles.btnAccion, styles.btnPreparando]}
                            onPress={() => cambiarEstado('preparando')}
                            disabled={cambiando}>
                            <Ionicons name="construct-outline" size={18} color="#fff" />
                            <ThemedText style={styles.btnAccionText}>Preparando</ThemedText>
                        </Pressable>
                    )}

                    {/* Listo */}
                    {pedido.estado === 'preparando' && (
                        <Pressable
                            style={[styles.btnAccion, styles.btnListo]}
                            onPress={() => cambiarEstado('listo')}
                            disabled={cambiando}>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                            <ThemedText style={styles.btnAccionText}>Listo</ThemedText>
                        </Pressable>
                    )}

                    {/* Entregado */}
                    {pedido.estado === 'listo' && (
                        <Pressable
                            style={[styles.btnAccion, styles.btnEntregado]}
                            onPress={() => cambiarEstado('entregado')}
                            disabled={cambiando}>
                            <Ionicons name="home-outline" size={18} color="#fff" />
                            <ThemedText style={styles.btnAccionText}>Entregado</ThemedText>
                        </Pressable>
                    )}

                    {/* Cancelar */}
                    {(pedido.estado === 'pendiente' || pedido.estado === 'preparando') && (
                        <Pressable
                            style={[styles.btnAccion, styles.btnCancelar]}
                            onPress={() => cambiarEstado('cancelado')}
                            disabled={cambiando}>
                            <Ionicons name="close-circle-outline" size={18} color="#fff" />
                            <ThemedText style={styles.btnAccionText}>Cancelar</ThemedText>
                        </Pressable>
                    )}
                </View>

                {cambiando && (
                    <View style={styles.cambiandoRow}>
                        <ActivityIndicator size="small" color="#28a745" />
                        <ThemedText style={{ color: '#28a745' }}>Procesando...</ThemedText>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 14, paddingBottom: 32 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
    errorText: { color: '#ef4444', fontSize: 16, textAlign: 'center' },
    
    // Header
    header: { backgroundColor: '#28a745', borderRadius: 16, padding: 20, gap: 6 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    estadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
    estadoText: { fontWeight: '600', fontSize: 12 },
    fecha: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },

    // Card genérica
    card: { borderRadius: 12, padding: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', gap: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardLabel: { color: '#6b7280', fontSize: 13 },
    valorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    notas: { color: '#555', fontStyle: 'italic', flex: 1, textAlign: 'right' },
    
    // Pago
    pagoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    
    // Cliente
    clienteNombre: { fontWeight: '600', fontSize: 16 },
    clienteInfo: { color: '#555', fontSize: 13 },
    
    // Productos
    productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    productBorder: { borderTopWidth: 1, borderColor: '#f3f4f6' },
    productName: { fontWeight: '500' },
    productQty: { color: '#888', fontSize: 12 },
    productSubtotal: { fontWeight: '600', color: '#28a745' },
    emptyText: { color: '#888', textAlign: 'center', paddingVertical: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 10, marginTop: 4 },
    totalLabel: { fontWeight: '700', fontSize: 16 },
    totalValue: { fontWeight: '800', fontSize: 22, color: '#28a745' },

    // Acciones
    accionesCard: { borderRadius: 12, padding: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
    accionesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    btnAccion: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16,
        minWidth: '45%', flex: 1,
    },
    btnAccionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    btnConfirmar: { backgroundColor: '#28a745' },
    btnPreparando: { backgroundColor: '#3b82f6' },
    btnListo: { backgroundColor: '#28a745' },
    btnEntregado: { backgroundColor: '#059669' },
    btnCancelar: { backgroundColor: '#ef4444' },
    cambiandoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
});