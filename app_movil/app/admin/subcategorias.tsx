/**
 * Pantalla de administración de subcategorías - MarketCOL
 * Lista subcategorías, permite crear, editar y activar/desactivar.
 */

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

type Categoria = { id?: number; nombre?: string; activo?: boolean };
type Subcategoria = {
  id?: number;
  nombre?: string;
  descripcion?: string;
  categoriaId?: number;
  activo?: boolean;
  categoria?: Categoria;
};

export default function AdminSubcategoriasScreen() {
  const { user } = useAuth() as { user?: { rol?: string } };
  const canManage = user?.rol === 'administrador' || user?.rol === 'auxiliar';

  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Subcategoria | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const subcategoriasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return subcategorias;

    return subcategorias.filter((item) => {
      const texto = `${item.nombre || ''} ${item.descripcion || ''} ${item.categoria?.nombre || ''}`.toLowerCase();
      return texto.includes(termino);
    });
  }, [subcategorias, busqueda]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, catsRes] = await Promise.all([
        apiClient.get('/admin/subcategorias'),
        apiClient.get('/admin/categorias'),
      ]);
      const subs = subsRes.data?.data?.subcategorias || [];
      const cats = catsRes.data?.data?.categorias || [];
      setSubcategorias(Array.isArray(subs) ? subs : []);
      setCategorias(Array.isArray(cats) ? cats : []);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las subcategorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const abrirModal = (item?: Subcategoria) => {
    if (item) {
      setEditing(item);
      setNombre(item.nombre || '');
      setDescripcion(item.descripcion || '');
      setCategoriaId(String(item.categoriaId || ''));
    } else {
      setEditing(null);
      setNombre('');
      setDescripcion('');
      setCategoriaId('');
    }
    setErrorMsg('');
    setModalVisible(true);
  };

  const guardarSubcategoria = async () => {
    if (!nombre.trim() || !categoriaId) {
      setErrorMsg('El nombre y la categoría son obligatorios');
      return;
    }
    setErrorMsg('');
    try {
      if (editing) {
        await apiClient.put(`/admin/subcategorias/${editing.id}`, { nombre, descripcion, categoriaId: Number(categoriaId) });
      } else {
        await apiClient.post('/admin/subcategorias', { nombre, descripcion, categoriaId: Number(categoriaId) });
      }
      setModalVisible(false);
      setNombre('');
      setDescripcion('');
      setCategoriaId('');
      setEditing(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'No se pudo guardar la subcategoría');
    }
  };

  const toggleSubcategoria = async (id?: number) => {
    if (!id) return;
    try {
      await apiClient.patch(`/admin/subcategorias/${id}/toggle`);
      fetchData();
    } catch {
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title">Subcategorías</ThemedText>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          placeholder="Buscar subcategoría..."
          value={busqueda}
          onChangeText={setBusqueda}
          style={styles.searchInput}
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {busqueda.length > 0 ? (
          <Pressable onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </Pressable>
        ) : null}
      </View>

      {canManage && (
        <Pressable style={styles.createBtn} onPress={() => abrirModal()}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <ThemedText style={styles.createBtnText}>Crear subcategoría</ThemedText>
        </Pressable>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#cd2626" />
          <ThemedText>Cargando subcategorías...</ThemedText>
        </View>
      ) : null}

      <FlatList
        data={subcategoriasFiltradas}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="folder-open-outline" size={22} color="#dc2626" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold">{item.nombre}</ThemedText>
              <ThemedText style={styles.meta}>
                {item.categoria?.nombre || item.categoriaId ? `Categoría #${item.categoriaId}` : 'Sin categoría'}
              </ThemedText>
              <ThemedText numberOfLines={2} style={styles.desc}>
                {item.descripcion || 'Sin descripción'}
              </ThemedText>
              <View style={styles.estadoRow}>
                <View style={[styles.estadoDot, { backgroundColor: item.activo ? '#28a745' : '#ef4444' }]} />
                <ThemedText style={styles.meta}>{item.activo ? 'Activo' : 'Inactivo'}</ThemedText>
              </View>
            </View>

            {canManage && (
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: item.activo ? '#f59e0b' : '#28a745' }]}
                  onPress={() => toggleSubcategoria(item.id)}>
                  <Ionicons name={item.activo ? 'eye-off-outline' : 'eye-outline'} size={14} color="#fff" />
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#dc2626' }]}
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
            <ThemedText style={styles.emptyText}>
              {busqueda.trim() ? 'No hay subcategorías que coincidan con la búsqueda.' : 'No hay subcategorías.'}
            </ThemedText>
          </View>
        ) : null}
        style={styles.list}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name={editing ? 'pencil' : 'add-circle-outline'} size={24} color="#dc2626" />
              <ThemedText type="title">{editing ? 'Editar subcategoría' : 'Crear subcategoría'}</ThemedText>
            </View>

            {errorMsg ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
              </View>
            ) : null}

            <ThemedText style={styles.label}>Nombre *</ThemedText>
            <TextInput placeholder="Ej: Arroz" value={nombre} onChangeText={setNombre} style={styles.input} />

            <ThemedText style={styles.label}>Descripción</ThemedText>
            <TextInput placeholder="Descripción (opcional)" value={descripcion} onChangeText={setDescripcion} style={[styles.input, styles.multiline]} multiline />

            <ThemedText style={styles.label}>Categoría *</ThemedText>
            <View style={styles.selectWrap}>
              {categorias.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[styles.optionChip, String(cat.id) === categoriaId && styles.optionChipActive]}
                  onPress={() => setCategoriaId(String(cat.id))}
                >
                  <ThemedText style={[styles.optionChipText, String(cat.id) === categoriaId && styles.optionChipTextActive]}>
                    {cat.nombre}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.btnGuardar} onPress={guardarSubcategoria}>
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
  list: { flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', padding: 0 },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 12, marginBottom: 4 },
  createBtnText: { color: '#fff', fontWeight: '700' },
  card: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f3d4d4', backgroundColor: '#fff', marginBottom: 8 },
  cardIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  desc: { color: '#666', fontSize: 12, marginTop: 2 },
  meta: { color: '#666', fontSize: 12 },
  estadoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  estadoDot: { width: 8, height: 8, borderRadius: 4 },
  actionsRow: { flexDirection: 'column', gap: 6, marginLeft: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 8, padding: 10, marginBottom: 8 },
  errorText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  label: { fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  selectWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  optionChip: { borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  optionChipActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  optionChipText: { color: '#444', fontSize: 13 },
  optionChipTextActive: { color: '#fff', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnGuardar: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#cd2626', borderRadius: 10, paddingVertical: 14 },
  btnGuardarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnCancelar: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#d5d5d5', borderRadius: 10, paddingVertical: 14 },
  btnCancelarText: { color: '#666', fontWeight: '600', fontSize: 15 },
});
