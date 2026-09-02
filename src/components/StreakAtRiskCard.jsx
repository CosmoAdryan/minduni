import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Flame } from 'lucide-react-native';

/**
 * StreakAtRiskCard — aparece no Dashboard quando há uma sequência ativa que
 * ainda não foi garantida hoje. Tom de incentivo (não punitivo): oferece a ação
 * de manter a sequência. Tocar chama onSecure (aplica o login do dia, +10 XP).
 */
export default function StreakAtRiskCard({ streak, onSecure, securing }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSecure}
      disabled={securing}
      accessibilityRole="button"
      accessibilityLabel={`Sua sequência de ${streak} ${streak === 1 ? 'dia' : 'dias'} está em risco. Toque para manter.`}
      style={{
        backgroundColor: '#FFF7ED',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FED7AA',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 38, height: 38, borderRadius: 11,
          backgroundColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Flame size={18} color="#F97316" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#9A3412' }}>
          Sequência de {streak} {streak === 1 ? 'dia' : 'dias'} em risco
        </Text>
        <Text style={{ fontSize: 11, color: '#C2691C' }}>Garanta seu dia para manter a chama acesa 🔥</Text>
      </View>
      <View style={{ backgroundColor: '#F97316', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, minWidth: 72, alignItems: 'center' }}>
        {securing
          ? <ActivityIndicator size="small" color="white" />
          : <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>Manter</Text>}
      </View>
    </TouchableOpacity>
  );
}
