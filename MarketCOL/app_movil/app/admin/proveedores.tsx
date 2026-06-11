/**
 * Gestión de proveedores - Panel de administración - MarketCOL
 * Lista proveedores, permite crear, editar y activar/desactivar.
 */

import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

type Proveedor = {
    id?: number;
    nombre?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    activo?: boolean;
};

export default function AdminProveedoresScreen() {
    const { user } = useAuth() as { user?: { rol?: string } };
    const isAdmin = user?.rol === 'administrador';

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<Proveedor | null>(null);
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [direccion, setDireccion] = useState('');

    const fetchProveedores = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/proveedores');
            const data = res.data?.data?.proveedores || [];
            setProveedores(Array.isArray(data) ? data : []);
        } catch (err) {
            Alert.alert('Error', 'No se pudieron cargar los proveedores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProveedores(); }, []);

    const abrirModal = (p?: Proveedor) => {
        if (p) {
            setEditing(p);
            setNombre(p.nombre || '');
            setTelefono(p.telefono || '');
            setEmail(p.email || '');
            setDireccion(p.direccion || '');
        } else {
            setEditing(null);
            setNombre(''); setTelefono(''); setEmail(''); setDireccion('');
        }
        setModalVisible(true);
    };

    const guardarProveedor = async () => {
        if (!nombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }
        try {
            if (editing) {
                await apiClient.put(`/admin/proveedores/${editing.id}`, { nombre, telefono, email, direccion });
            } else {
                await apiClient.post('/admin/proveedores', { nombre, telefono, email, direccion });
            }
            setModalVisible(false);
            fetchProveedores();
        } catch (_err) {
            Alert.alert('Error', 'No se pudo guardar el proveedor');
        }
    };

    const toggleProveedor = async (id?: number) => {
        if (!id) return;
        try {
            await apiClient.patch(`/admin/proveedores/${id}/toggle`);
            fetchProveedores();
        } catch {
            Alert.alert('Error', 'No se pudo cambiar el estado');
        }
    };

    return (
        <View style={styles.container}>
            <ThemedText type="title">Proveedores</ThemedText>

            {isAdmin && (
                <Pressable style={styles.createBtn} onPress={() => abrirModal()}>
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <ThemedText style={styles.createBtnText}>Crear proveedor</ThemedText>
                </Pressable>
            )}

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#28a745" />
                    <ThemedText>Cargando proveedores...</ThemedText>
                </View>
            ) : null}

            <FlatList
                data={proveedores}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={{ flex: 1 }}>
                            <ThemedText type="defaultSemiBold">{item.nombre}</ThemedText>
                            <ThemedText style={styles.meta}>{item.telefono || ''} {item.email ? '· ' + item.email : ''}</ThemedText>
                            <ThemedText numberOfLines={2} style={styles.desc}>{item.direccion || ''}</ThemedText>
                            <View style={styles.estadoRow}>
                                <View style={[styles.estadoDot, { backgroundColor: item.activo ? '#28a745' : '#ef4444' }]} />
                                <ThemedText style={styles.meta}>{item.activo ? 'Activo' : 'Inactivo'}</ThemedText>
                            </View>
                        </View>

                        {isAdmin && (
                            <View style={styles.actionsRow}>
                                <Pressable
                                    style={[styles.actionBtn, { backgroundColor: item.activo ? '#f59e0b' : '#28a745' }]}
                                    onPress={() => toggleProveedor(item.id)}>
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
                ListEmptyComponent={!loading ? <ThemedText style={styles.empty}>No hay proveedores.</ThemedText> : null}
                style={styles.list}
            />

            {/* MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalWrap}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Ionicons name={editing ? 'pencil' : 'add-circle-outline'} size={24} color="#28a745" />
                            <ThemedText type="title">{editing ? 'Editar proveedor' : 'Crear proveedor'}</ThemedText>
                        </View>

                        <ThemedText style={styles.label}>Nombre *</ThemedText>
                        <TextInput placeholder="Nombre del proveedor" value={nombre} onChangeText={setNombre} style={styles.input} />

                        <ThemedText style={styles.label}>Teléfono</ThemedText>
                        <TextInput placeholder="Teléfono" value={telefono} onChangeText={setTelefono} style={styles.input} />

                        <ThemedText style={styles.label}>Email</ThemedText>
                        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />

                        <ThemedText style={styles.label}>Dirección</ThemedText>
                        <TextInput placeholder="Dirección" value={direccion} onChangeText={setDireccion} style={[styles.input, styles.multiline]} multiline />

                        <View style={styles.modalActions}>
                            <Pressable style={styles.btnGuardar} onPress={guardarProveedor}>
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
    list: { flex: 1 },
    empty: { color: '#888', textAlign: 'center', marginTop: 20 },

    // Card
    card: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#fff', marginBottom: 10 },
    estadoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    estadoDot: { width: 10, height: 10, borderRadius: 6 },
    meta: { color: '#666', fontSize: 13 },
    desc: { color: '#666', fontSize: 13, marginTop: 4 },

    // Actions
    actionsRow: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    // Create
    createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#28a745', borderRadius: 10, paddingVertical: 12, marginBottom: 4 },
    createBtnText: { color: '#fff', fontWeight: '700' },

    // Modal
    modalWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.4)' },
    modalCard: { width: '100%', borderRadius: 12, padding: 16, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    label: { fontWeight: '600', marginTop: 8, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
    multiline: { minHeight: 60, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    btnGuardar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#28a745', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
    btnGuardarText: { color: '#fff', fontWeight: '700' },
    btnCancelar: { justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10 },
    btnCancelarText: { color: '#666' },
});
