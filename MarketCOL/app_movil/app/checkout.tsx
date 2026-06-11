// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/checkout.tsx - MarketCOL
// PROPÓSITO: Pantalla de finalizar pedido (Aliste y Recoja).
//   El cliente completa teléfono y elige método de pago (WhatsApp o Efectivo).
//   Sin dirección de envío.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useAuth } from '../src/context/AuthContext';
import { useCarrito } from '../src/context/CarritoContext';
import pedidoService from '../src/services/pedidoService';

type CarritoCtx = { items: unknown[]; total: number; loading: boolean; refreshCarrito: () => Promise<void> };
type AuthCtx = { isAuthenticated: boolean; user?: { nombre?: string; apellido?: string; email?: string; telefono?: string } | null };

const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);

// Métodos de pago de MarketCOL
const PAYMENT_METHODS = [
  { key: 'whatsapp',  label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { key: 'efectivo',  label: 'Efectivo', icon: 'cash-outline', color: '#28a745' },
];

const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

export default function CheckoutScreen() {
  const { isAuthenticated, user } = useAuth() as AuthCtx;
  const { items, total, loading, refreshCarrito } = useCarrito() as CarritoCtx;

  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [metodoPago, setMetodoPago] = useState('whatsapp');
  const [notasAdicionales, setNotasAdicionales] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = useMemo(() => {
    return telefono.trim() && items.length > 0 && !submitting;
  }, [telefono, items.length, submitting]);

  // Guardia: no autenticado
  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed" size={60} color="#28a745" />
        <ThemedText type="title">Inicia Sesión</ThemedText>
        <ThemedText style={styles.subtitle}>Debes iniciar sesión para finalizar tu pedido.</ThemedText>
        <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/explore')}>
          <ThemedText style={styles.primaryButtonText}>Ir a Cuenta</ThemedText>
        </Pressable>
      </View>
    );
  }

  // Guardia: carrito vacío
  if (!loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cart-outline" size={60} color="#28a745" />
        <ThemedText type="title">Carrito Vacío</ThemedText>
        <ThemedText style={styles.subtitle}>Agrega productos antes de continuar.</ThemedText>
        <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/')}>
          <ThemedText style={styles.primaryButtonText}>Volver a la Tienda</ThemedText>
        </Pressable>
      </View>
    );
  }

  const handleConfirm = async () => {
    setErrorMessage('');

    if (!telefono.trim()) {
      setErrorMessage('Ingresa un teléfono de contacto.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await pedidoService.crearPedido({
        telefono: telefono.trim(),
        metodoPago,
        notasAdicionales: notasAdicionales.trim(),
      });

      await refreshCarrito();

      const pedido = result?.pedido || result;
      const pedidoId = pedido?.id;
      const linkPago = result?.linkPago;

      // Si eligió WhatsApp, abrir el enlace
      if (metodoPago === 'whatsapp' && linkPago) {
        Linking.openURL(linkPago).catch(() => {
          Alert.alert('WhatsApp', 'No se pudo abrir WhatsApp. Contacta a la tienda manualmente.');
        });
      }

      if (pedidoId) {
        routerReplace(`/pedido-confirmado?pedidoId=${pedidoId}`);
      } else {
        routerReplace('/pedido-confirmado');
      }
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No fue posible confirmar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Finalizar Pedido</ThemedText>
        <ThemedText style={styles.subtitle}>
          Modalidad: <ThemedText style={styles.verde}>Aliste y Recoja</ThemedText>
        </ThemedText>

        {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

        {/* ── DATOS DE CONTACTO ──────────────────────────────────── */}
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Datos de Contacto</ThemedText>

          <ThemedText style={styles.label}>Nombre</ThemedText>
          <ThemedView style={styles.disabledInput}>
            <ThemedText>{user?.nombre || ''} {user?.apellido || ''}</ThemedText>
          </ThemedView>

          <ThemedText style={styles.label}>Email</ThemedText>
          <ThemedView style={styles.disabledInput}>
            <ThemedText>{user?.email || ''}</ThemedText>
          </ThemedView>

          <ThemedText style={styles.label}>Teléfono <ThemedText style={styles.required}>*</ThemedText></ThemedText>
          <TextInput
            value={telefono}
            onChangeText={setTelefono}
            placeholder="3001234567"
            keyboardType="phone-pad"
            style={styles.input}
          />

          {/* ── MÉTODO DE PAGO ──────────────────────────────────── */}
          <ThemedText style={styles.label}>Método de Pago <ThemedText style={styles.required}>*</ThemedText></ThemedText>
          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map((method) => {
              const selected = method.key === metodoPago;
              return (
                <Pressable
                  key={method.key}
                  onPress={() => setMetodoPago(method.key)}
                  style={[
                    styles.paymentChip,
                    selected && { borderColor: method.color, backgroundColor: method.color + '15' },
                  ]}>
                  <Ionicons name={method.icon as any} size={18} color={selected ? method.color : '#888'} />
                  <ThemedText style={selected ? { color: method.color, fontWeight: '700' } : undefined}>
                    {method.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          {metodoPago === 'whatsapp' && (
            <ThemedText style={styles.infoText}>
              Al confirmar, se abrirá WhatsApp para coordinar el pago con la tienda.
            </ThemedText>
          )}

          <ThemedText style={styles.label}>Notas adicionales (opcional)</ThemedText>
          <TextInput
            value={notasAdicionales}
            onChangeText={setNotasAdicionales}
            placeholder="Ej: Prefiero recoger en la tarde"
            style={[styles.input, styles.multiline]}
            multiline
          />
        </ThemedView>

        {/* ── RESUMEN ────────────────────────────────────────────── */}
        <ThemedView style={styles.summary}>
          <ThemedText type="defaultSemiBold">Resumen del Pedido</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText>{items.length} producto(s)</ThemedText>
            <ThemedText style={styles.summaryLabel}>Subtotal: {fmt(total)}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Modalidad:</ThemedText>
            <ThemedText style={styles.verde}>Aliste y recoja</ThemedText>
          </View>
          <ThemedText style={styles.total}>Total a pagar: {fmt(total)}</ThemedText>
        </ThemedView>

        {/* ── BOTÓN CONFIRMAR ──────────────────────────────────── */}
        <Pressable
          style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
          onPress={handleConfirm}
          disabled={!canSubmit}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <ThemedText style={styles.primaryButtonText}>
            {submitting ? 'Procesando...' : 'Confirmar Pedido'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  subtitle: { color: '#666' },
  verde: { color: '#28a745', fontWeight: '600' },
  label: { marginTop: 6, fontWeight: '600' },
  required: { color: '#e74c3c' },
  section: { borderRadius: 12, padding: 12, gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  disabledInput: {
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#d2d2d2',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  infoText: { color: '#25D366', fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  summary: {
    borderWidth: 1,
    borderColor: '#dceeff',
    backgroundColor: '#f6fbff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#555' },
  total: { fontSize: 18, fontWeight: '700', color: '#28a745', marginTop: 4 },
  primaryButton: {
    flexDirection: 'row',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#28a745',
  },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#e74c3c', fontWeight: '600' },
});