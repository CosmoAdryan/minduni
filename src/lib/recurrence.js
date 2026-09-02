// Expansão de tarefas recorrentes em ocorrências por dia. Puro e testável —
// sem dependência de rede ou de Date "agora" (as datas entram como argumento).
//
// As datas trafegam como strings 'YYYY-MM-DD' (o Postgres devolve colunas `date`
// nesse formato). Comparações lexicais entre strings ISO equivalem a comparar as
// datas — por isso não convertemos para Date só para comparar intervalos.

// Date (meia-noite local) -> 'YYYY-MM-DD'. Local, não UTC: evita o "voltar um
// dia" clássico de toISOString() em fusos negativos como o do Brasil.
export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 'YYYY-MM-DD' -> Date à meia-noite local.
export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Dia da semana (0=domingo..6=sábado) de uma data ISO.
export function weekdayOf(iso) {
  return fromISODate(iso).getDay();
}

// Uma tarefa gera ocorrência num dado dia?
//   none   -> exatamente na data agendada
//   daily  -> todo dia a partir da data agendada (respeita recurrence_until)
//   weekly -> mesmo dia da semana da data agendada, a partir dela
// Tarefas arquivadas (archived_at) nunca ocorrem.
export function occursOn(task, iso) {
  if (!task || task.archived_at) return false;
  const start = task.scheduled_date;
  if (!start || iso < start) return false;
  const until = task.recurrence_until;
  if (until && iso > until) return false;

  switch (task.recurrence) {
    case 'daily':
      return true;
    case 'weekly':
      return weekdayOf(iso) === weekdayOf(start);
    case 'none':
    default:
      return iso === start;
  }
}

// Índice de conclusões por 'taskId|isoDate' -> linha da conclusão.
function indexCompletions(completions) {
  const map = new Map();
  for (const c of completions || []) {
    map.set(`${c.task_id}|${c.occurrence_date}`, c);
  }
  return map;
}

// Itera os dias do intervalo [fromISO, toISO] (inclusivo), chamando fn(isoDate).
function eachDay(fromISO, toISO, fn) {
  if (fromISO > toISO) return;
  const end = fromISODate(toISO);
  for (let d = fromISODate(fromISO); d <= end; d.setDate(d.getDate() + 1)) {
    fn(toISODate(d));
  }
}

// Expande as tarefas em ocorrências concretas dentro do intervalo.
// Retorna [{ task, date, done, completionId, time }] ordenado por (date, hora).
export function expandOccurrences(tasks, completions, fromISO, toISO) {
  const byKey = indexCompletions(completions);
  const out = [];

  for (const task of tasks || []) {
    eachDay(fromISO, toISO, (iso) => {
      if (!occursOn(task, iso)) return;
      const comp = byKey.get(`${task.id}|${iso}`);
      out.push({
        task,
        date: iso,
        time: task.scheduled_time ?? null,
        done: comp ? comp.done : false,
        completionId: comp ? comp.id : null,
      });
    });
  }

  out.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const ta = a.time ?? '99:99';
    const tb = b.time ?? '99:99';
    if (ta !== tb) return ta < tb ? -1 : 1;
    return (a.task.title || '').localeCompare(b.task.title || '');
  });
  return out;
}

// Ocorrências de um único dia (conveniência para a lista da agenda / widget).
export function occurrencesForDay(tasks, completions, iso) {
  return expandOccurrences(tasks, completions, iso, iso);
}

// Conjunto de datas ISO que têm ao menos uma ocorrência no intervalo — usado
// para marcar (pontinho) os dias no calendário. Não precisa de conclusões.
export function occurrenceDatesInRange(tasks, fromISO, toISO) {
  const dates = new Set();
  for (const task of tasks || []) {
    eachDay(fromISO, toISO, (iso) => {
      if (occursOn(task, iso)) dates.add(iso);
    });
  }
  return dates;
}
