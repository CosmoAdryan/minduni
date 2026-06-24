import React from 'react';
import { View, Text } from 'react-native';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
// Escala Jonauskaite (2020) — tristeza é azul profundo, nunca vermelho.
const MOOD_COLORS = ['#3B6FAB', '#6B8FAB', '#888787', '#5E9B84', '#C9963A'];
const MOOD_EMOJIS = ['😢', '😔', '😐', '😊', '😄'];

// Geometria do gráfico (pílulas com trilho de fundo).
const TRACK_H = 64;
const BAR_W = 14;
const RADIUS = BAR_W / 2;

function insightFor(avg) {
  if (avg >= 4) return 'Semana ótima! Continue assim 🌟';
  if (avg >= 3) return 'Semana estável. Pequenos passos importam 💚';
  return 'Semana difícil. Falar com o Sage pode ajudar 💙';
}

// Chave de dia no fuso local (agrupa registros do mesmo dia do calendário).
function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const clampMood = (v) => Math.min(5, Math.max(1, Math.round(v)));

/**
 * Gráfico de "Humor recente" compartilhado entre a Home e o Diário.
 * Recebe registros brutos e exibe UMA coluna por dia (média do dia),
 * limitada aos últimos 7 dias distintos. Vários registros no mesmo dia
 * são preservados no armazenamento — aqui só a média é exibida.
 *
 * @param {Array<{date: string|number, mood: number}>} data Registros (ordem livre).
 * @param {object} [containerStyle] Estilo extra para o card (ex.: margem).
 */
export default function MoodChart({ data = [], containerStyle }) {
  // Agrupa por dia, calculando a média e guardando o instante mais recente
  // do dia (usado para ordenar e rotular).
  const byDay = new Map();
  for (const d of data) {
    if (!d?.date || !Number.isFinite(d?.mood) || d.mood < 1 || d.mood > 5) continue;
    const key = dayKey(d.date);
    const cur = byDay.get(key) || { sum: 0, count: 0, ts: 0 };
    cur.sum += d.mood;
    cur.count += 1;
    cur.ts = Math.max(cur.ts, new Date(d.date).getTime());
    byDay.set(key, cur);
  }

  const days = [...byDay.values()]
    .map((v) => ({ mood: v.sum / v.count, ts: v.ts }))
    .sort((a, b) => a.ts - b.ts)
    .slice(-7);

  if (days.length === 0) return null;

  const avg = days.reduce((s, d) => s + d.mood, 0) / days.length;
  const avgEmoji = MOOD_EMOJIS[clampMood(avg) - 1];

  return (
    <View
      style={[
        { backgroundColor: 'white', borderRadius: 16, padding: 16, elevation: 1 },
        containerStyle,
      ]}
    >
      {/* Cabeçalho */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#1C1917' }}>Humor recente</Text>
        <Text style={{ fontSize: 12, color: '#3D7A67', fontWeight: '600' }}>
          Média: {avgEmoji} {avg.toFixed(1)}
        </Text>
      </View>

      {/* Trilhos + preenchimento + linha de média */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: TRACK_H, position: 'relative' }}>
        {days.map((d, i) => {
          const fillH = Math.max(BAR_W, (d.mood / 5) * TRACK_H);
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              {/* Trilho de fundo (altura total) */}
              <View
                style={{
                  width: BAR_W,
                  height: TRACK_H,
                  borderRadius: RADIUS,
                  backgroundColor: '#F1EEE9',
                  justifyContent: 'flex-end',
                  overflow: 'hidden',
                }}
              >
                {/* Preenchimento proporcional à média do dia */}
                <View
                  style={{
                    width: BAR_W,
                    height: fillH,
                    borderRadius: RADIUS,
                    backgroundColor: MOOD_COLORS[clampMood(d.mood) - 1],
                  }}
                />
              </View>
            </View>
          );
        })}

        {/* Linha de média */}
        <View
          accessibilityLabel={`Média de humor: ${avg.toFixed(1)} de 5`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: (avg / 5) * TRACK_H,
            height: 1.5,
            backgroundColor: '#3D7A67',
            opacity: 0.45,
            borderRadius: 1,
          }}
        />
      </View>

      {/* Rótulos dos dias */}
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {days.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, color: '#A29D95' }}>
              {DAY_LABELS[new Date(d.ts).getDay()]}
            </Text>
          </View>
        ))}
      </View>

      {/* Insight */}
      <Text style={{ fontSize: 12, color: '#756F66', marginTop: 10, fontStyle: 'italic' }}>
        {insightFor(avg)}
      </Text>
    </View>
  );
}
