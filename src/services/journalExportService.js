import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Exporta o diário como PDF (reforço ao direito de portabilidade — LGPD).
const MOOD_LABELS = ['Muito mal', 'Mal', 'Neutro', 'Bem', 'Ótimo'];
const MOOD_EMOJIS = ['😢', '😔', '😐', '😊', '😄'];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function moodIndex(mood) {
  return Math.min(5, Math.max(1, Math.round(mood))) - 1;
}

// Monta o HTML do diário. Pura e testável (sem I/O nativo).
export function buildJournalHtml(entries, userName, now = new Date()) {
  const rows = (entries || [])
    .filter((e) => e && Number.isFinite(e.mood))
    .map((e) => {
      const idx = moodIndex(e.mood);
      const date = new Date(e.date).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      const body = escapeHtml(e.text || '').replace(/\n/g, '<br>');
      return `<div class="entry">
        <div class="head"><span class="date">${date}</span><span class="emoji">${MOOD_EMOJIS[idx]}</span><span class="mood">${MOOD_LABELS[idx]}</span></div>
        <p class="text">${body}</p>
      </div>`;
    })
    .join('');

  const exportedAt = now.toLocaleDateString('pt-BR');
  const name = escapeHtml(userName || '');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: -apple-system, Roboto, "Segoe UI", sans-serif; color: #1C1917; padding: 24px; }
    h1 { color: #3D7A67; font-size: 22px; margin: 0 0 2px; }
    .sub { color: #A29D95; font-size: 12px; margin-bottom: 20px; }
    .entry { border: 1px solid #E6E2DB; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; }
    .head { margin-bottom: 6px; }
    .emoji { font-size: 16px; margin-right: 6px; }
    .mood { font-weight: 700; font-size: 13px; }
    .date { color: #A29D95; font-size: 12px; float: right; }
    .text { font-size: 14px; line-height: 1.5; color: #57534E; margin: 0; }
    .empty { color: #A29D95; }
  </style></head><body>
    <h1>Meu Diário — MindUni</h1>
    <div class="sub">${name ? name + ' · ' : ''}Exportado em ${exportedAt}</div>
    ${rows || '<p class="empty">Nenhuma entrada registrada.</p>'}
  </body></html>`;
}

// Gera o PDF e abre a folha de compartilhamento. Retorna o uri gerado.
export async function exportJournalPdf(entries, userName) {
  const html = buildJournalHtml(entries, userName);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar diário',
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}
