/**
 * Pantalla de administración de categorías - MarketCOL
 * Lista categorías, permite crear, editar y activar/desactivar.
 * Solo administradores pueden gestionar (auxiliar solo ve).
 */

import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

type Categoria = {
    id?: number;
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
};

export default function AdminCategoriasScreen() {
    const { user } = useAuth() as { user?: { rol?: string } };
    const isAdmin = user?.rol === 'administrador';

    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [editing, setEditing] = useState<Categoria | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchCategorias = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/categorias');
            const data = res.data?.data?.categorias || [];
            setCategorias(Array.isArray(data) ? data : []);
        } catch (err) {
            Alert.alert('Error', 'No se pudieron cargar las categorías');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategorias();
    }, []);

    const guardarCategoria = async () => {
        if (!nombre.trim()) {
            setErrorMsg('El nombre es obligatorio');
            return;
        }
        setErrorMsg('');
        try {
            if (editing) {
                await apiClient.put(`/admin/categorias/${editing.id}`, { nombre, descripcion });
            } else {
                await apiClient.post('/admin/categorias', { nombre, descripcion });
            }
            setModalVisible(false);
            setNombre(''); setDescripcion(''); setEditing(null);
            fetchCategorias();
        } catch (err) {
            Alert.alert('Error', 'No se pudo guardar la categoría');
        }
    };

    const toggleCategoria = async (id?: number) => {
        if (!id) return;
        try {
            await apiClient.patch(`/admin/categorias/${id}/toggle`);
            fetchCategorias();
        } catch {
            Alert.alert('Error', 'No se pudo cambiar el estado');
        }
    };

    const abrirModal = (cat?: Categoria) => {
        if (cat) {
            setEditing(cat);
            setNombre(cat.nombre || '');
            setDescripcion(cat.descripcion || '');
        } else {
            setEditing(null);
            setNombre('');
            setDescripcion('');
        }
        setErrorMsg('');
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <ThemedText type="title">Categorías</ThemedText>

            {isAdmin && (
                <Pressable style={styles.createBtn} onPress={() => abrirModal()}>
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <ThemedText style={styles.createBtnText}>Crear categoría</ThemedText>
                </Pressable>
            )}

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#28a745" />
                    <ThemedText>Cargando categorías...</ThemedText>
                </View>
            ) : null}

            <FlatList
                data={categorias}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardIcon}>
                            <Ionicons name="folder-outline" size={24} color="#28a745" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText type="defaultSemiBold">{item.nombre}</ThemedText>
                            <ThemedText numberOfLines={2} style={styles.desc}>
                                {item.descripcion || 'Sin descripción'}
                            </ThemedText>
                            <View style={styles.estadoRow}>
                                <View style={[styles.estadoDot, { backgroundColor: item.activo ? '#28a745' : '#ef4444' }]} />
                                <ThemedText style={styles.meta}>{item.activo ? 'Activo' : 'Inactivo'}</ThemedText>
                            </View>
                        </View>

                        {isAdmin && (
                            <View style={styles.actionsRow}>
                                <Pressable
                                    style={[styles.actionBtn, { backgroundColor: item.activo ? '#f59e0b' : '#28a745' }]}
                                    onPress={() => toggleCategoria(item.id)}>
                                    <Ionicons name={item.activo ? 'eye-off-outline' : 'eye-outline'} size={14} color="#fff" />
                                </Pressable>
                                <Pressable
                                    style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                                    onPress={() => abrirModal(item)}>
                                    <Ionicons name="pencil" size={14} color="#fff" />
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={!loading ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="folder-open-outline" size={60} color="#ccc" />
                        <ThemedText style={styles.emptyText}>No hay categorías.</ThemedText>
                    </View>
                ) : null}
                style={styles.list}
            />

            {/* MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalWrap}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Ionicons name={editing ? 'pencil' : 'add-circle-outline'} size={24} color="#28a745" />
                            <ThemedText type="title">{editing ? 'Editar categoría' : 'Crear categoría'}</ThemedText>
                        </View>

                        {errorMsg ? (
                            <View style={styles.errorRow}>
                                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                                <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
                            </View>
                        ) : null}

                        <ThemedText style={styles.label}>Nombre *</ThemedText>
                        <TextInput
                            placeholder="Ej: Despensa"
                            value={nombre}
                            onChangeText={setNombre}
                            style={styles.input}
                        />

                        <ThemedText style={styles.label}>Descripción</ThemedText>
                        <TextInput
                            placeholder="Descripción de la categoría (opcional)"
                            value={descripcion}
                            onChangeText={setDescripcion}
                            style={[styles.input, styles.multiline]}
                            multiline
                        />

                        <View style={styles.modalActions}>
                            <Pressable style={styles.btnGuardar} onPress={guardarCategoria}>
                                <Ionicons name="checkmark" size={18} color="#fff" />
                                <ThemedText style={styles.btnGuardarText}>Guardar</ThemedText>
                            </Pressable>
                            <Pressable style={styles.btnCancelar} onPress={() => { setModalVisible(false); setEditing(null); }}>
                                <ThemedText style={styles.btnCancelarText}>Cancelar</ThemedText>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 10 },
    centered: { alignItems: 'center', gap: 10, marginVertical: 20 },
    emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40 },
    emptyText: { color: '#888', fontSize: 14 },
    
    // Inputs
    label: { fontWeight: '600', marginTop: 8, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
    multiline: { minHeight: 60, textAlignVertical: 'top' },

    // Botón crear
    createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#28a745', borderRadius: 10, paddingVertical: 12, marginBottom: 4 },
    createBtnText: { color: '#fff', fontWeight: '700' },

    list: { flex: 1 },
    
    // Card
    card: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 12, backgroundColor: '#fff', marginBottom: 8, alignItems: 'center' },
    cardIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
    desc: { color: '#888', fontSize: 12, marginTop: 2 },
    estadoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    estadoDot: { width: 8, height: 8, borderRadius: 4 },
    meta: { color: '#666', fontSize: 12 },
    
    // Acciones
    actionsRow: { flexDirection: 'column', gap: 6, marginLeft: 8 },
    actionBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },

    // Modal
    modalWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 20 },
    modalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 8, padding: 10, marginBottom: 8 },
    errorText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    btnGuardar: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#28a745', borderRadius: 10, paddingVertical: 14 },
    btnGuardarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    btnCancelar: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#d5d5d5', borderRadius: 10, paddingVertical: 14 },
    btnCancelarText: { color: '#666', fontWeight: '600', fontSize: 15 },
});