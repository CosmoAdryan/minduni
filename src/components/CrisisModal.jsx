import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Linking, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Phone, Heart, CheckSquare, Square } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_H } = Dimensions.get('window');

export default function CrisisModal({ visible, onClose }) {
  const [acknowledged, setAcknowledged] = useState(false);

  const translateY = useSharedValue(SCREEN_H);
  const backdrop = useSharedValue(0);
  const cbScale = useSharedValue(1);

  // Entrada: backdrop em fade + sheet sobe com easing suave, SEM overshoot/bounce
  // — o contexto é sério e não combina com animação "saltitante".
  // Sem swipe-to-dismiss, sem botão X.
  useEffect(() => {
    if (visible) {
      setAcknowledged(false);
      translateY.value = SCREEN_H;
      backdrop.value = withTiming(0.72, { duration: 300 });
      translateY.value = withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) });
    }
  }, [visible]);

  function finishClose() {
    setAcknowledged(false);
    onClose();
  }

  function handleClose() {
    // Saída: sheet desce, backdrop faz fade-out, depois desmonta.
    backdrop.value = withTiming(0, { duration: 280 });
    translateY.value = withTiming(SCREEN_H, { duration: 280 }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }

  function toggleAck() {
    const next = !acknowledged;
    setAcknowledged(next);
    if (next) {
      cbScale.value = withSequence(
        withTiming(0.85, { duration: 80 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const cbStyle = useAnimatedStyle(() => ({ transform: [{ scale: cbScale.value }] }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {/* Bloqueia o botão voltar do Android durante crise */}}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Backdrop — sem tap-to-dismiss (sem dispensa acidental) */}
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1C1917' }, backdropStyle]}
        />

        {/* Bottom sheet */}
        <Animated.View
          style={[
            { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 },
            sheetStyle,
          ]}
        >
          {/* Handle */}
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E6E2DB', alignSelf: 'center', marginBottom: 18 }} />

          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FDF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Heart size={28} color="#C04A4A" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1C1917', textAlign: 'center' }}>
              Você não está sozinho(a)
            </Text>
          </View>

          <Text style={{ fontSize: 15, color: '#5A544C', lineHeight: 22, marginBottom: 24, textAlign: 'center' }}>
            Pessoas treinadas estão prontas para ouvir — agora, de graça, sem precisar se explicar.
          </Text>

          {/* CVV Button — coral quente, nunca o vermelho de alerta */}
          <TouchableOpacity
            style={{ backgroundColor: '#C04A4A', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}
            onPress={() => Linking.openURL('tel:188')}
            accessibilityLabel="Ligar para o CVV, Centro de Valorização da Vida, número 188"
            accessibilityRole="button"
            accessibilityHint="Abre uma chamada telefônica"
          >
            <Phone size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>CVV — Ligue 188</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#A29D95', textAlign: 'center', marginBottom: 20 }}>
            Centro de Valorização da Vida · Gratuito · 24 horas
          </Text>

          {/* Confirmação explícita antes de continuar */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}
            onPress={toggleAck}
            accessibilityLabel="Confirmar que vi o número do CVV"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acknowledged }}
          >
            <Animated.View style={[{ marginRight: 10 }, cbStyle]}>
              {acknowledged
                ? <CheckSquare size={22} color="#3D7A67" />
                : <Square size={22} color="#CEC9BF" />}
            </Animated.View>
            <Text style={{ fontSize: 13, color: '#5A544C', flex: 1, lineHeight: 18 }}>
              Estou ciente do CVV (188) e sei que posso ligar a qualquer momento.
            </Text>
          </TouchableOpacity>

          {/* Continue button — só ativo após confirmação */}
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: acknowledged ? '#A9D3BF' : '#E6E2DB',
              backgroundColor: acknowledged ? '#EEF5F1' : '#FAFAF8',
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: 'center',
              opacity: acknowledged ? 1 : 0.5,
            }}
            onPress={acknowledged ? handleClose : null}
            disabled={!acknowledged}
            accessibilityLabel="Continuar conversando com o Sage"
            accessibilityRole="button"
            accessibilityState={{ disabled: !acknowledged }}
          >
            <Text style={{ color: acknowledged ? '#2D6254' : '#A29D95', fontWeight: '600' }}>
              Continuar com o Sage
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
