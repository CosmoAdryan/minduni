import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Linking } from 'react-native';
import { Phone, Heart, CheckSquare, Square } from 'lucide-react-native';

export default function CrisisModal({ visible, onClose }) {
  const [acknowledged, setAcknowledged] = useState(false);

  function handleClose() {
    setAcknowledged(false);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {/* Bloqueia o botão voltar do Android durante crise */}}
    >
      <View
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24 }}>
          {/* Header — sem botão X para evitar dispensa rápida */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
            >
              <Heart size={28} color="#EF4444" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937', textAlign: 'center' }}>
              Você não está sozinho(a)
            </Text>
          </View>

          <Text style={{ fontSize: 15, color: '#6B7280', lineHeight: 22, marginBottom: 24, textAlign: 'center' }}>
            Percebi que você pode estar passando por um momento muito difícil. Há pessoas treinadas e prontas para te ouvir agora, de graça.
          </Text>

          {/* CVV Button */}
          <TouchableOpacity
            style={{ backgroundColor: '#EF4444', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}
            onPress={() => Linking.openURL('tel:188')}
            accessibilityLabel="Ligar para o CVV, Centro de Valorização da Vida, número 188"
            accessibilityRole="button"
          >
            <Phone size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>CVV — Ligue 188</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 }}>
            Centro de Valorização da Vida · Gratuito · 24 horas
          </Text>

          {/* Confirmação explícita antes de continuar */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}
            onPress={() => setAcknowledged(!acknowledged)}
            accessibilityLabel="Confirmar que vi o número do CVV"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acknowledged }}
          >
            {acknowledged
              ? <CheckSquare size={22} color="#8B5CF6" style={{ marginRight: 10 }} />
              : <Square size={22} color="#D1D5DB" style={{ marginRight: 10 }} />
            }
            <Text style={{ fontSize: 13, color: '#4B5563', flex: 1, lineHeight: 18 }}>
              Estou ciente do CVV (188) e sei que posso ligar a qualquer momento.
            </Text>
          </TouchableOpacity>

          {/* Continue button — só ativo após confirmação */}
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: acknowledged ? '#C4B5FD' : '#E5E7EB',
              backgroundColor: acknowledged ? '#F5F3FF' : '#F9FAFB',
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
            <Text style={{ color: acknowledged ? '#7C3AED' : '#9CA3AF', fontWeight: '600' }}>
              Continuar com o Sage
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
