// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/pedido-confirmado.tsx - MarketCOL
// PROPÓSITO: Pantalla de confirmación tras realizar un pedido.
//   - Muestra el ID del pedido, estado, método de pago y total.
//   - Ofrece botón de WhatsApp si el pago está pendiente.
//   - Modalidad: Aliste y Recoja.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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

type EstadoInfo = {
  color: string;
  label: string;
  icon: string;
};

function formatCOP(value: unknown) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO DEL PEDIDO
// ─────────────────────────────────────────────────────────────────────────────

const getEstadoBadge = (estado: string): EstadoInfo => {
  const mapping: Record<string, EstadoInfo> = {
    pendiente: {
      color: '#f59e0b',
      label: 'Pendiente',
      icon: 'time-outline',
    },
    preparando: {
      color: '#3b82f6',
      label: 'Preparando',
      icon: 'construct-outline',
    },
    listo: {
      color: '#28a745',
      label: 'Listo para recoger',
      icon: 'checkmark-circle-outline',
    },
    entregado: {
      color: '#10b981',
      label: 'Entregado',
      icon: 'home-outline',
    },
    cancelado: {
      color: '#ef4444',
      label: 'Cancelado',
      icon: 'close-circle-outline',
    },
  };

  return (
    mapping[estado] || {
      color: '#6b7280',
      label: estado || 'Desconocido',
      icon: 'help-circle-outline',
    }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VISTA DE CARGA
// ─────────────────────────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#D92B2B" />
      <ThemedText>
        Cargando información del pedido...
      </ThemedText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BANNER DE CONFIRMACIÓN
// ─────────────────────────────────────────────────────────────────────────────

type ConfirmationBannerProps = {
  pagoPendiente: boolean;
};

function ConfirmationBanner({
  pagoPendiente,
}: ConfirmationBannerProps) {
  return (
    <ThemedView style={styles.banner}>
      <Ionicons
        name="checkmark-circle"
        size={60}
        color="#fff"
      />

      <ThemedText
        type="title"
        style={styles.bannerTitle}
      >
        ¡Pedido Recibido!
      </ThemedText>

      <ThemedText style={styles.bannerText}>
        Tu pedido ha sido registrado exitosamente.
        {'\n'}
        {pagoPendiente
          ? 'Está pendiente de confirmación de pago.'
          : null}
      </ThemedText>
    </ThemedView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO DE PAGO
// ─────────────────────────────────────────────────────────────────────────────

type PaymentStatusProps = {
  pagoPendiente: boolean;
};

function PaymentStatus({
  pagoPendiente,
}: PaymentStatusProps) {
  const backgroundColor = pagoPendiente
    ? '#fef3c7'
    : '#d1fae5';

  const iconName = pagoPendiente
    ? 'time-outline'
    : 'checkmark-circle';

  const color = pagoPendiente
    ? '#f59e0b'
    : '#28a745';

  const label = pagoPendiente
    ? 'Pendiente'
    : 'Confirmado';

  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>
        Estado de pago
      </ThemedText>

      <View
        style={[
          styles.pagoBadge,
          { backgroundColor },
        ]}
      >
        <Ionicons
          name={iconName}
          size={14}
          color={color}
        />

        <ThemedText
          style={{
            color,
            fontWeight: '600',
            fontSize: 13,
          }}
        >
          {label}
        </ThemedText>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MÉTODO DE PAGO
// ─────────────────────────────────────────────────────────────────────────────

type PaymentMethodProps = {
  metodoPago?: string;
};

function PaymentMethod({
  metodoPago,
}: PaymentMethodProps) {
  const esWhatsapp = metodoPago === 'whatsapp';

  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>
        Método de pago
      </ThemedText>

      <ThemedText style={styles.detailValue}>
        {esWhatsapp ? (
          <>
            <Ionicons
              name="logo-whatsapp"
              size={14}
              color="#25D366"
            />
            {' '}WhatsApp
          </>
        ) : (
          <>
            <Ionicons
              name="cash-outline"
              size={14}
              color="#B01F1F"
            />
            {' '}Efectivo
          </>
        )}
      </ThemedText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INFORMACIÓN DEL PEDIDO
// ─────────────────────────────────────────────────────────────────────────────

type PedidoDetailsProps = {
  pedido: Pedido;
  estadoInfo: EstadoInfo;
  pagoPendiente: boolean;
};

function PedidoDetails({
  pedido,
  estadoInfo,
  pagoPendiente,
}: PedidoDetailsProps) {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText type="defaultSemiBold">
          Pedido #{pedido.id}
        </ThemedText>

        <View
          style={[
            styles.estadoBadge,
            {
              backgroundColor:
                estadoInfo.color + '20',
            },
          ]}
        >
          <Ionicons
            name={estadoInfo.icon as any}
            size={14}
            color={estadoInfo.color}
          />

          <ThemedText
            style={[
              styles.estadoText,
              { color: estadoInfo.color },
            ]}
          >
            {estadoInfo.label}
          </ThemedText>
        </View>
      </View>

      <PaymentStatus
        pagoPendiente={pagoPendiente}
      />

      <PaymentMethod
        metodoPago={pedido.metodoPago}
      />

      <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>
          Modalidad
        </ThemedText>

        <ThemedText style={styles.detailValueVerde}>
          <Ionicons
            name="storefront-outline"
            size={14}
            color="#D92B2B"
          />
          {' '}Aliste y recoja
        </ThemedText>
      </View>

      <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>
          Teléfono
        </ThemedText>

        <ThemedText style={styles.detailValue}>
          {pedido.telefono || '—'}
        </ThemedText>
      </View>

      <PedidoNotes notas={pedido.notas} />

      <View style={styles.separator} />

      <ThemedText style={styles.total}>
        Total a pagar: {formatCOP(pedido.total)}
      </ThemedText>
    </ThemedView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTAS DEL PEDIDO
// ─────────────────────────────────────────────────────────────────────────────

type PedidoNotesProps = {
  notas?: string;
};

function PedidoNotes({ notas }: PedidoNotesProps) {
  if (!notas) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>
        Notas
      </ThemedText>

      <ThemedText style={styles.detailValue}>
        {notas}
      </ThemedText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERTA DE PEDIDO LISTO
// ─────────────────────────────────────────────────────────────────────────────

function PedidoListoAlert() {
  return (
    <View style={styles.alertaListo}>
      <Ionicons
        name="checkmark-circle"
        size={24}
        color="#D92B2B"
      />

      <ThemedText style={styles.alertaListoText}>
        ¡Tu pedido está listo! Puedes pasar a recogerlo
        en la tienda.
      </ThemedText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTÓN DE WHATSAPP
// ─────────────────────────────────────────────────────────────────────────────

type WhatsAppButtonProps = {
  onPress: () => void;
};

function WhatsAppButton({
  onPress,
}: WhatsAppButtonProps) {
  return (
    <Pressable
      style={styles.whatsappButton}
      onPress={onPress}
    >
      <Ionicons
        name="logo-whatsapp"
        size={22}
        color="#fff"
      />

      <ThemedText style={styles.whatsappButtonText}>
        Contactar por WhatsApp
      </ThemedText>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

function MisPedidosButton() {
  const handlePress = () => {
    router.replace('/mis-pedidos');
  };

  return (
    <Pressable
      style={styles.primaryButton}
      onPress={handlePress}
    >
      <Ionicons
        name="list-outline"
        size={18}
        color="#fff"
      />

      <ThemedText style={styles.primaryButtonText}>
        Ver mis pedidos
      </ThemedText>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function PedidoConfirmadoScreen() {
  const { pedidoId } = useLocalSearchParams();

  const [pedido, setPedido] =
    useState<Pedido | null>(null);

  const [loading, setLoading] =
    useState(Boolean(pedidoId));

  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    const loadPedido = async () => {
      if (!pedidoId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const data =
          await pedidoService.getPedidoById(
            pedidoId as string
          );

        setPedido(data);
      } catch (error: unknown) {
        const message =
          (error as { message?: string })
            ?.message ||
          'No se pudo cargar el pedido.';

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    };

    loadPedido();
  }, [pedidoId]);

  const handleWhatsApp = () => {
    const defaultLink =
      `https://wa.me/573001234567?text=` +
      `Hola%20MerkaCiro,%20mi%20pedido%20%23` +
      `${pedido?.id}%20está%20pendiente%20de%20pago.`;

    const link =
      pedido?.linkPago || defaultLink;

    Linking.openURL(link).catch(() => {
      Alert.alert(
        'WhatsApp',
        'No se pudo abrir WhatsApp. Contacta a la tienda manualmente.'
      );
    });
  };

  if (loading) {
    return <LoadingView />;
  }

  const pagoPendiente =
    pedido?.estadoPago === 'pendiente';

  const pedidoListo =
    pedido?.estado === 'listo';

  const estadoInfo =
    getEstadoBadge(
      pedido?.estado || 'pendiente'
    );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <ConfirmationBanner
        pagoPendiente={pagoPendiente}
      />

      <ErrorMessage
        message={errorMessage}
      />

      <PedidoContent
        pedido={pedido}
        estadoInfo={estadoInfo}
        pagoPendiente={pagoPendiente}
        pedidoListo={pedidoListo}
        onWhatsApp={handleWhatsApp}
      />

      <MisPedidosButton />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENIDO CONDICIONAL DEL PEDIDO
// ─────────────────────────────────────────────────────────────────────────────

type PedidoContentProps = {
  pedido: Pedido | null;
  estadoInfo: EstadoInfo;
  pagoPendiente: boolean;
  pedidoListo: boolean;
  onWhatsApp: () => void;
};

function PedidoContent({
  pedido,
  estadoInfo,
  pagoPendiente,
  pedidoListo,
  onWhatsApp,
}: PedidoContentProps) {
  return (
    <>
      {pedido ? (
        <PedidoDetails
          pedido={pedido}
          estadoInfo={estadoInfo}
          pagoPendiente={pagoPendiente}
        />
      ) : null}

      {pedidoListo ? (
        <PedidoListoAlert />
      ) : null}

      {pagoPendiente &&
      pedido?.metodoPago === 'whatsapp' ? (
        <WhatsAppButton
          onPress={onWhatsApp}
        />
      ) : null}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MENSAJE DE ERROR
// ─────────────────────────────────────────────────────────────────────────────

type ErrorMessageProps = {
  message: string;
};

function ErrorMessage({
  message,
}: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <ThemedText style={styles.error}>
      {message}
    </ThemedText>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 16,
    gap: 16,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },

  banner: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#D92B2B',
    alignItems: 'center',
    gap: 10,
  },

  bannerTitle: {
    color: '#fff',
    fontSize: 24,
  },

  bannerText: {
    color: '#fee2e2',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },

  card: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    gap: 10,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  estadoText: {
    fontWeight: '600',
    fontSize: 12,
  },

  pagoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  detailLabel: {
    color: '#6b7280',
    fontSize: 13,
  },

  detailValue: {
    fontWeight: '500',
    fontSize: 13,
  },

  detailValueVerde: {
    fontWeight: '500',
    fontSize: 13,
    color: '#D92B2B',
  },

  separator: {
    height: 1,
    backgroundColor: '#e8e8e8',
  },

  total: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D92B2B',
    textAlign: 'right',
  },

  alertaListo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 14,
  },

  alertaListoText: {
    flex: 1,
    color: '#7f1d1d',
    fontWeight: '600',
    fontSize: 14,
  },

  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: '#25D366',
    paddingVertical: 14,
  },

  whatsappButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: '#D92B2B',
    paddingVertical: 14,
  },

  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D92B2B',
    paddingVertical: 14,
  },

  secondaryButtonText: {
    color: '#D92B2B',
    fontWeight: '600',
    fontSize: 16,
  },

  error: {
    color: '#ef4444',
    fontWeight: '600',
  },
});