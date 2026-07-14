import React from 'react';
import { View, Text } from 'react-native';
import { CalendarDays, TrendingUp, Sparkles } from 'lucide-react-native';
import { weeklySummary, moodPracticeCorrelation } from '../lib/journalInsights';

// Frase da correlação humor × prática, no tom acolhedor do app.
function correlationLine(corr) {
  if (!corr) return null;
  const delta = Math.abs(corr.diff).toFixed(1);
  if (corr.diff >= 0.3) {
    return `Nos dias em que você fez uma prática, seu humor médio foi ${delta} ponto${delta === '1.0' ? '' : 's'} maior. 💚`;
  }
  if (corr.diff <= -0.3) {
    return 'Nos dias mais difíceis você tem buscado as práticas — cuidar de si nos momentos duros já é uma vitória. 💙';
  }
  return 'Seu humor tem se mantido parecido com e sem práticas. Continue observando. 🌱';
}

function Stat({ icon: Icon, value, label }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Icon size={18} color="#3D7A67" />
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1C1917', marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#A29D95', marginTop: 1, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

/**
 * Card "Sua semana": resumo dos últimos 7 dias + correlação humor × prática.
 * Renderiza nada se não houver registros na semana.
 *
 * @param {Array} entries Entradas do diário.
 * @param {Set<string>} [practiceDates] Datas com prática (para a correlação).
 * @param {object} [containerStyle]
 */
export default function WeeklyInsights({ entries = [], practiceDates, containerStyle }) {
  const summary = weeklySummary(entries);
  if (!summary) return null;

  const corr = moodPracticeCorrelation(entries, practiceDates);
  const corrText = correlationLine(corr);

  const bestDay = summary.bestDayLabel.charAt(0).toUpperCase() + summary.bestDayLabel.slice(1);

  return (
    <View
      style={[
        { backgroundColor: 'white', borderRadius: 16, padding: 16, elevation: 1 },
        containerStyle,
      ]}
      accessibilityLabel={`Resumo da semana: ${summary.count} registros, humor médio ${summary.avgMood.toFixed(1)}, melhor dia ${bestDay}`}
    >
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#1C1917', marginBottom: 14 }}>Sua semana</Text>

      <View style={{ flexDirection: 'row' }}>
        <Stat icon={CalendarDays} value={summary.count} label={summary.count === 1 ? 'registro' : 'registros'} />
        <Stat icon={TrendingUp} value={`${summary.avgEmoji} ${summary.avgMood.toFixed(1)}`} label="humor médio" />
        <Stat icon={Sparkles} value={bestDay} label="melhor dia" />
      </View>

      {corrText && (
        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1EEE9' }}>
          <Text style={{ fontSize: 12, color: '#756F66', lineHeight: 18 }}>{corrText}</Text>
        </View>
      )}
    </View>
  );
}
