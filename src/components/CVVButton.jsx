import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Phone } from 'lucide-react-native';
import { T } from '../theme';

/**
 * CVVButton — pílula coral sempre visível no header do Chat.
 * NUNCA pode desaparecer (scroll, loading, erro). Por padrão abre a CrisisModal
 * (acesso manual). Se onPress não for passado, liga direto para 188.
 */
export default function CVVButton({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
        backgroundColor: T.crL, borderWidth: 1, borderColor: T.crB,
      }}
      accessibilityLabel="Abrir apoio do CVV - 188"
      accessibilityRole="button"
      accessibilityHint="Abre opções de contato com o Centro de Valorização da Vida"
    >
      <Phone size={11} color={T.cr} strokeWidth={2} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: T.cr }}>188</Text>
    </TouchableOpacity>
  );
}
