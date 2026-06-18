import React from 'react';
import { TouchableOpacity, Text, Linking } from 'react-native';
import { Phone } from 'lucide-react-native';
import { crisis } from '../theme/tokens';

/**
 * CVVButton — pílula coral discreta com o número do CVV (188).
 * Princípio ético não-negociável: precisa estar visível em TODAS as telas de
 * interação com o Sage e nunca pode sumir em scroll, loading ou erro.
 * Coral quente, nunca o vermelho de alerta.
 */
export default function CVVButton({ compact = false }) {
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL('tel:188')}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: crisis.light,
        borderWidth: 1,
        borderColor: crisis.border,
        paddingHorizontal: compact ? 10 : 12,
        paddingVertical: 6,
        borderRadius: 999,
        gap: 5,
      }}
      accessibilityLabel="Ligar para o CVV, número 188"
      accessibilityRole="button"
      accessibilityHint="Abre uma chamada telefônica para o Centro de Valorização da Vida"
    >
      <Phone size={13} color={crisis.main} />
      <Text style={{ color: crisis.main, fontWeight: '700', fontSize: 12 }}>
        CVV 188
      </Text>
    </TouchableOpacity>
  );
}
