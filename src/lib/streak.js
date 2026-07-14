// Lógica do streak de login "em risco". O streak só é renovado quando o
// servidor aplica o login do dia (progressService.applyLogin) — no cold start
// isso não acontece, então a sequência fica em risco até ser garantida hoje.

// Data de hoje no fuso de referência do servidor (America/Sao_Paulo), YYYY-MM-DD.
// O servidor grava last_login nesse fuso; comparar no mesmo fuso evita virada de
// dia enganosa perto da meia-noite.
export function todayKeySaoPaulo(now = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    // Fallback: dia local (o usuário quase sempre está no BR, UTC-3).
    const d = now;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

// True quando há sequência (>0) e ela ainda NÃO foi garantida hoje
// (last_login != hoje). Sem last_login, considera em risco.
export function isStreakAtRisk(progress, now = new Date()) {
  const streak = progress?.streak ?? 0;
  if (streak <= 0) return false;
  const last = progress?.lastLogin;
  if (!last) return true;
  return String(last).slice(0, 10) !== todayKeySaoPaulo(now);
}
