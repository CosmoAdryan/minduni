// Cálculos puros sobre as entradas do diário — sem I/O, para serem testáveis e
// reaproveitados na UI (Home e Diário). Uma entrada tem { mood: 1..5, date }.

export const MOOD_EMOJIS = ['😢', '😔', '😐', '😊', '😄'];
const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const clampMood = (v) => Math.min(5, Math.max(1, Math.round(v)));
export const moodEmoji = (avg) => MOOD_EMOJIS[clampMood(avg) - 1];

// Chave de dia no fuso LOCAL — usada no que o usuário vê (resumo e streak),
// para casar com o gráfico de humor que também agrupa por dia local.
export function localDayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Chave de dia em UTC — usada SÓ na correlação, para casar com o formato
// gravado em challenge_logs.completed_date (toISOString().split('T')[0]).
export function utcDayKey(date) {
  return new Date(date).toISOString().split('T')[0];
}

const validEntries = (entries) =>
  (entries || []).filter((e) => e?.date && Number.isFinite(e?.mood) && e.mood >= 1 && e.mood <= 5);

const mean = (arr) => arr.reduce((s, n) => s + n, 0) / arr.length;

// Média de humor por dia (mapa chave→média) a partir de uma função de chave.
function dailyAverages(entries, keyFn) {
  const byDay = new Map();
  for (const e of entries) {
    const key = keyFn(e.date);
    const cur = byDay.get(key) || { sum: 0, count: 0, ts: 0 };
    cur.sum += e.mood;
    cur.count += 1;
    cur.ts = Math.max(cur.ts, new Date(e.date).getTime());
    byDay.set(key, cur);
  }
  return byDay;
}

/**
 * Resumo dos últimos 7 dias (incluindo hoje): quantos registros, humor médio e
 * o melhor dia da semana. Retorna null se não houver registro no período.
 */
export function weeklySummary(entries, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 6);

  const recent = validEntries(entries).filter((e) => new Date(e.date) >= cutoff);
  if (recent.length === 0) return null;

  const avgMood = mean(recent.map((e) => e.mood));

  const byDay = dailyAverages(recent, localDayKey);
  let best = null;
  for (const v of byDay.values()) {
    const avg = v.sum / v.count;
    // Empate: fica com o dia mais recente.
    if (!best || avg > best.avg || (avg === best.avg && v.ts > best.ts)) {
      best = { avg, ts: v.ts };
    }
  }

  return {
    count: recent.length,
    days: byDay.size,
    avgMood,
    avgEmoji: moodEmoji(avgMood),
    bestDayLabel: WEEKDAYS[new Date(best.ts).getDay()],
    bestDayAvg: best.avg,
    bestDayEmoji: moodEmoji(best.avg),
  };
}

/**
 * Sequência de dias consecutivos com pelo menos um registro no diário,
 * terminando em hoje ou ontem (senão a sequência foi quebrada → 0).
 * Independente do streak de login.
 */
export function journalStreak(entries, now = new Date()) {
  const keys = new Set(validEntries(entries).map((e) => localDayKey(e.date)));
  if (keys.size === 0) return 0;

  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  // Se não escreveu hoje, a contagem só continua válida se escreveu ontem.
  if (!keys.has(localDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!keys.has(localDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (keys.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Correlação humor × prática: compara o humor médio dos dias em que o usuário
 * concluiu alguma prática com o dos dias em que não concluiu.
 *
 * @param {Array} entries Entradas do diário.
 * @param {Set<string>} practiceDays Datas 'YYYY-MM-DD' (UTC) com prática concluída.
 * @param {number} minDays Mínimo de dias em cada grupo para o dado ser confiável.
 * @returns {{meanWith, meanWithout, diff, daysWith, daysWithout} | null}
 */
export function moodPracticeCorrelation(entries, practiceDays, minDays = 2) {
  const set = practiceDays instanceof Set ? practiceDays : new Set(practiceDays || []);
  const byDay = dailyAverages(validEntries(entries), utcDayKey);

  const withP = [];
  const withoutP = [];
  for (const [key, v] of byDay) {
    (set.has(key) ? withP : withoutP).push(v.sum / v.count);
  }

  // Sem os dois grupos com amostra mínima, a comparação não diz nada.
  if (withP.length < minDays || withoutP.length < minDays) return null;

  const meanWith = mean(withP);
  const meanWithout = mean(withoutP);
  return {
    meanWith,
    meanWithout,
    diff: meanWith - meanWithout,
    daysWith: withP.length,
    daysWithout: withoutP.length,
  };
}
