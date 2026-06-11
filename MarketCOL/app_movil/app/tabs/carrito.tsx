/**
 * Pantalla del carrito de compras - MarketCOL
 * Permite gestionar productos, cantidades y proceder al checkout
 * Modalidad: Aliste y Recoja
 */

import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '../../src/context/AuthContext';
import { useCarrito } from "../../src/context/CarritoContext";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import catalogoService from "../../src/services/catalogoService";

type CarritoCtx = {
    items: { id: string, nombre?: string, precio?: number, cantidad: number, imagen?: string, stock?: number }[];
    total: number;
    totalItems: number;
    loading: boolean;
    cambiarCantidad: (id: string, cantidad: number) => Promise<void>;
    eliminarItem: (id: string) => Promise<void>;
    vaciarCarrito: () => Promise<void>;
    refreshCarrito: () => Promise<void>;
};

const routerPush = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);
const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);

const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

export default function CarritoScreen() {
    const { isAuthenticated } = useAuth() as { isAuthenticated: boolean };
    const { items, total, loading, cambiarCantidad, eliminarItem, vaciarCarrito, refreshCarrito } = useCarrito() as CarritoCtx;
    const safeItems = items ?? [];

    useFocusEffect(
      useCallback(() => {
        refreshCarrito && refreshCarrito();
      }, [refreshCarrito])
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#28a745" />
                <Text style={styles.loadingText}>Cargando Carrito...</Text>
            </View>
        );
    }

    const handleIrACheckout = () => {
        if (!isAuthenticated) {
            Alert.alert(
                'Inicia Sesión',
                'Debes iniciar sesión para proceder al pago',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Iniciar Sesión', onPress: () => routerReplace('/tabs/explore') },
                ]
            );
            return;
        }
        routerPush('/checkout');
    };

    const handleVaciarCarrito = () => {
        Alert.alert(
            'Vaciar Carrito',
            '¿Estás seguro de que quieres vaciar el carrito?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Vaciar', style: 'destructive', onPress: () => vaciarCarrito() },
            ]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Encabezado */}
            <View style={styles.header}>
                <Ionicons name="cart" size={28} color="#28a745" />
                <Text style={styles.headerTitle}>Mi Carrito</Text>
            </View>

            {/* Banner informativo para no autenticados */}
            {!isAuthenticated && (
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle" size={18} color="#1d4ed8" />
                    <Text style={styles.infoBannerText}>
                        Puedes agregar productos sin iniciar sesión. Al momento de pagar deberás iniciar sesión.
                    </Text>
                </View>
            )}

            {safeItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={90} color="#ccc" />
                    <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
                    <Text style={styles.empty}>Agrega productos para comenzar tu compra</Text>
                    <Pressable style={styles.catalogBtn} onPress={() => routerReplace('/')}>
                        <Ionicons name="storefront-outline" size={16} color="#fff" />
                        <Text style={styles.catalogBtnText}>Ir al Catálogo</Text>
                    </Pressable>
                </View>
            ) : (
                <>
                    {/* Tarjeta de productos */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <Text style={styles.sectionTitle}>Productos en tu carrito</Text>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{safeItems.length}</Text>
                                </View>
                            </View>
                            <Pressable style={styles.vaciarBtn} onPress={handleVaciarCarrito}>
                                <Ionicons name="trash-outline" size={14} color="#b93a32" />
                                <Text style={styles.vaciarText}>Vaciar carrito</Text>
                            </Pressable>
                        </View>

                        {safeItems.map((item, index) => (
                            <View key={item.id}>
                                {index > 0 && <View style={styles.itemDivider} />}
                                <View style={styles.itemRow}>
                                    <Image
                                        source={{ 
                                            uri: item.imagen 
                                                ? catalogoService.buildImageUrl(item.imagen) 
                                                : 'https://via.placeholder.com/70'
                                        }}
                                        style={styles.image}
                                    />
                                    <View style={styles.itemBody}>
                                        <Text style={styles.itemName} numberOfLines={2}>{item.nombre}</Text>
                                        <Text style={styles.itemPrice}>{fmt(item.precio || 0)} c/u</Text>
                                        {/* Badge de stock bajo */}
                                        {item.stock !== undefined && item.stock <= 5 && item.stock > 0 && (
                                            <Text style={styles.stockBajo}>¡Últimas {item.stock} unidades!</Text>
                                        )}
                                        {item.stock === 0 && (
                                            <Text style={styles.stockAgotado}>Producto agotado</Text>
                                        )}
                                        <View style={styles.qtyRow}>
                                            <Pressable style={styles.qtyBtn} onPress={() => cambiarCantidad(item.id, Math.max(1, item.cantidad - 1))}>
                                                <Ionicons name="remove" size={14} color="#555" />
                                            </Pressable>
                                            <Text style={styles.qtyText}>{item.cantidad}</Text>
                                            <Pressable style={styles.qtyBtn} onPress={() => cambiarCantidad(item.id, item.cantidad + 1)}>
                                                <Ionicons name="add" size={14} color="#555" />
                                            </Pressable>
                                            <Text style={styles.subtotalItem}>{fmt((item.precio || 0) * item.cantidad)}</Text>
                                            <Pressable onPress={() => eliminarItem(item.id)} style={styles.trashBtn}>
                                                <Ionicons name="trash-outline" size={18} color="#b93a32" />
                                            </Pressable>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Tarjeta de resumen */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Resumen del Pedido</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal:</Text>
                            <Text style={styles.summaryValue}>{fmt(total)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Modalidad:</Text>
                            <Text style={styles.summaryVerde}>
                                <Ionicons name="storefront-outline" size={14} color="#28a745" /> Aliste y recoja
                            </Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total a pagar:</Text>
                            <Text style={styles.totalValue}>{fmt(total)}</Text>
                        </View>
                        <Pressable style={styles.checkoutBtn} onPress={handleIrACheckout}>
                            <Ionicons name="card-outline" size={18} color="#fff" />
                            <Text style={styles.checkoutText}>
                                {isAuthenticated ? 'Finalizar Pedido' : 'Iniciar Sesión para Pedir'}
                            </Text>
                        </Pressable>
                        <Pressable style={styles.continueBtn} onPress={() => routerReplace('/')}>
                            <Ionicons name="arrow-back-outline" size={16} color="#555" />
                            <Text style={styles.continueBtnText}>Seguir Comprando</Text>
                        </Pressable>
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 14, paddingBottom: 32 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    loadingText: { color: '#666', fontSize: 15 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
    headerTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e' },
    infoBanner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#dbeafe', borderRadius: 10, padding: 12,
        borderLeftWidth: 4, borderLeftColor: '#3b82f6',
    },
    infoBannerText: { flex: 1, color: '#1e40af', fontSize: 13, lineHeight: 19 },
    emptyContainer: { alignItems: 'center', paddingVertical: 48, gap: 12 },
    emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333' },
    empty: { color: '#888', textAlign: 'center', fontSize: 14, lineHeight: 22 },
    catalogBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderRadius: 10, backgroundColor: '#28a745',
        paddingHorizontal: 22, paddingVertical: 13, marginTop: 4,
    },
    catalogBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    sectionCard: {
        backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: '#e8e8e8', overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
        backgroundColor: '#fafafa',
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontWeight: '700', fontSize: 14, color: '#222' },
    badge: { backgroundColor: '#28a745', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    vaciarBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderColor: '#b93a32', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 5,
    },
    vaciarText: { color: '#b93a32', fontSize: 12, fontWeight: '600' },
    itemDivider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 14 },
    itemRow: { flexDirection: 'row', padding: 14, gap: 12 },
    image: { width: 72, height: 72, borderRadius: 10 },
    itemBody: { flex: 1, gap: 3 },
    itemName: { fontWeight: '700', fontSize: 14, color: '#222', lineHeight: 19 },
    itemPrice: { color: '#777', fontSize: 13 },
    stockBajo: { color: '#e67e22', fontSize: 11, fontWeight: '600' },
    stockAgotado: { color: '#e74c3c', fontSize: 11, fontWeight: '600' },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    qtyBtn: {
        width: 28, height: 28, borderRadius: 7,
        borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fafafa',
        alignItems: 'center', justifyContent: 'center',
    },
    qtyText: { minWidth: 22, textAlign: 'center', fontWeight: '700', fontSize: 14, color: '#222' },
    subtotalItem: { flex: 1, fontWeight: '700', color: '#28a745', fontSize: 14 },
    trashBtn: { padding: 4 },
    summaryCard: {
        backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: '#e8e8e8', padding: 16, gap: 10,
    },
    summaryTitle: { fontWeight: '700', fontSize: 16, color: '#222', marginBottom: 2 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { color: '#555', fontSize: 14 },
    summaryValue: { color: '#333', fontSize: 14, fontWeight: '500' },
    summaryMuted: { color: '#aaa', fontSize: 14 },
    summaryVerde: { color: '#28a745', fontSize: 14, fontWeight: '500' },
    separator: { height: 1, backgroundColor: '#e8e8e8', marginVertical: 2 },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#222' },
    totalValue: { fontSize: 24, fontWeight: '800', color: '#28a745' },
    checkoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderRadius: 10, backgroundColor: '#28a745',
        paddingVertical: 14, marginTop: 4,
    },
    checkoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    continueBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderRadius: 10, borderWidth: 1, borderColor: '#ccc',
        paddingVertical: 12,
    },
    continueBtnText: { color: '#555', fontWeight: '600', fontSize: 14 },
});