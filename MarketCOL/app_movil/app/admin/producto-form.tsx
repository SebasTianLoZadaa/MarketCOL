/**
 * Formulario para crear o editar un producto - MarketCOL
 * Modo crear: desde botón "+" en admin/productos.
 * Modo editar: al presionar un producto en la lista.
 * Permite seleccionar categoría, subcategoría y proveedor.
 */

import { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, Modal, View, Pressable, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { createProduct, updateProduct } from '../../src/services/adminService';
import apiClient from '../../src/api/apiClient';

type Producto = {
    id?: string;
    nombre?: string;
    descripcion?: string;
    precio?: number;
    stock?: number;
    imagen?: string;
    categoriaId?: string;
    subcategoriaId?: string;
    proveedorId?: string;
};

type Categoria = { id?: string; nombre?: string };
type Proveedor = { id?: string; nombre?: string };

export default function AdminProductoForm() {
    const router = useRouter();
    const params = useLocalSearchParams<{ producto?: string }>();

    let producto: Producto | undefined;
    if (params.producto) {
        try { producto = JSON.parse(params.producto) as Producto; }
        catch { producto = undefined; }
    }

    const editing = !!producto;

    const [nombre, setNombre] = useState(producto?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
    const [precio, setPrecio] = useState(producto?.precio?.toString() ?? '');
    const [stock, setStock] = useState(producto?.stock?.toString() ?? '');
    const [imagen, setImagen] = useState(producto?.imagen ?? '');
    const [loading, setLoading] = useState(false);

    // Categoría
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [categoriaId, setCategoriaId] = useState(producto?.categoriaId ?? '');
    const [categoriaModalVisible, setCategoriaModalVisible] = useState(false);
    const [loadingCategorias, setLoadingCategorias] = useState(false);

    // Subcategoría
    const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);
    const [subcategoriaId, setSubcategoriaId] = useState(producto?.subcategoriaId ?? '');
    const [subcategoriaModalVisible, setSubcategoriaModalVisible] = useState(false);

    // Proveedor (NUEVO)
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [proveedorId, setProveedorId] = useState(producto?.proveedorId ?? '');
    const [proveedorModalVisible, setProveedorModalVisible] = useState(false);
    const [loadingProveedores, setLoadingProveedores] = useState(false);

    useEffect(() => {
        const fetchCategorias = async () => {
            setLoadingCategorias(true);
            try {
                const res = await apiClient.get('/admin/categorias?activo=true');
                const data = res.data?.data?.categorias || [];
                setCategorias(Array.isArray(data) ? data : []);
            } catch { Alert.alert('Error', 'No se pudieron cargar las categorías'); }
            finally { setLoadingCategorias(false); }
        };
        fetchCategorias();
    }, []);

    useEffect(() => {
        const fetchProveedores = async () => {
            setLoadingProveedores(true);
            try {
                const res = await apiClient.get('/admin/proveedores?activo=true');
                const data = res.data?.data?.proveedores || [];
                setProveedores(Array.isArray(data) ? data : []);
            } catch { /* ignore */ }
            finally { setLoadingProveedores(false); }
        };
        fetchProveedores();
    }, []);

    useEffect(() => {
        if (categoriaId) {
            const fetchSubcategorias = async () => {
                try {
                    const res = await apiClient.get(`/admin/subcategorias?categoriaId=${categoriaId}&activo=true`);
                    const data = res.data?.data?.subcategorias || [];
                    setSubcategorias(Array.isArray(data) ? data : []);
                    if (producto?.categoriaId !== categoriaId) setSubcategoriaId('');
                } catch { Alert.alert('Error', 'No se pudieron cargar las subcategorías'); }
            };
            fetchSubcategorias();
        } else {
            setSubcategorias([]);
            setSubcategoriaId('');
        }
    }, [categoriaId]);

    const handleSubmit = async () => {
        if (!nombre || !precio || !categoriaId || !subcategoriaId) {
            Alert.alert('Error', 'Nombre, precio, categoría y subcategoría son obligatorios');
            return;
        }
        setLoading(true);
        try {
            const data = {
                nombre,
                descripcion,
                precio: parseFloat(precio),
                stock: parseInt(stock, 10) || 0,
                imagen,
                categoriaId,
                subcategoriaId,
                proveedorId: proveedorId || null,
            };
            if (editing && producto) {
                await updateProduct(data, producto.id || '');
                Alert.alert('Éxito', 'Producto actualizado');
            } else {
                await createProduct(data);
                Alert.alert('Éxito', 'Producto creado');
            }
            router.back();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'No se pudo guardar el producto';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const getCategoriaNombre = () => categorias.find(c => c.id === categoriaId)?.nombre || 'Seleccionar categoría';
    const getSubcategoriaNombre = () => subcategorias.find(s => s.id === subcategoriaId)?.nombre || 'Seleccionar subcategoría';
    const getProveedorNombre = () => proveedores.find(p => p.id === proveedorId)?.nombre || 'Sin proveedor';

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{editing ? 'Editar Producto' : 'Nuevo Producto'}</Text>

            {/* NOMBRE */}
            <Text style={styles.label}><Ionicons name="text-outline" size={14} color="#28a745" /> Nombre *</Text>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre del producto" />

            {/* DESCRIPCIÓN */}
            <Text style={styles.label}><Ionicons name="document-text-outline" size={14} color="#28a745" /> Descripción</Text>
            <TextInput style={[styles.input, styles.multiline]} value={descripcion} onChangeText={setDescripcion} placeholder="Descripción del producto" multiline />

            {/* PRECIO */}
            <Text style={styles.label}><Ionicons name="cash-outline" size={14} color="#28a745" /> Precio *</Text>
            <TextInput style={styles.input} value={precio} onChangeText={setPrecio} keyboardType="numeric" placeholder="0.00" />

            {/* STOCK */}
            <Text style={styles.label}><Ionicons name="cube-outline" size={14} color="#28a745" /> Stock *</Text>
            <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" />

            {/* IMAGEN */}
            <Text style={styles.label}><Ionicons name="image-outline" size={14} color="#28a745" /> URL Imagen</Text>
            <TextInput style={styles.input} value={imagen} onChangeText={setImagen} placeholder="/images/productos/ejemplo.webp" />

            {/* CATEGORÍA */}
            <Text style={styles.label}><Ionicons name="folder-outline" size={14} color="#28a745" /> Categoría *</Text>
            <Pressable style={styles.selector} onPress={() => setCategoriaModalVisible(true)}>
                <Text style={styles.selectorText}>{getCategoriaNombre()}</Text>
                <Ionicons name="chevron-down" size={18} color="#888" />
            </Pressable>

            {/* SUBCATEGORÍA */}
            <Text style={styles.label}><Ionicons name="folder-open-outline" size={14} color="#28a745" /> Subcategoría *</Text>
            <Pressable style={[styles.selector, !categoriaId && styles.selectorDisabled]} onPress={() => categoriaId && setSubcategoriaModalVisible(true)} disabled={!categoriaId}>
                <Text style={styles.selectorText}>{getSubcategoriaNombre()}</Text>
                <Ionicons name="chevron-down" size={18} color="#888" />
            </Pressable>

            {/* PROVEEDOR (NUEVO) */}
            <Text style={styles.label}><Ionicons name="truck-outline" size={14} color="#28a745" /> Proveedor</Text>
            <Pressable style={styles.selector} onPress={() => setProveedorModalVisible(true)}>
                <Text style={styles.selectorText}>{getProveedorNombre()}</Text>
                <Ionicons name="chevron-down" size={18} color="#888" />
            </Pressable>

            {/* BOTÓN GUARDAR */}
            <Pressable style={[styles.saveBtn, loading && styles.saveBtnDisabled]} onPress={handleSubmit} disabled={loading}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{loading ? 'Guardando...' : editing ? 'Actualizar Producto' : 'Crear Producto'}</Text>
            </Pressable>

            {/* MODAL CATEGORÍAS */}
            <Modal visible={categoriaModalVisible} animationType="slide" transparent>
                <View style={styles.modalWrap}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
                        {loadingCategorias ? (
                            <ActivityIndicator size="large" color="#28a745" />
                        ) : (
                            <FlatList
                                data={categorias}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={({ item }) => (
                                    <Pressable
                                        style={[styles.modalOption, categoriaId === item.id && styles.modalOptionSelected]}
                                        onPress={() => { setCategoriaId(item.id || ''); setCategoriaModalVisible(false); }}>
                                        <Ionicons name="folder-outline" size={18} color={categoriaId === item.id ? '#28a745' : '#888'} />
                                        <Text style={[styles.modalOptionText, categoriaId === item.id && styles.modalOptionTextSelected]}>
                                            {item.nombre}
                                        </Text>
                                    </Pressable>
                                )}
                                style={styles.modalList}
                            />
                        )}
                        <Pressable style={styles.modalCloseBtn} onPress={() => setCategoriaModalVisible(false)}>
                            <Text style={styles.modalCloseBtnText}>Cerrar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* MODAL SUBCATEGORÍAS */}
            <Modal visible={subcategoriaModalVisible} animationType="slide" transparent>
                <View style={styles.modalWrap}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Seleccionar Subcategoría</Text>
                        {subcategorias.length === 0 ? (
                            <Text style={{ textAlign: 'center', color: '#888', paddingVertical: 20 }}>No hay subcategorías disponibles</Text>
                        ) : (
                            <FlatList
                                data={subcategorias}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={({ item }) => (
                                    <Pressable
                                        style={[styles.modalOption, subcategoriaId === item.id && styles.modalOptionSelected]}
                                        onPress={() => { setSubcategoriaId(item.id || ''); setSubcategoriaModalVisible(false); }}>
                                        <Ionicons name="folder-open-outline" size={18} color={subcategoriaId === item.id ? '#28a745' : '#888'} />
                                        <Text style={[styles.modalOptionText, subcategoriaId === item.id && styles.modalOptionTextSelected]}>
                                            {item.nombre}
                                        </Text>
                                    </Pressable>
                                )}
                                style={styles.modalList}
                            />
                        )}
                        <Pressable style={styles.modalCloseBtn} onPress={() => setSubcategoriaModalVisible(false)}>
                            <Text style={styles.modalCloseBtnText}>Cerrar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* MODAL PROVEEDORES (NUEVO) */}
            <Modal visible={proveedorModalVisible} animationType="slide" transparent>
                <View style={styles.modalWrap}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Seleccionar Proveedor</Text>
                        {loadingProveedores ? (
                            <ActivityIndicator size="large" color="#28a745" />
                        ) : (
                            <>
                                {/* Opción "Sin proveedor" */}
                                <Pressable
                                    style={[styles.modalOption, proveedorId === '' && styles.modalOptionSelected]}
                                    onPress={() => { setProveedorId(''); setProveedorModalVisible(false); }}>
                                    <Ionicons name="close-circle-outline" size={18} color={proveedorId === '' ? '#ef4444' : '#888'} />
                                    <Text style={[styles.modalOptionText, proveedorId === '' && { color: '#ef4444', fontWeight: '600' }]}>
                                        Sin proveedor
                                    </Text>
                                </Pressable>
                                <FlatList
                                    data={proveedores}
                                    keyExtractor={(item) => String(item.id)}
                                    renderItem={({ item }) => (
                                        <Pressable
                                            style={[styles.modalOption, proveedorId === item.id && styles.modalOptionSelected]}
                                            onPress={() => { setProveedorId(item.id || ''); setProveedorModalVisible(false); }}>
                                            <Ionicons name="truck-outline" size={18} color={proveedorId === item.id ? '#28a745' : '#888'} />
                                            <Text style={[styles.modalOptionText, proveedorId === item.id && styles.modalOptionTextSelected]}>
                                                {item.nombre}
                                            </Text>
                                        </Pressable>
                                    )}
                                    style={styles.modalList}
                                />
                            </>
                        )}
                        <Pressable style={styles.modalCloseBtn} onPress={() => setProveedorModalVisible(false)}>
                            <Text style={styles.modalCloseBtnText}>Cerrar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#fff', flexGrow: 1, gap: 4 },
    title: { fontSize: 22, fontWeight: '800', color: '#28a745', marginBottom: 10, textAlign: 'center' },
    label: { fontWeight: '600', marginTop: 10, color: '#333', fontSize: 14 },
    input: { borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, padding: 12, marginTop: 5, backgroundColor: '#fafafa', fontSize: 15 },
    multiline: { minHeight: 70, textAlignVertical: 'top' },
    
    // Selector
    selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, padding: 12, marginTop: 5, backgroundColor: '#fafafa' },
    selectorDisabled: { opacity: 0.5, backgroundColor: '#e8e8e8' },
    selectorText: { fontSize: 15, color: '#333' },

    // Botón guardar
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#28a745', borderRadius: 12, paddingVertical: 16, marginTop: 24 },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    // Modal
    modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    modalTitle: { fontWeight: '700', fontSize: 18, marginBottom: 15, color: '#28a745', textAlign: 'center' },
    modalList: { maxHeight: 350, marginBottom: 10 },
    modalOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    modalOptionSelected: { backgroundColor: '#d1fae5' },
    modalOptionText: { fontSize: 15, color: '#333' },
    modalOptionTextSelected: { fontWeight: '700', color: '#28a745' },
    modalCloseBtn: { backgroundColor: '#28a745', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
    modalCloseBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});