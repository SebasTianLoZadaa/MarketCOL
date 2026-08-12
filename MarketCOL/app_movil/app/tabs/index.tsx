/**
 * Pantalla principal - MarketCOL
 * Muestra el catálogo de productos del supermercado MerkaCiro
 * Modalidad: Aliste y Recoja
 */

import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Pressable, Image, RefreshControl, ScrollView, StyleSheet, TextInput, View, Platform } from "react-native";
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from "@expo/vector-icons";
import catalogoService from "../../src/services/catalogoService";
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useCarrito } from '../../src/context/CarritoContext';

type CarritoCtx = {
    agregarProducto: (producto: unknown, cantidad: number) => Promise<void>;
    totalItems: number
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;
const ITEMS_POR_PAGINA = 15;

const FONTS = Platform.select({
    ios: { display: 'Avenir Next', body: 'Avenir Next' },
    android: { display: 'sans-serif-medium', body: 'sans-serif' },
    default: { display: 'System', body: 'System' },
}) || { display: 'System', body: 'System' };

const FEATURES = [
    { emoji: '🏪', title: 'Aliste y Recoja', desc: 'Sin filas ni esperas' },
    { emoji: '📱', title: 'Pago por WhatsApp', desc: 'Coordina tu pago' },
    { emoji: '🌿', title: 'Productos Frescos', desc: 'Calidad garantizada' },
    { emoji: '⚡', title: 'Pedido listo', desc: 'En minutos' },
] as const;

// NUEVO: componente para las opciones de categorías
const CategoryOptions = memo(function CategoryOptions({
    categorias,
    categoriasFiltradas,
    categoriaBusqueda,
    categoriaActiva,
    onCategoriaChange,
}: {
    categorias: any[];
    categoriasFiltradas: any[];
    categoriaBusqueda: string;
    categoriaActiva: string;
    onCategoriaChange: (id: string) => void;
}) {
    const lista = categoriaBusqueda.trim()
        ? categoriasFiltradas
        : categorias;

    if (lista.length === 0) {
        return (
            <ThemedText style={styles.filterEmptyText}>
                {categoriaBusqueda.trim()
                    ? 'No se encontraron categorías.'
                    : 'No hay categorías disponibles.'}
            </ThemedText>
        );
    }

    return (
        <>
            {lista.map((cat: any) => {
                const id = String(cat.id);
                const activa = categoriaActiva === id;

                return (
                    <Pressable
                        key={cat.id}
                        onPress={() => onCategoriaChange(id)}
                        style={[
                            styles.filterOptionChip,
                            activa && styles.filterOptionChipActive,
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.filterOptionChipText,
                                activa && styles.filterOptionChipTextActive,
                            ]}
                        >
                            {cat.nombre}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </>
    );
});

// NUEVO: componente para las subcategorías
const SubcategoryOptions = memo(function SubcategoryOptions({
    subcategorias,
    subcategoriaActiva,
    subcategoriasLoading,
    onSubcategoriaChange,
}: {
    subcategorias: any[];
    subcategoriaActiva: string;
    subcategoriasLoading: boolean;
    onSubcategoriaChange: (id: string) => void;
}) {
    if (subcategoriasLoading) {
        return (
            <View style={styles.filterLoadingRow}>
                <ActivityIndicator size="small" color="#C83A3A" />
                <ThemedText style={styles.filterEmptyText}>
                    Cargando subcategorías...
                </ThemedText>
            </View>
        );
    }

    if (subcategorias.length === 0) {
        return (
            <ThemedText style={styles.filterEmptyText}>
                No hay subcategorías para esta categoría.
            </ThemedText>
        );
    }

    return (
        <View style={styles.filterOptionsRow}>
            <Pressable
                onPress={() => onSubcategoriaChange('all')}
                style={[
                    styles.filterOptionChip,
                    subcategoriaActiva === 'all' &&
                        styles.filterOptionChipActive,
                ]}
            >
                <ThemedText
                    style={[
                        styles.filterOptionChipText,
                        subcategoriaActiva === 'all' &&
                            styles.filterOptionChipTextActive,
                    ]}
                >
                    Todas
                </ThemedText>
            </Pressable>

            {subcategorias.map((sub: any) => {
                const id = String(sub.id);
                const activa = subcategoriaActiva === id;

                return (
                    <Pressable
                        key={sub.id}
                        onPress={() => onSubcategoriaChange(id)}
                        style={[
                            styles.filterOptionChip,
                            activa && styles.filterOptionChipActive,
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.filterOptionChipText,
                                activa && styles.filterOptionChipTextActive,
                            ]}
                        >
                            {sub.nombre}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </View>
    );
});

// NUEVO: componente para estados del catálogo
const CatalogStatus = ({
    loading,
    errorMessage,
    hasProductos,
}: {
    loading: boolean;
    errorMessage: string;
    hasProductos: boolean;
}) => {
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#C83A3A" />
                <ThemedText style={styles.loadingText}>
                    Cargando catálogo...
                </ThemedText>
            </View>
        );
    }

    if (errorMessage) {
        return (
            <ThemedText style={styles.errorText}>
                {errorMessage}
            </ThemedText>
        );
    }

    if (!hasProductos) {
        return (
            <ThemedText style={styles.emptyText}>
                No hay productos para mostrar.
            </ThemedText>
        );
    }

    return null;
};



type CatalogHeaderProps = {
    productos: any[];
    categorias: any[];
    totalItems: number;
    busqueda: string;
    setBusqueda: (value: string) => void;
    categoriaActiva: string;
    onCategoriaChange: (id: string) => void;
    subcategorias: any[];
    subcategoriaActiva: string;
    onSubcategoriaChange: (id: string) => void;
    subcategoriasLoading: boolean;
    categoriaBusqueda: string;
    setCategoriaBusqueda: (value: string) => void;
    categoriasFiltradas: any[];
    productosFiltrados: any[];
    loading: boolean;
    errorMessage: string;
    hasProductos: boolean;
    onScrollToCatalog: () => void;
    onOpenCarrito: () => void;
};

const CatalogHeader = memo(function CatalogHeader({
    productos,
    categorias,
    totalItems,
    busqueda,
    setBusqueda,
    categoriaActiva,
    onCategoriaChange,
    subcategorias,
    subcategoriaActiva,
    onSubcategoriaChange,
    subcategoriasLoading,
    categoriaBusqueda,
    setCategoriaBusqueda,
    categoriasFiltradas,
    productosFiltrados,
    loading,
    errorMessage,
    hasProductos,
    onScrollToCatalog,
    onOpenCarrito,
}: CatalogHeaderProps) {
    return (
        <>
            <View style={styles.hero}>
                <View style={styles.heroBadge}>
                    <View style={styles.heroBadgeDot} />
                    <ThemedText style={styles.heroBadgeText}>Hoy no fio, mañana sí.</ThemedText>
                </View>
                <ThemedText style={styles.heroTitle}>
                    Tu mercado{'\n'}
                    <ThemedText style={styles.barrioTitle}>de barrio,</ThemedText>
                    {'\n'}en línea.
                </ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                    Selecciona tus productos, haz tu pedido y recógelo en MerkaCiro. Sin filas, sin esperas.
                </ThemedText>
                <View style={styles.heroStatsRow}>
                    <View style={styles.heroStat}>
                        <ThemedText style={styles.heroStatValue}>📦 {productos.length}</ThemedText>
                        <ThemedText style={styles.heroStatLabel}>Productos</ThemedText>
                    </View>
                    <View style={styles.heroStat}>
                        <ThemedText style={styles.heroStatValue}>🗂️ {categorias.length}</ThemedText>
                        <ThemedText style={styles.heroStatLabel}>Categorías</ThemedText>
                    </View>
                    <View style={styles.heroStat}>
                        <ThemedText style={styles.heroStatValue}>🛒 {totalItems}</ThemedText>
                        <ThemedText style={styles.heroStatLabel}>En carrito</ThemedText>
                    </View>
                </View>

                <View style={styles.heroButtonsRow}>
                    <Pressable style={styles.heroBtnPrimary} onPress={onScrollToCatalog}>
                        <ThemedText style={styles.heroBtnPrimaryText}>Ver catálogo</ThemedText>
                    </Pressable>
                    <Pressable style={styles.heroBtnSecondary} onPress={onOpenCarrito}>
                        <ThemedText style={styles.heroBtnSecondaryText}>Mi carrito</ThemedText>
                    </Pressable>
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresRow}>
                {FEATURES.map((f) => (
                    <View key={f.title} style={styles.featureCard}>
                        <View style={styles.featureIconCircle}>
                            <ThemedText style={styles.featureIconEmoji}>{f.emoji}</ThemedText>
                        </View>
                        <ThemedText style={styles.featureTitle}>{f.title}</ThemedText>
                        <ThemedText style={styles.featureDesc}>{f.desc}</ThemedText>
                    </View>
                ))}
            </ScrollView>
                <ThemedText style={styles.filterLabel}>Buscar  productos</ThemedText>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#9ca3af" />
                <TextInput
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChangeText={setBusqueda}
                    style={styles.searchInput}
                    placeholderTextColor="#9ca3af"
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {busqueda.length > 0 && (
                    <Pressable onPress={() => setBusqueda('')}>
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                    </Pressable>
                )}
            </View>

            <View style={styles.filterSection}>
                <ThemedText style={styles.filterLabel}>Buscar categorías</ThemedText>
                <View style={styles.filterInputBox}>
                    <Ionicons name="search-outline" size={16} color="#9ca3af" />
                    <TextInput
                        placeholder="Escribe una categoría..."
                        value={categoriaBusqueda}
                        onChangeText={setCategoriaBusqueda}
                        style={styles.filterInput}
                        placeholderTextColor="#9ca3af"
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                    {categoriaBusqueda.length > 0 ? (
                        <Pressable onPress={() => setCategoriaBusqueda('')}>
                            <Ionicons name="close-circle" size={16} color="#9ca3af" />
                        </Pressable>
                    ) : null}
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterOptionsScrollContent}
                >
                    <View style={styles.filterOptionsRow}>
                        <Pressable onPress={() => onCategoriaChange('all')} style={[styles.filterOptionChip, categoriaActiva === 'all' && styles.filterOptionChipActive]}>
                            <ThemedText style={[styles.filterOptionChipText, categoriaActiva === 'all' && styles.filterOptionChipTextActive]}>Todas</ThemedText>
                        </Pressable>
                        {categoriaBusqueda.trim().length > 0 ? (
                            categoriasFiltradas.length > 0 ? categoriasFiltradas.map((cat: any) => (
                                <Pressable
                                    key={cat.id}
                                    onPress={() => onCategoriaChange(String(cat.id))}
                                    style={[styles.filterOptionChip, categoriaActiva === String(cat.id) && styles.filterOptionChipActive]}>
                                    <ThemedText style={[styles.filterOptionChipText, categoriaActiva === String(cat.id) && styles.filterOptionChipTextActive]}>
                                        {cat.nombre}
                                    </ThemedText>
                                </Pressable>
                            )) : (
                                <ThemedText style={styles.filterEmptyText}>No se encontraron categorías.</ThemedText>
                            )
                        ) : categorias.length > 0 ? (
                            categorias.map((cat: any) => (
                                <Pressable
                                    key={cat.id}
                                    onPress={() => onCategoriaChange(String(cat.id))}
                                    style={[styles.filterOptionChip, categoriaActiva === String(cat.id) && styles.filterOptionChipActive]}>
                                    <ThemedText style={[styles.filterOptionChipText, categoriaActiva === String(cat.id) && styles.filterOptionChipTextActive]}>
                                        {cat.nombre}
                                    </ThemedText>
                                </Pressable>
                            ))
                        ) : (
                            <ThemedText style={styles.filterEmptyText}>No hay categorías disponibles.</ThemedText>
                        )}
                    </View>
                </ScrollView>
            </View>

            {categoriaActiva !== 'all' ? (
                <View style={styles.filterSection}>
                    <ThemedText style={styles.filterLabel}>Subcategorías</ThemedText>
                    {subcategoriasLoading ? (
                        <View style={styles.filterLoadingRow}>
                            <ActivityIndicator size="small" color="#C83A3A" />
                            <ThemedText style={styles.filterEmptyText}>Cargando subcategorías...</ThemedText>
                        </View>
                    ) : subcategorias.length > 0 ? (
                        <View style={styles.filterOptionsRow}>
                            <Pressable onPress={() => onSubcategoriaChange('all')} style={[styles.filterOptionChip, subcategoriaActiva === 'all' && styles.filterOptionChipActive]}>
                                <ThemedText style={[styles.filterOptionChipText, subcategoriaActiva === 'all' && styles.filterOptionChipTextActive]}>Todas</ThemedText>
                            </Pressable>
                            {subcategorias.map((sub: any) => (
                                <Pressable
                                    key={sub.id}
                                    onPress={() => onSubcategoriaChange(String(sub.id))}
                                    style={[styles.filterOptionChip, subcategoriaActiva === String(sub.id) && styles.filterOptionChipActive]}>
                                    <ThemedText style={[styles.filterOptionChipText, subcategoriaActiva === String(sub.id) && styles.filterOptionChipTextActive]}>
                                        {sub.nombre}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    ) : (
                        <ThemedText style={styles.filterEmptyText}>No hay subcategorías para esta categoría.</ThemedText>
                    )}
                </View>
            ) : null}

            <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Productos Disponibles</ThemedText>
                <ThemedText style={styles.sectionCount}>✨ {productosFiltrados.length} encontrados</ThemedText>
            </View>

            {loading && (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#C83A3A" />
                    <ThemedText style={styles.loadingText}>Cargando catálogo...</ThemedText>
                </View>
            )}
            {!loading && errorMessage ? <ThemedText style={styles.errorText}>{errorMessage}</ThemedText> : null}
            {!loading && !errorMessage && !hasProductos ? <ThemedText style={styles.emptyText}>No hay productos para mostrar.</ThemedText> : null}
        </>
    );
});

export default function HomeScreen() {
    const { agregarProducto, totalItems } = useCarrito() as CarritoCtx;
    const flatListRef = useRef<FlatList<any>>(null);
    const [productos, SetProductos] = useState<any[]>([]);
    const [categorias, SetCategorias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [categoriaActiva, setCategoriaActiva] = useState<any>('all');
    const [categoriaBusqueda, setCategoriaBusqueda] = useState('');
    const [subcategorias, setSubcategorias] = useState<any[]>([]);
    const [subcategoriaActiva, setSubcategoriaActiva] = useState<any>('all');
    const [subcategoriasLoading, setSubcategoriasLoading] = useState(false);
    const [productoDetalle, setProductoDetalle] = useState<any>(null);
    const [paginaActual, setPaginaActual] = useState(1);

    const routerPush = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);

    const handleAgregarAlCarrito = async (producto: any) => {
        if (!producto || producto.stock <= 0) {
            Alert.alert('Producto agotado', 'Este producto no está disponible por el momento.');
            return;
        }
        try {
            await agregarProducto(producto, 1);
            Alert.alert('Carrito', `${producto.nombre} agregado correctamente.`);
        } catch (error: unknown) {
            const msg = (error as { message?: string })?.message;
            Alert.alert('Error', msg || 'No se pudo agregar al carrito');
        }
    };

    const loadCatalogo = useCallback(async ({ isRefresh = false } = {}) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setErrorMessage('');
        try {
            const [productosRes, categoriasData] = await Promise.all([
                catalogoService.getProductos({ pagina: 1, limite: 200 }),
                catalogoService.getCategorias(),
            ]);
            const productosData = productosRes?.productos || productosRes || [];
            SetProductos(Array.isArray(productosData) ? productosData : []);
            SetCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        } catch (error: unknown) {
            const msg = (error as { message?: string })?.message;
            setErrorMessage(msg || 'No fue posible cargar el catálogo');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadSubcategorias = useCallback(async (categoriaId: string) => {
        if (!categoriaId || categoriaId === 'all') {
            setSubcategorias([]);
            setSubcategoriaActiva('all');
            return;
        }

        setSubcategoriasLoading(true);
        try {
            const data = await catalogoService.getSubcategoriasPorCategoria(categoriaId);
            setSubcategorias(Array.isArray(data) ? data : []);
            setSubcategoriaActiva('all');
        } catch (error: unknown) {
            const msg = (error as { message?: string })?.message;
            console.warn(msg || 'No se pudieron cargar las subcategorías');
            setSubcategorias([]);
            setSubcategoriaActiva('all');
        } finally {
            setSubcategoriasLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCatalogo();
    }, [loadCatalogo]);

    useFocusEffect(
        useCallback(() => {
            loadCatalogo();
            return undefined;
        }, [loadCatalogo])
    );

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, categoriaActiva, subcategoriaActiva]);

    useEffect(() => {
        if (categoriaActiva === 'all') {
            setSubcategorias([]);
            setSubcategoriaActiva('all');
            return;
        }
        loadSubcategorias(categoriaActiva);
    }, [categoriaActiva, loadSubcategorias]);

    const categoriasFiltradas = useMemo(() => {
        const termino = categoriaBusqueda.trim().toLowerCase();
        if (!termino) return [];
        return categorias.filter((cat: any) => cat.nombre?.toLowerCase().includes(termino));
    }, [categorias, categoriaBusqueda]);

    const productosFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return productos.filter((p: any) => {
            const coincideTexto =
                termino === '' ||
                p.nombre?.toLowerCase().includes(termino) ||
                p.descripcion?.toLowerCase().includes(termino);
            const coincideCategoria =
                categoriaActiva === 'all' ||
                String(p.categoriaId || p.categoria?.id) === categoriaActiva;
            const coincideSubcategoria =
                subcategoriaActiva === 'all' ||
                String(p.subcategoriaId || p.subcategoria?.id) === subcategoriaActiva;
            return coincideTexto && coincideCategoria && coincideSubcategoria;
        });
    }, [busqueda, categoriaActiva, subcategoriaActiva, productos]);

    const hasProductos = useMemo(() => productosFiltrados.length > 0, [productosFiltrados]);
    const totalPaginas = useMemo(() => Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA), [productosFiltrados, ITEMS_POR_PAGINA]);
    const productosVisibles = useMemo(
        () => productosFiltrados.slice((paginaActual - 1) * ITEMS_POR_PAGINA, paginaActual * ITEMS_POR_PAGINA),
        [productosFiltrados, paginaActual, ITEMS_POR_PAGINA]
    );

    const handleCategoriaChange = useCallback((value: string) => {
        setCategoriaActiva(value);
        setSubcategoriaActiva('all');
    }, []);

    const handleSubcategoriaChange = useCallback((value: string) => {
        setSubcategoriaActiva(value);
    }, []);

    const handleScrollToCatalog = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 420, animated: true });
    }, []);

    const handleOpenCarrito = useCallback(() => {
        routerPush('/tabs/carrito');
    }, []);

    const headerProps = useMemo(() => ({
        productos,
        categorias,
        totalItems,
        busqueda,
        setBusqueda,
        categoriaActiva,
        onCategoriaChange: handleCategoriaChange,
        subcategorias,
        subcategoriaActiva,
        onSubcategoriaChange: handleSubcategoriaChange,
        subcategoriasLoading,
        categoriaBusqueda,
        setCategoriaBusqueda,
        categoriasFiltradas,
        productosFiltrados,
        loading,
        errorMessage,
        hasProductos,
        onScrollToCatalog: handleScrollToCatalog,
        onOpenCarrito: handleOpenCarrito,
    }), [
        productos,
        categorias,
        totalItems,
        busqueda,
        categoriaActiva,
        subcategorias,
        subcategoriaActiva,
        subcategoriasLoading,
        categoriaBusqueda,
        categoriasFiltradas,
        productosFiltrados,
        loading,
        errorMessage,
        hasProductos,
        handleCategoriaChange,
        handleSubcategoriaChange,
        handleScrollToCatalog,
        handleOpenCarrito,
    ]);

    const ListFooter = () =>
        !loading && hasProductos && totalPaginas > 1 ? (
            <View style={styles.paginacionRow}>
                <Pressable
                    style={[styles.pagBtn, paginaActual === 1 && styles.pagBtnDisabled]}
                    onPress={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}>
                    <Ionicons name="chevron-back" size={15} color={paginaActual === 1 ? '#d1d5db' : '#C83A3A'} />
                    <ThemedText style={[styles.pagBtnText, paginaActual === 1 && styles.pagBtnTextDisabled]}>Anterior</ThemedText>
                </Pressable>
                <ThemedText style={styles.pagInfo}>{paginaActual} / {totalPaginas}</ThemedText>
                <Pressable
                    style={[styles.pagBtn, paginaActual === totalPaginas && styles.pagBtnDisabled]}
                    onPress={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}>
                    <ThemedText style={[styles.pagBtnText, paginaActual === totalPaginas && styles.pagBtnTextDisabled]}>Siguiente</ThemedText>
                    <Ionicons name="chevron-forward" size={15} color={paginaActual === totalPaginas ? '#d1d5db' : '#C83A3A'} />
                </Pressable>
            </View>
        ) : (
            <View style={{ height: 24 }} />
        );

    const renderProducto = ({ item: producto, index }: { item: any; index: number }) => (
        <View style={[styles.card, index % 2 === 0 ? { marginRight: CARD_GAP / 2 } : { marginLeft: CARD_GAP / 2 }]}>
            <Image
                source={{ uri: catalogoService.buildImageUrl(producto.imagen) }}
                style={styles.cardImage}
                resizeMode="cover"
            />
            {/* Badge de categoría */}
            <View style={styles.cardBadge}>
                <ThemedText style={styles.cardBadgeText} numberOfLines={1}>
                    {producto.Categoria?.nombre || producto.categoria?.nombre || 'Sin categoría'}
                </ThemedText>
            </View>
            {/* Badge de agotado */}
            {(producto.stock === 0 || producto.stock === '0') && (
                <View style={styles.cardBadgeAgotado}>
                    <ThemedText style={styles.cardBadgeAgotadoText}>Agotado</ThemedText>
                </View>
            )}
            <View style={styles.cardBody}>
                <ThemedText style={styles.cardNombre} numberOfLines={2}>{producto.nombre}</ThemedText>
                <ThemedText style={styles.cardPrecio}>${Number(producto.precio || 0).toLocaleString('es-CO')}</ThemedText>
                <View style={styles.cardActions}>
                    <Pressable style={styles.outlineBtn} onPress={() => setProductoDetalle(producto)}>
                        <ThemedText style={styles.outlineBtnText}>Ver</ThemedText>
                    </Pressable>
                    <Pressable style={styles.cartBtn} onPress={() => handleAgregarAlCarrito(producto)}>
                        <Ionicons name="cart" size={16} color="#fff" />
                    </Pressable>
                </View>
            </View>
        </View>
    );

    return (
        <>
            <FlatList
                ref={flatListRef}
                data={loading || !hasProductos ? [] : productosVisibles}
                keyExtractor={(item: any) => String(item.id)}
                numColumns={2}
                renderItem={renderProducto}
                ListHeaderComponent={<CatalogHeader {...headerProps} />}
                ListFooterComponent={<ListFooter />}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadCatalogo({ isRefresh: true })}
                        colors={['#C83A3A']}
                        tintColor="#C83A3A"
                    />
                }
            />

            {/* MODAL DETALLE */}
            <Modal visible={Boolean(productoDetalle)} transparent animationType="slide" onRequestClose={() => setProductoDetalle(null)}>
                <View style={styles.modalBackdrop}>
                    <ThemedView style={styles.modalCard}>
                        {productoDetalle ? (
                            <>
                                <Image
                                    source={{ uri: catalogoService.buildImageUrl(productoDetalle.imagen) }}
                                    style={styles.modalImage}
                                    resizeMode="cover"
                                />
                                <ThemedText style={styles.modalCategoria}>{productoDetalle.Categoria?.nombre || 'Sin categoría'}</ThemedText>
                                <ThemedText style={styles.modalTitle}>{productoDetalle.nombre}</ThemedText>
                                <ThemedText style={styles.modalDesc}>{productoDetalle.descripcion || 'Sin descripción disponible.'}</ThemedText>
                                <ThemedText style={styles.modalPrecio}>$ {Number(productoDetalle.precio || 0).toLocaleString('es-CO')}</ThemedText>
                                <View style={styles.modalStock}>
                                    <Ionicons name="cube-outline" size={14} color="#6b7280" />
                                    <ThemedText style={styles.modalStockText}>Stock disponible: {productoDetalle.stock ?? 'N/A'} unidades</ThemedText>
                                </View>
                                {productoDetalle.proveedor && (
                                    <ThemedText style={styles.modalProveedor}>
                                        Proveedor: {productoDetalle.proveedor.nombre}
                                    </ThemedText>
                                )}
                                <View style={styles.modalActions}>
                                    <Pressable style={[styles.outlineBtn, { flex: 1, paddingVertical: 12 }]} onPress={() => setProductoDetalle(null)}>
                                        <ThemedText style={styles.outlineBtnText}>Cerrar</ThemedText>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.primaryBtn, { flex: 2, paddingVertical: 12 }]}
                                        onPress={async () => {
                                            await handleAgregarAlCarrito(productoDetalle);
                                            setProductoDetalle(null);
                                        }}>
                                        <Ionicons name="cart" size={16} color="#fff" />
                                        <ThemedText style={styles.primaryBtnText}>Agregar al carrito</ThemedText>
                                    </Pressable>
                                </View>
                            </>
                        ) : null}
                    </ThemedView>
                </View>
            </Modal>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS (MarketCOL - Rojo corporativo)
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    content: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#F4F4F4' },

    // HERO
    barrioTitle: { color: '#C83A3A', fontSize: 30, fontWeight: '800', lineHeight: 36, fontFamily: FONTS.display, letterSpacing: -0.3 },
    hero: { borderRadius: 24, padding: 22, backgroundColor: '#302e2e', marginTop: 16, marginBottom: 16, gap: 12, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
    heroBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
    heroBadgeDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#C83A3A' },
    heroBadgeText: { color: '#FEE2E2', letterSpacing: 1.1, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', fontFamily: FONTS.body },
    heroTitle: { color: '#fff', fontSize: 30, fontWeight: '800', lineHeight: 36, fontFamily: FONTS.display, letterSpacing: -0.3 },
    heroSubtitle: { color: '#FDE8E8', fontSize: 14, lineHeight: 21, marginTop: 4, maxWidth: '90%', fontFamily: FONTS.body },
    heroStatsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    heroStat: { flex: 1, borderRadius: 14, padding: 14, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', gap: 2 },
    heroStatValue: { color: '#fff', fontWeight: '800', fontSize: 16, fontFamily: FONTS.display, textAlign: 'center' },
    heroStatLabel: { color: '#FDE8E8', fontSize: 11, fontFamily: FONTS.body },
    heroButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 18, flexWrap: 'wrap' },
    heroBtnPrimary: { flex: 1, minWidth: 140, borderRadius: 12, paddingVertical: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    heroBtnPrimaryText: { color: '#1A1A1A', fontWeight: '700', fontSize: 14, fontFamily: FONTS.body },
    heroBtnSecondary: { flex: 1, minWidth: 140, borderRadius: 12, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
    heroBtnSecondaryText: { color: '#fff', fontWeight: '700', fontSize: 14, fontFamily: FONTS.body },
    // FEATURES
    featuresRow: { gap: 10, paddingBottom: 4, marginBottom: 16 },
    featureCard: { width: 128, borderRadius: 16, padding: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E5E5', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 6 },
    featureIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2' },
    featureIconEmoji: { fontSize: 20 },
    featureTitle: { fontWeight: '700', fontSize: 13, color: '#1A1A1A', fontFamily: FONTS.display },
    featureDesc: { fontSize: 11, color: '#6B7280', fontFamily: FONTS.body },

    // BUSCADOR
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E5E5', paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    searchInput: { flex: 1, fontSize: 15, color: '#111827', padding: 0, fontFamily: FONTS.body },

    // BÚSQUEDA RÁPIDA
    filterSection: { marginBottom: 14, gap: 8 },
    filterLabel: { fontSize: 13, fontWeight: '700', color: '#374151', fontFamily: FONTS.display },
    filterInputBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5', gap: 8 },
    filterInput: { flex: 1, fontSize: 14, color: '#111827', padding: 0, fontFamily: FONTS.body },
    filterLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    filterOptionsScrollContent: { paddingRight: 4 },
    filterOptionsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    filterOptionChip: { borderRadius: 999, borderWidth: 1.2, borderColor: '#D1D5DB', paddingVertical: 7, paddingHorizontal: 12, backgroundColor: '#fff' },
    filterOptionChipActive: { backgroundColor: '#FEE2E2', borderColor: '#C83A3A' },
    filterOptionChipText: { color: '#374151', fontWeight: '600', fontSize: 12, fontFamily: FONTS.body },
    filterOptionChipTextActive: { color: '#C83A3A' },
    filterEmptyText: { color: '#6B7280', fontSize: 12, fontFamily: FONTS.body },

    // SUBCATEGORÍAS
    subcategorySection: { marginBottom: 16, gap: 8 },
    subcategoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    subcategoryTitle: { fontSize: 13, fontWeight: '700', color: '#374151', fontFamily: FONTS.display },
    subcategoryRow: { gap: 8, paddingVertical: 2 },
    subcategoryEmpty: { color: '#6B7280', fontSize: 12, fontFamily: FONTS.body },
    subchip: { borderRadius: 999, borderWidth: 1.2, borderColor: '#D1D5DB', paddingVertical: 7, paddingHorizontal: 12, backgroundColor: '#fff' },
    subchipActive: { backgroundColor: '#FEE2E2', borderColor: '#C83A3A' },
    subchipText: { color: '#374151', fontWeight: '600', fontSize: 12, fontFamily: FONTS.body },
    subchipTextActive: { color: '#C83A3A' },

    // CHIPS
    chipsRow: { gap: 8, paddingVertical: 4, marginBottom: 16 },
    chip: { borderRadius: 999, borderWidth: 1.5, borderColor: '#C83A3A', paddingVertical: 7, paddingHorizontal: 14, backgroundColor: '#fff' },
    chipActive: { backgroundColor: '#C83A3A', borderColor: '#C83A3A' },
    chipText: { color: '#374151', fontWeight: '600', fontSize: 13, fontFamily: FONTS.body },
    chipTextActive: { color: '#fff' },

    // SECCIÓN
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', fontFamily: FONTS.display },
    sectionCount: { fontSize: 12, color: '#6B7280', fontFamily: FONTS.body },

    // TARJETA PRODUCTO
    card: { width: CARD_WIDTH, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E5E5', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4, marginBottom: 10, overflow: 'hidden' },
    cardImage: { width: '100%', height: 130 },
    cardBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(200,58,58,0.92)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
    cardBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
    cardBadgeAgotado: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(239, 68, 68, 0.9)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
    cardBadgeAgotadoText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
    cardBody: { padding: 10, gap: 4 },
    cardNombre: { fontSize: 13, fontWeight: '700', color: '#111827', lineHeight: 18, fontFamily: FONTS.display },
    cardPrecio: { fontSize: 15, fontWeight: '800', color: '#C83A3A', marginTop: 2, fontFamily: FONTS.display },
    cardActions: { flexDirection: 'row', gap: 6, marginTop: 8 },

    // BOTONES
    outlineBtn: { borderRadius: 8, borderWidth: 1.5, borderColor: '#C83A3A', paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
    outlineBtnText: { color: '#C83A3A', fontWeight: '700', fontSize: 12, fontFamily: FONTS.body },
    cartBtn: { flex: 1, borderRadius: 8, backgroundColor: '#C83A3A', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
    primaryBtn: { borderRadius: 8, backgroundColor: '#C83A3A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12 },
    primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: FONTS.body },

    // ESTADOS
    centered: { paddingVertical: 32, alignItems: 'center', gap: 12 },
    loadingText: { color: '#6B7280', fontSize: 14, fontFamily: FONTS.body },
    errorText: { color: '#B83A3A', textAlign: 'center', marginVertical: 16, fontFamily: FONTS.body },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginVertical: 24, fontSize: 14, fontFamily: FONTS.body },

    // PAGINACIÓN
    paginacionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8, paddingHorizontal: 4 },
    pagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 1.5, borderColor: '#C83A3A', paddingHorizontal: 14, paddingVertical: 10 },
    pagBtnDisabled: { borderColor: '#d1d5db' },
    pagBtnText: { color: '#C83A3A', fontWeight: '600', fontSize: 13, fontFamily: FONTS.body },
    pagBtnTextDisabled: { color: '#9CA3AF' },
    pagInfo: { color: '#374151', fontWeight: '700', fontSize: 14, fontFamily: FONTS.display },

    // MODAL
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 10, backgroundColor: '#fff' },
    modalImage: { width: '100%', height: 220, borderRadius: 16 },
    modalCategoria: { fontSize: 11, color: '#C83A3A', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4, fontFamily: FONTS.body },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827', lineHeight: 28, fontFamily: FONTS.display },
    modalDesc: { fontSize: 14, color: '#6B7280', lineHeight: 21, fontFamily: FONTS.body },
    modalPrecio: { fontSize: 24, fontWeight: '800', color: '#C83A3A', fontFamily: FONTS.display },
    modalStock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    modalStockText: { fontSize: 13, color: '#6B7280', fontFamily: FONTS.body },
    modalProveedor: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', fontFamily: FONTS.body },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 8 },
});