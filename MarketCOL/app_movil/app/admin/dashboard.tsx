/**
 * Pantalla principal del panel de administrador y auxiliar - MarketCOL
 * Solo accesible para roles administrador y auxiliar.
 * Muestra tarjetas de estadísticas en tiempo real, accesos rápidos e información del sistema.
 */

import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/api/apiClient';
import { useAuth } from "../../src/context/AuthContext";

type AuthUser = { rol?: string; nombre?: string };

const push = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);

type StatCard = {
    title: string;
    value: number | string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
    route: string;
    show: boolean;
};

export default function AdminDashboardScreen() {
    const { user, isAuthenticated } = useAuth() as { user: AuthUser | null; isAuthenticated: boolean };
    const isAdmin = user?.rol === 'administrador';
    const isAux = user?.rol === 'auxiliar';

    const [stats, setStats] = useState({
        categorias: 0,
        subcategorias: 0,
        productos: 0,
        proveedores: 0,
        usuarios: 0,
        pedidos: 0,
        pendientes: 0,
        listos: 0,
        ventas: 0,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [cats, subs, prods, provs, orders] = await Promise.all([
                    apiClient.get('/admin/categorias'),
                    apiClient.get('/admin/subcategorias'),
                    apiClient.get('/admin/productos?limite=1'),
                    apiClient.get('/admin/proveedores'),
                    apiClient.get('/admin/pedidos/estadisticas'),
                ]);

                const userStats = isAdmin ? await apiClient.get('/admin/usuarios/stats') : null;

                const catsData = cats.data?.data?.categorias || [];
                const subsData = subs.data?.data?.subcategorias || [];
                const provsData = provs.data?.data?.proveedores || [];
                const ordStats = orders.data?.data || {};

                setStats({
                    categorias: Array.isArray(catsData) ? catsData.length : 0,
                    subcategorias: Array.isArray(subsData) ? subsData.length : 0,
                    productos: prods.data?.data?.paginacion?.total || 0,
                    proveedores: Array.isArray(provsData) ? provsData.length : 0,
                    usuarios: userStats?.data?.data?.stats?.totalUsuarios || 0,
                    pedidos: ordStats.totalPedidos || 0,
                    pendientes: ordStats.pedidosPorEstado?.find((e: any) => e.estado === 'pendiente')?.cantidad || 0,
                    listos: ordStats.pedidosPorEstado?.find((e: any) => e.estado === 'listo')?.cantidad || 0,
                    ventas: ordStats.ventasTotales || 0,
                });
            } catch (_) {
                // ignore
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated && (isAdmin || isAux)) load();
    }, [isAuthenticated, isAdmin, isAux]);

    if (!isAuthenticated || (!isAdmin && !isAux)) {
        return (
            <View style={styles.centered}>
                <Ionicons name="lock-closed" size={60} color="#ccc" />
                <Text style={styles.restrictedTitle}>Acceso Restringido</Text>
                <Text style={styles.restrictedSub}>Solo Administradores y Auxiliares</Text>
            </View>
        );
    }

    const cards: StatCard[] = [
        { title: 'Categorías',    value: stats.categorias,    icon: 'folder-outline',       color: '#28a745', bgColor: '#d1fae5', route: '/admin/categorias', show: true },
        { title: 'Subcategorías', value: stats.subcategorias, icon: 'folder-open-outline',  color: '#20c997', bgColor: '#d1fae5', route: '/admin/subcategorias', show: true },
        { title: 'Productos',     value: stats.productos,     icon: 'cube-outline',         color: '#10b981', bgColor: '#d1fae5', route: '/admin/productos', show: true },
        { title: 'Proveedores',   value: stats.proveedores,   icon: 'truck-outline',        color: '#0891b2', bgColor: '#cffafe', route: '/admin/proveedores', show: true },
        { title: 'Usuarios',      value: stats.usuarios,      icon: 'people-outline',       color: '#f59e0b', bgColor: '#fef3c7', route: '/admin/usuarios', show: isAdmin },
        { title: 'Pedidos',       value: stats.pedidos,       icon: 'cart-outline',         color: '#6b7280', bgColor: '#f3f4f6', route: '/admin/pedidos', show: true },
        { title: 'Pendientes',    value: stats.pendientes,    icon: 'time-outline',         color: '#f59e0b', bgColor: '#fef3c7', route: '/admin/pedidos?estado=pendiente', show: true },
        { title: 'Listos',        value: stats.listos,        icon: 'checkmark-circle-outline', color: '#28a745', bgColor: '#d1fae5', route: '/admin/pedidos?estado=listo', show: true },
    ];

    const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>MarketCOL</Text>
                        <Text style={styles.headerSub}>
                            Bienvenido, {user?.nombre || 'usuario'} · {isAdmin ? 'Administrador' : 'Auxiliar'}
                        </Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="speedometer-outline" size={32} color="#fff" />
                    </View>
                </View>
                <Text style={styles.headerDesc}>Panel de Administración - MerkaCiro</Text>
            </View>

            {/* GRID DE ESTADÍSTICAS */}
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#28a745" />
                    <Text style={styles.loadingText}>Cargando estadísticas...</Text>
                </View>
            ) : (
                <View style={styles.grid}>
                    {cards.filter(c => c.show).map((card) => (
                        <Pressable
                            key={card.title}
                            style={[styles.card, { backgroundColor: card.bgColor, borderLeftColor: card.color }]}
                            onPress={() => push(card.route)}>
                            <View style={styles.cardTop}>
                                <View>
                                    <Text style={[styles.cardLabel, { color: card.color }]}>{card.title}</Text>
                                    <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
                                </View>
                                <View style={[styles.cardIconWrap, { backgroundColor: card.color + '20' }]}>
                                    <Ionicons name={card.icon} size={28} color={card.color} />
                                </View>
                            </View>
                            <View style={styles.cardFooter}>
                                <Text style={[styles.cardFooterText, { color: card.color }]}>Ver detalles</Text>
                                <Ionicons name="arrow-forward" size={14} color={card.color} />
                            </View>
                        </Pressable>
                    ))}
                </View>
            )}

            {/* BANNER DE VENTAS */}
            {!loading && (
                <View style={styles.salesBanner}>
                    <View style={[styles.salesIconWrap, { backgroundColor: '#d1fae5' }]}>
                        <Ionicons name="trending-up-outline" size={22} color="#28a745" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.salesLabel}>Ventas Totales</Text>
                        <Text style={styles.salesValue}>{fmt(stats.ventas)}</Text>
                    </View>
                </View>
            )}

            {/* ACCESOS RÁPIDOS */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="flash" size={18} color="#fff" />
                    <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
                </View>
                <View style={styles.sectionBody}>
                    <Pressable style={[styles.actionBtn, { borderColor: '#28a745' }]} onPress={() => push('/admin/productos')}>
                        <Ionicons name="add-circle-outline" size={18} color="#28a745" />
                        <Text style={[styles.actionText, { color: '#28a745' }]}>Gestionar Productos</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, { borderColor: '#20c997' }]} onPress={() => push('/admin/proveedores')}>
                        <Ionicons name="truck-outline" size={18} color="#20c997" />
                        <Text style={[styles.actionText, { color: '#20c997' }]}>Gestionar Proveedores</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, { borderColor: '#f59e0b' }]} onPress={() => push('/admin/pedidos')}>
                        <Ionicons name="list-outline" size={18} color="#f59e0b" />
                        <Text style={[styles.actionText, { color: '#f59e0b' }]}>Gestionar Pedidos</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, { borderColor: '#6b7280' }]} onPress={() => push('/')}>
                        <Ionicons name="storefront-outline" size={18} color="#6b7280" />
                        <Text style={[styles.actionText, { color: '#6b7280' }]}>Visitar Tienda</Text>
                    </Pressable>
                </View>
            </View>

            {/* INFORMACIÓN DEL SISTEMA */}
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Información del Sistema</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                    <Text style={styles.infoText}>Sistema operativo correctamente</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="server-outline" size={16} color="#28a745" />
                    <Text style={styles.infoText}>API: http://10.0.2.2:5000</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#f59e0b" />
                    <Text style={styles.infoText}>Rol: {isAdmin ? 'Administrador' : 'Auxiliar'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="storefront-outline" size={16} color="#20c997" />
                    <Text style={styles.infoText}>MarketCOL v1.0 - MerkaCiro</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 32 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
    restrictedTitle: { fontSize: 22, fontWeight: '700', color: '#333' },
    restrictedSub: { color: '#888', fontSize: 14 },
    header: { borderRadius: 16, backgroundColor: '#28a745', padding: 20, gap: 8 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    headerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
    headerIcon: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 10 },
    loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 24 },
    loadingText: { color: '#666' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: {
        borderRadius: 14, padding: 16, width: '47%', gap: 10,
        borderLeftWidth: 3, backgroundColor: '#fff',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardLabel: { fontSize: 12, fontWeight: '500' },
    cardValue: { fontSize: 32, fontWeight: '800', marginTop: 2 },
    cardIconWrap: { borderRadius: 10, padding: 8 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardFooterText: { fontSize: 12, fontWeight: '500' },
    salesBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#fff', borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: '#e8e8e8',
    },
    salesIconWrap: { borderRadius: 10, padding: 10 },
    salesLabel: { fontSize: 12, color: '#888' },
    salesValue: { fontSize: 22, fontWeight: '800', color: '#28a745' },
    section: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e8e8e8' },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#28a745', padding: 14,
    },
    sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
    sectionBody: { backgroundColor: '#fff', padding: 14, gap: 10 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 2, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16,
    },
    actionText: { fontWeight: '600', fontSize: 14 },
    infoCard: {
        backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: '#e8e8e8', padding: 16, gap: 10,
    },
    infoTitle: { fontWeight: '700', fontSize: 15, color: '#222', marginBottom: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoText: { color: '#444', fontSize: 14 },
});