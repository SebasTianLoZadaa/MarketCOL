/**
 * Gestión de productos - Panel de administración - MarketCOL
 * Lista todos los productos con búsqueda, filtro por categoría y paginación.
 * Permite activar/desactivar y eliminar productos.
 * Administrador y auxiliar pueden gestionar; la eliminación sigue siendo solo admin.
 * Muestra proveedor asociado y estado de stock.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { activarProducto, desactivarProducto, deleteProduct } from '../../src/services/adminService';
import { useAuth } from '../../src/context/AuthContext';
import catalogoService from '../../src/services/catalogoService';

type Producto = {
    id?: number;
    nombre?: string;
    descripcion?: string;
    precio?: number;
    stock?: number;
    imagen?: string;
    activo?: boolean;
    categoria?: { nombre?: string };
    proveedor?: { nombre?: string };
};

type Categoria = {
    id: number;
    nombre: string;
};

const push = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);
const pushParams = (pathname: string, params: Record<string, string>) => 
    (router as unknown as { push: (p: { pathname: string; params: Record<string, string> }) => void }).push({ pathname, params });

const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

export default function AdminProductosScreen() {
    const { user } = useAuth() as { user?: { rol?: string } };
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const didMountRef = useRef(false);

    const isAdmin = user?.rol === 'administrador';
    const canManageProductos = isAdmin || user?.rol === 'auxiliar';

    useEffect(() => {
        // Cargar categorías para los filtros
        apiClient.get('/admin/categorias?activo=true')
            .then(res => setCategorias(res.data?.data?.categorias || []))
            .catch(() => {});
    }, []);

    const fetchProductos = useCallback(async (page = 1, search = '', categoria = filtroCategoria) => {
        setLoading(true);
        setErrorMessage('');
        try {
            const params: string[] = [];
            if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`);
            if (categoria) params.push(`categoriaId=${categoria}`);
            params.push(`pagina=${page}`);
            params.push(`limite=10`);
            const url = `/admin/productos?${params.join('&')}`;
            const res = await apiClient.get(url);
            const productosData: Producto[] = res.data?.data?.productos || [];
            setProductos(productosData);
            setPagina(page);
            setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
        } catch (error: unknown) {
            setErrorMessage((error as { message?: string })?.message || 'Error al cargar productos');
        } finally {
            setLoading(false);
        }
    }, [filtroCategoria]);

    useEffect(() => {
        fetchProductos(1, '');
    }, [fetchProductos]);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        searchDebounceRef.current = setTimeout(() => {
            fetchProductos(1, busqueda, filtroCategoria);
        }, 300);

        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, [busqueda, filtroCategoria, fetchProductos]);

    const handlePagina = (next: number) => {
        const nueva = Math.max(1, Math.min(totalPaginas, pagina + next));
        fetchProductos(nueva, busqueda);
    };

    const getStockBadge = (stock: number) => {
        if (stock === 0) return { color: '#ef4444', bg: '#fee2e2', label: 'Agotado' };
        if (stock <= 10) return { color: '#f59e0b', bg: '#fef3c7', label: `Bajo: ${stock}` };
        return { color: '#28a745', bg: '#d1fae5', label: `Stock: ${stock}` };
    };

    return (
        <View style={styles.container}>
            <ThemedText type="title">Productos</ThemedText>

            {/* BARRA DE BÚSQUEDA */}
            <View style={styles.searchRow}>
                <TextInput
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChangeText={(text) => { setBusqueda(text); fetchProductos(1, text); }}
                    style={styles.input}
                />
                <Pressable style={styles.searchBtn} onPress={() => fetchProductos(1, busqueda)}>
                    <Ionicons name="search" size={18} color="#fff" />
                </Pressable>
            </View>

            <FlatList
                data={productos}
                keyExtractor={(item) => String(item.id)}
                ListHeaderComponent={() => (
                    <>

                        {canManageProductos && (
                            <Pressable style={styles.createBtn} onPress={() => push('/admin/producto-form')}>
                                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                                <ThemedText style={styles.createBtnText}>Crear producto</ThemedText>
                            </Pressable>
                        )}

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                            <Pressable
                                onPress={() => { setFiltroCategoria(''); fetchProductos(1, busqueda, ''); }}
                                style={[styles.chip, filtroCategoria === '' && styles.chipActive]}>
                                <ThemedText style={[styles.chipText, filtroCategoria === '' && styles.chipTextActive]}>Todos</ThemedText>
                            </Pressable>
                            {categorias.map((cat) => (
                                <Pressable
                                    key={cat.id}
                                    onPress={() => { setFiltroCategoria(String(cat.id)); fetchProductos(1, busqueda, String(cat.id)); }}
                                    style={[styles.chip, filtroCategoria === String(cat.id) && styles.chipActive]}>
                                    <ThemedText style={[styles.chipText, filtroCategoria === String(cat.id) && styles.chipTextActive]}>
                                        {cat.nombre}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </ScrollView>

                        {loading ? (
                            <View style={styles.centered}>
                                <ActivityIndicator size="large" color="#28a745" />
                                <ThemedText>Cargando productos...</ThemedText>
                            </View>
                        ) : null}

                        {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}
                    </>
                )}
                renderItem={({ item }) => {
                    const stockInfo = getStockBadge(item.stock || 0);
                    return (
                        <View style={styles.card}>
                            <Pressable
                                style={{ flex: 1, flexDirection: 'row', gap: 10 }}
                                onPress={() => pushParams('/admin/producto-form', { producto: JSON.stringify(item) })}>
                                <Image
                                    source={{ uri: catalogoService.buildImageUrl(item.imagen || '') }}
                                    style={styles.image}
                                />
                                <View style={styles.cardBody}>
                                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.nombre}</ThemedText>
                                    <ThemedText numberOfLines={1} style={styles.desc}>{item.descripcion || 'Sin descripción'}</ThemedText>
                                {/*proveedor */}
                                    {item.proveedor?.nombre && (
                                        <View style={styles.proveedorRow}>
                                            <Ionicons name="truck-outline" size={11} color="#888" />
                                            <ThemedText style={styles.proveedorText}>{item.proveedor.nombre}</ThemedText>
                                        </View>
                                    )}
                                {/*categoria */}
                                    {item.categoria?.nombre && (
                                        <View style={styles.categoriaBadge}>
                                            <ThemedText style={styles.categoriaBadgeText}>{item.categoria.nombre}</ThemedText>
                                        </View>
                                    )}

                                    <View style={styles.priceRow}>
                                        <ThemedText style={styles.price}>{fmt(item.precio || 0)}</ThemedText>
                                        <View style={[styles.stockBadge, { backgroundColor: stockInfo.bg }]}>
                                            <ThemedText style={[styles.stockBadgeText, { color: stockInfo.color }]}>
                                                {stockInfo.label}
                                            </ThemedText>
                                        </View>
                                    </View>

                                    <View style={styles.estadoRow}>
                                        <View style={[styles.estadoDot, { backgroundColor: item.activo ? '#28a745' : '#ef4444' }]} />
                                        <ThemedText style={styles.estadoText}>{item.activo ? 'Activo' : 'Inactivo'}</ThemedText>
                                    </View>
                                </View>
                            </Pressable>

                            {/*botones de accion*/}
                            {canManageProductos && (
                                <View style={styles.actionsCol}>
                                    <Pressable
                                        style={[styles.actionBtn, { backgroundColor: item.activo ? '#f59e0b' : '#28a745' }]}
                                        onPress={async () => {
                                            try {
                                                if (item.activo) {
                                                    await desactivarProducto(item.id!);
                                                } else {
                                                    await activarProducto(item.id!);
                                                }
                                                fetchProductos(pagina, busqueda);
                                            } catch {
                                                Alert.alert('Error', 'No se pudo cambiar el estado');
                                            }
                                        }}>
                                        <Ionicons name={item.activo ? 'eye-off-outline' : 'eye-outline'} size={14} color="#fff" />
                                    </Pressable>
                                    {isAdmin && (
                                        <Pressable
                                            style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                                            onPress={() => {
                                                Alert.alert('Eliminar producto', 'no se puede eliminar producto, ingresa desde la página web');
                                            }}>
                                            <Ionicons name="trash-outline" size={14} color="#fff" />
                                        </Pressable>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={!loading && !errorMessage ? <ThemedText style={styles.empty}>No hay productos.</ThemedText> : null}
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
    container: { flex: 1, padding: 16 },
    centered: { alignItems: 'center', gap: 10, marginVertical: 20 },
    error: { color: '#ef4444' },
    empty: { textAlign: 'center', color: '#888', marginTop: 20 },
    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
    searchBtn: { backgroundColor: '#dc2626', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
    
    // Chips boton
    chipsRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, marginBottom: 12, alignItems: 'center' },
    chip: { alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', minHeight: 38, minWidth: 72, borderRadius: 999, borderWidth: 1.5, borderColor: '#d1d5db', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fff' },
    chipActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
    chipText: { color: '#374151', fontWeight: '600', fontSize: 15, lineHeight: 20 },
    chipTextActive: { color: '#fff' },

    createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 14, minHeight: 50, marginBottom: 12 },
    createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    list: { flex: 1, marginTop: 0 },
    
    // Card
    card: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: '#f3d4d4', borderRadius: 12, padding: 10, backgroundColor: '#fff', marginBottom: 8, alignItems: 'center' },
    image: { width: 70, height: 70, borderRadius: 10 },
    cardBody: { flex: 1, gap: 2 },
    desc: { color: '#6b7280', fontSize: 12 },
    proveedorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    proveedorText: { color: '#6b7280', fontSize: 11 },
    categoriaBadge: { alignSelf: 'flex-start', backgroundColor: '#fee2e2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
    categoriaBadgeText: { color: '#b91c1c', fontSize: 10, fontWeight: '600' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
    price: { fontWeight: '700', fontSize: 16, color: '#dc2626' },
    stockBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
    stockBadgeText: { fontWeight: '600', fontSize: 11 },
    estadoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    estadoDot: { width: 8, height: 8, borderRadius: 4 },
    estadoText: { color: '#6b7280', fontSize: 11 },

    // Acciones
    actionsCol: { flexDirection: 'column', gap: 6, marginLeft: 8 },
    actionBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },

    // Paginación
    paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
    pageBtn: { backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
    pageLabel: { fontWeight: '600', color: '#333' },
});