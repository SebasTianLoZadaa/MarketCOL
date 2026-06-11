// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/pedido-confirmado.tsx - MarketCOL
// PROPÓSITO: Pantalla de confirmación tras realizar un pedido.
//   - Muestra el ID del pedido, estado, método de pago y total.
//   - Ofrece botón de WhatsApp si el pago está pendiente.
//   - Modalidad: Aliste y Recoja.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import pedidoService from '../src/services/pedidoService';

type Pedido = {
  id?: number;
  estado?: string;
  estadoPago?: string;
  metodoPago?: string;
  modalidadEntrega?: string;
  total?: number;
  telefono?: string;
  notas?: string;
  fechaPago?: string;
  linkPago?: string;
};

const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);

function formatCOP(value: unknown) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

const getEstadoBadge = (estado: string) => {
  const mapping: Record<string, { color: string; label: string; icon: string }> = {
    pendiente:  { color: '#f59e0b', label: 'Pendiente', icon: 'time-outline' },
    preparando: { color: '#3b82f6', label: 'Preparando', icon: 'construct-outline' },
    listo:      { color: '#28a745', label: 'Listo para recoger', icon: 'checkmark-circle-outline' },
    entregado:  { color: '#10b981', label: 'Entregado', icon: 'home-outline' },
    cancelado:  { color: '#ef4444', label: 'Cancelado', icon: 'close-circle-outline' },
  };
  return mapping[estado] || { color: '#6b7280', label: estado || 'Desconocido', icon: 'help-circle-outline' };
};

export default function PedidoConfirmadoScreen() {
  const { pedidoId } = useLocalSearchParams();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(Boolean(pedidoId));
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadPedido = async () => {
      if (!pedidoId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErrorMessage('');
      try {
        const data = await pedidoService.getPedidoById(pedidoId as string);
        setPedido(data);
      } catch (error: unknown) {
        setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar el pedido.');
      } finally {
        setLoading(false);
      }
    };
    loadPedido();
  }, [pedidoId]);

  const handleWhatsApp = () => {
    const link = pedido?.linkPago || `https://wa.me/573001234567?text=Hola%20MerkaCiro,%20mi%20pedido%20%23${pedido?.id}%20está%20pendiente%20de%20pago.`;
    Linking.openURL(link).catch(() => {
      Alert.alert('WhatsApp', 'No se pudo abrir WhatsApp. Contacta a la tienda manualmente.');
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#28a745" />
        <ThemedText>Cargando información del pedido...</ThemedText>
      </View>
    );
  }

  const estadoInfo = getEstadoBadge(pedido?.estado || 'pendiente');
  const pagoPendiente = pedido?.estadoPago === 'pendiente';
  const pedidoListo = pedido?.estado === 'listo';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Banner de confirmación */}
      <ThemedView style={styles.banner}>
        <Ionicons name="checkmark-circle" size={60} color="#fff" />
        <ThemedText type="title" style={styles.bannerTitle}>¡Pedido Recibido!</ThemedText>
        <ThemedText style={styles.bannerText}>
          Tu pedido ha sido registrado exitosamente.{'\n'}
          {pagoPendiente && 'Está pendiente de confirmación de pago.'}
        </ThemedText>
      </ThemedView>

      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

      {/* Tarjeta de detalles */}
      {pedido ? (
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText type="defaultSemiBold">Pedido #{pedido.id}</ThemedText>
            <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.color + '20' }]}>
              <Ionicons name={estadoInfo.icon as any} size={14} color={estadoInfo.color} />
              <ThemedText style={[styles.estadoText, { color: estadoInfo.color }]}>{estadoInfo.label}</ThemedText>
            </View>
          </View>

          {/* Estado de pago */}
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Estado de pago</ThemedText>
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

          {/* Método de pago */}
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Método de pago</ThemedText>
            <ThemedText style={styles.detailValue}>
              {pedido.metodoPago === 'whatsapp' ? (
                <><Ionicons name="logo-whatsapp" size={14} color="#25D366" /> WhatsApp</>
              ) : (
                <><Ionicons name="cash-outline" size={14} color="#28a745" /> Efectivo</>
              )}
            </ThemedText>
          </View>

          {/* Modalidad */}
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Modalidad</ThemedText>
            <ThemedText style={styles.detailValueVerde}>
              <Ionicons name="storefront-outline" size={14} color="#28a745" /> Aliste y recoja
            </ThemedText>
          </View>

          {/* Teléfono */}
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Teléfono</ThemedText>
            <ThemedText style={styles.detailValue}>{pedido.telefono || '—'}</ThemedText>
          </View>

          {/* Notas */}
          {pedido.notas ? (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Notas</ThemedText>
              <ThemedText style={styles.detailValue}>{pedido.notas}</ThemedText>
            </View>
          ) : null}

          {/* Total */}
          <View style={styles.separator} />
          <ThemedText style={styles.total}>Total a pagar: {formatCOP(pedido.total)}</ThemedText>
        </ThemedView>
      ) : null}

      {/* Alerta: pedido listo para recoger */}
      {pedidoListo && (
        <View style={styles.alertaListo}>
          <Ionicons name="checkmark-circle" size={24} color="#28a745" />
          <ThemedText style={styles.alertaListoText}>
            ¡Tu pedido está listo! Puedes pasar a recogerlo en la tienda.
          </ThemedText>
        </View>
      )}

      {/* Botón WhatsApp (solo si pago pendiente y método WhatsApp) */}
      {pagoPendiente && pedido?.metodoPago === 'whatsapp' && (
        <Pressable style={styles.whatsappButton} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <ThemedText style={styles.whatsappButtonText}>Contactar por WhatsApp</ThemedText>
        </Pressable>
      )}

      {/* Botones de acción */}
      <Pressable style={styles.primaryButton} onPress={() => router.replace('/mis-pedidos')}>
        <Ionicons name="list-outline" size={18} color="#fff" />
        <ThemedText style={styles.primaryButtonText}>Ver mis pedidos</ThemedText>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => routerReplace('/(tabs)/')}>
        <Ionicons name="storefront-outline" size={18} color="#28a745" />
        <ThemedText style={styles.secondaryButtonText}>Seguir comprando</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  banner: { 
    borderRadius: 16, padding: 24, backgroundColor: '#28a745', 
    alignItems: 'center', gap: 10 
  },
  bannerTitle: { color: '#fff', fontSize: 24 },
  bannerText: { color: '#d1fae5', textAlign: 'center', fontSize: 14, lineHeight: 20 },
  card: {
    borderRadius: 12, padding: 14,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e8e8e8',
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  estadoText: { fontWeight: '600', fontSize: 12 },
  pagoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: '#6b7280', fontSize: 13 },
  detailValue: { fontWeight: '500', fontSize: 13 },
  detailValueVerde: { fontWeight: '500', fontSize: 13, color: '#28a745' },
  separator: { height: 1, backgroundColor: '#e8e8e8' },
  total: { fontSize: 20, fontWeight: '800', color: '#28a745', textAlign: 'right' },
  alertaListo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#d1fae5', borderRadius: 10, padding: 14,
  },
  alertaListoText: { flex: 1, color: '#065f46', fontWeight: '600', fontSize: 14 },
  whatsappButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 10, backgroundColor: '#25D366',
    paddingVertical: 14,
  },
  whatsappButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 10, backgroundColor: '#28a745',
    paddingVertical: 14,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#28a745',
    paddingVertical: 14,
  },
  secondaryButtonText: { color: '#28a745', fontWeight: '600', fontSize: 16 },
  error: { color: '#ef4444', fontWeight: '600' },
});