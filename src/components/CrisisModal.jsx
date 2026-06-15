import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Linking, Animated, Easing, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Phone, Info, Check } from 'lucide-react-native';
import { T, SAGE_FONT } from '../theme';

const { height: SCREEN_H } = Dimensions.get('window');

/**
 * CrisisModal — bottom sheet de presença em momentos de risco.
 * Regras éticas (não-negociáveis):
 *  - Sem botão X, sem swipe-to-dismiss.
 *  - "Continuar com o Sage" só habilita após o acknowledgment.
 *  - Botão CVV 188 em coral (não vermelho de alarme).
 *  - Após confirmar, o pin do CVV persiste no header do chat pela sessão.
 */
export default function CrisisModal({ visible, onClose }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 180, mass: 1, useNativeDriver: true }),
      ]).start();
    } else {
      translateY.setValue(SCREEN_H);
      backdrop.setValue(0);
    }
  }, [visible]);

  function toggleAck() {
    const next = !acknowledged;
    setAcknowledged(next);
    if (next) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }

  function handleClose() {
    setAcknowledged(false);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {/* Bloqueia o voltar do Android durante a crise */}}
    >
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(28,25,23,0.72)', opacity: backdrop, justifyContent: 'flex-end' }}>
        <Animated.View
          style={{
            backgroundColor: '#FEFDF9',
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32,
            transform: [{ translateY }],
          }}
        >
          {/* Handle */}
          <View style={{ width: 36, height: 4, backgroundColor: T.s200, borderRadius: 2, alignSelf: 'center', marginBottom: 18 }} />

          {/* Ícone */}
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: T.g50, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 }}>
            <Info size={24} color={T.g500} />
          </View>

          <Text style={{ fontSize: 16, fontWeight: '800', color: T.s900, textAlign: 'center', marginBottom: 8 }}>
            Você não está sozinho
          </Text>
          <Text style={{ fontFamily: SAGE_FONT, fontStyle: 'italic', fontSize: 13, color: T.s500, textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
            Pessoas treinadas estão prontas para ouvir — agora, de graça, sem precisar se explicar.
          </Text>

          {/* CVV button — coral */}
          <TouchableOpacity
            style={{ backgroundColor: T.cr, borderRadius: 13, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 6 }}
            onPress={() => Linking.openURL('tel:188')}
            accessibilityLabel="Ligar para o CVV - 188"
            accessibilityRole="button"
            accessibilityHint="Abre chamada telefônica"
          >
            <Phone size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>CVV — Ligue 188</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 10, color: T.s400, textAlign: 'center', marginBottom: 16 }}>
            Gratuito · 24 horas · Confidencial
          </Text>

          {/* Acknowledgment obrigatório */}
          <TouchableOpacity
            style={{ flexDirection: 'row', gap: 10, padding: 12, backgroundColor: T.s50, borderRadius: 12, borderWidth: 1, borderColor: acknowledged ? T.g200 : T.s200, marginBottom: 14, alignItems: 'flex-start' }}
            onPress={toggleAck}
            accessibilityLabel="Estou ciente do CVV 188"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acknowledged }}
          >
            <View style={{ width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: acknowledged ? T.g500 : T.s300, backgroundColor: acknowledged ? T.g500 : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
              {acknowledged && <Check size={11} color="#fff" strokeWidth={3} />}
            </View>
            <Text style={{ fontSize: 12, color: T.s600, lineHeight: 18, flex: 1 }}>
              Estou ciente do CVV (188) e sei que posso ligar quando precisar.
            </Text>
          </TouchableOpacity>

          {/* Continuar — só ativo após acknowledgment */}
          <TouchableOpacity
            style={{
              borderRadius: 12, paddingVertical: 14, alignItems: 'center',
              backgroundColor: acknowledged ? T.g500 : 'transparent',
              borderWidth: acknowledged ? 0 : 1.5, borderColor: T.s200,
              opacity: acknowledged ? 1 : 0.5,
            }}
            onPress={acknowledged ? handleClose : null}
            disabled={!acknowledged}
            accessibilityLabel="Continuar com o Sage"
            accessibilityRole="button"
            accessibilityState={{ disabled: !acknowledged }}
          >
            <Text style={{ color: acknowledged ? '#fff' : T.s400, fontWeight: '700', fontSize: 13 }}>
              Continuar com o Sage
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
