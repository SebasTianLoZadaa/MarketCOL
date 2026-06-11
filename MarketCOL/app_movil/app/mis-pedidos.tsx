// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/mis-pedidos.tsx - MarketCOL
// PROPÓSITO: Lista todos los pedidos del cliente autenticado.
//   - Muestra estado del pedido y estado de pago con badges de colores.
//   - Se recarga automáticamente al enfocar la pantalla.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useAuth } from '../src/context/AuthContext';
import pedidoService from '../src/services/pedidoService';

type Pedido = {
  id?: number;
  estado?: string;
  estadoPago?: string;
  total?: number;
  createdAt?: string;
  metodoPago?: string;
  detalles?: unknown[];
};

const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);
const routerPush = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);

function formatCOP(value: unknown) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function formatDate(value: unknown) {
  if (!value) return '-';
  return new Date(value as string).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const getEstadoBadge = (estado: string) => {
  const mapping: Record<string, { bg: string; color: string; label: string; icon: string }> = {
    pendiente:  { bg: '#fef3c7', color: '#f59e0b', label: 'Pendiente', icon: 'time-outline' },
    preparando: { bg: '#dbeafe', color: '#3b82f6', label: 'Preparando', icon: 'construct-outline' },
    listo:      { bg: '#d1fae5', color: '#28a745', label: 'Listo para recoger', icon: 'checkmark-circle-outline' },
    entregado:  { bg: '#d1fae5', color: '#059669', label: 'Entregado', icon: 'home-outline' },
    cancelado:  { bg: '#fee2e2', color: '#ef4444', label: 'Cancelado', icon: 'close-circle-outline' },
  };
  return mapping[estado] || { bg: '#f3f4f6', color: '#6b7280', label: estado || 'Desconocido', icon: 'help-circle-outline' };
};

const getPagoBadge = (estadoPago: string) => {
  if (estadoPago === 'confirmado') {
    return { bg: '#d1fae5', color: '#28a745', label: 'Pagado', icon: 'checkmark-circle' };
  }
  return { bg: '#fef3c7', color: '#f59e0b', label: 'Pago pendiente', icon: 'time-outline' };
};

export default function MisPedidosScreen() {
  const { isAuthenticated } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPedidos = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await pedidoService.getMisPedidos();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No fue posible cargar tus pedidos.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadPedidos(); }, [loadPedidos]);

  useFocusEffect(useCallback(() => { loadPedidos(); }, [loadPedidos]));

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed" size={60} color="#28a745" />
        <ThemedText type="title">Inicia Sesión</ThemedText>
        <ThemedText style={styles.subtitle}>Inicia sesión para ver tu historial de pedidos.</ThemedText>
        <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/explore')}>
          <ThemedText style={styles.primaryButtonText}>Ir a Cuenta</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#28a745" />
        <ThemedText>Cargando pedidos...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText type="title">Mis Pedidos</ThemedText>

      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

      {pedidos.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={60} color="#ccc" />
          <ThemedText type="defaultSemiBold">Aún no tienes pedidos</ThemedText>
          <ThemedText style={styles.subtitle}>Cuando compres, aparecerán aquí.</ThemedText>
          <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/')}>
            <Ionicons name="storefront-outline" size={16} color="#fff" />
            <ThemedText style={styles.primaryButtonText}>Ir a la Tienda</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        pedidos.map((pedido) => {
          const estadoInfo = getEstadoBadge(pedido.estado || 'pendiente');
          const pagoInfo = getPagoBadge(pedido.estadoPago || 'pendiente');
          
          return (
            <Pressable
              key={pedido.id}
              style={styles.card}
              onPress={() => routerPush(`/pedidos/${pedido.id}`)}>
              
              {/* Cabecera: ID + Estado */}
              <View style={styles.rowBetween}>
                <View style={styles.idRow}>
                  <Ionicons name="receipt-outline" size={16} color="#28a745" />
                  <ThemedText type="defaultSemiBold">Pedido #{pedido.id}</ThemedText>
                </View>
                <View style={[styles.badge, { backgroundColor: estadoInfo.bg }]}>
                  <Ionicons name={estadoInfo.icon as any} size={12} color={estadoInfo.color} />
                  <ThemedText style={[styles.badgeText, { color: estadoInfo.color }]}>
                    {estadoInfo.label}
                  </ThemedText>
                </View>
              </View>

              {/* Fecha */}
              <ThemedText style={styles.meta}>
                <Ionicons name="calendar-outline" size={12} color="#888" /> {formatDate(pedido.createdAt)}
              </ThemedText>

              {/* Fila: productos + pago + total */}
              <View style={styles.rowBetween}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.meta}>
                    {pedido.detalles?.length || 0} producto(s)
                  </ThemedText>
                  {/* Badge de pago */}
                  <View style={[styles.pagoBadge, { backgroundColor: pagoInfo.bg }]}>
                    <Ionicons name={pagoInfo.icon as any} size={10} color={pagoInfo.color} />
                    <ThemedText style={[styles.pagoBadgeText, { color: pagoInfo.color }]}>
                      {pagoInfo.label}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.total}>{formatCOP(pedido.total)}</ThemedText>
              </View>

              {/* Método de pago (ícono pequeño) */}
              <View style={styles.metodoRow}>
                <Ionicons 
                  name={pedido.metodoPago === 'whatsapp' ? 'logo-whatsapp' : 'cash-outline'} 
                  size={12} 
                  color={pedido.metodoPago === 'whatsapp' ? '#25D366' : '#28a745'} 
                />
                <ThemedText style={styles.metodoText}>
                  {pedido.metodoPago === 'whatsapp' ? 'WhatsApp' : 'Efectivo'}
                </ThemedText>
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  subtitle: { color: '#666', textAlign: 'center' },
  error: { color: '#ef4444' },
  emptyState: { borderRadius: 12, padding: 16, gap: 10, alignItems: 'center' },
  card: {
    borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12,
    padding: 14, backgroundColor: '#fff', gap: 8,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { color: '#666', fontSize: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { fontWeight: '600', fontSize: 11 },
  pagoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  pagoBadgeText: { fontWeight: '600', fontSize: 10 },
  total: { fontWeight: '700', fontSize: 16, color: '#28a745' },
  metodoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metodoText: { fontSize: 11, color: '#888' },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 10, paddingVertical: 14, paddingHorizontal: 20,
    backgroundColor: '#28a745',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});