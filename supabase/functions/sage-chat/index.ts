import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TEMPORÁRIO (testes): preview tem 500 req/dia no plano grátis vs 20 do
// gemini-2.5-flash. Ao ligar billing, voltar para 'gemini-2.5-flash'.
const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

const SYSTEM_PROMPT = `Você é o Sage, assistente de bem-estar emocional baseado em Terapia Cognitivo-Comportamental (TCC) para estudantes universitários brasileiros. É empático, acolhedor e sem julgamentos. Você APOIA, não substitui psicólogos.

TÉCNICAS DE TCC (use apenas estas, em linguagem simples e sem jargão): registro de pensamentos automáticos, reestruturação cognitiva, ativação comportamental, respiração diafragmática (4-4-4), relaxamento muscular progressivo, resolução de problemas (quebrar em passos), mindfulness e ancoragem (5-4-3-2-1), validação emocional, agendamento de atividades.

Ajude a identificar distorções cognitivas: catastrofização, tudo-ou-nada, filtro mental, leitura mental, adivinhação, rotulação, raciocínio emocional, personalização e declarações "deveria".

REGRAS ABSOLUTAS:
- NUNCA faça diagnósticos (depressão, ansiedade etc.) nem comente ou recomende medicamentos.
- NUNCA trate temas fora de saúde mental e bem-estar. Redirecione com gentileza.
- Sempre reforce que você é um apoio complementar, não um substituto de atendimento profissional.
- NUNCA presuma o estado emocional do usuário. Use o humor que ele informou e o que ele realmente escreveu. Se ele está bem e pede algo prático, responda de forma prática e leve, sem dramatizar.

PROTOCOLO DE CRISE (prioridade máxima): se o usuário mencionar suicídio, automutilação ou desejo de se machucar, acolha sem julgamento e responda imediatamente: "Isso é muito sério e você merece apoio especializado agora. Por favor, ligue para o CVV: 188 (24 horas, gratuito e sigiloso). Você também pode ir ao CAPS mais próximo ou a uma UPA." Não retorne à conversa normal até ele confirmar que está seguro.

FORMATO DAS RESPOSTAS (importante):
- Escreva como num chat real: mensagens curtas e humanas, no máximo 2 a 3 parágrafos de 1 a 3 frases.
- Cada parágrafo será exibido como uma bolha separada: separe parágrafos com UMA linha em branco.
- Faça no máximo UMA pergunta por resposta. Não use markdown (nada de **negrito**, listas ou asteriscos).
- Português brasileiro, linguagem simples e calorosa.`;

// Rótulos de humor compartilhados entre a saudação e o contexto da conversa.
const MOOD_LABELS: Record<number, string> = {
  1: 'muito mal (😢)',
  2: 'mal (😔)',
  3: 'neutro (😐)',
  4: 'bem (😊)',
  5: 'ótimo (😄)',
};

const CRISIS_KEYWORDS = [
  'suicídio', 'suicidio', 'me matar', 'quero morrer', 'não quero mais viver',
  'nao quero mais viver', 'me machucar', 'acabar com tudo', 'não aguento mais',
  'nao aguento mais', 'sem saída', 'sem saida', 'tirar minha vida',
  'me enforcar', 'tomar remédios', 'me cortar', 'me jogar',
];

function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

// A cada quantas mensagens do usuário o resumo rolante é regenerado.
const SUMMARY_EVERY_N_USER_MSGS = 8;

// Limites de entrada — o corpo vem do cliente e não é confiável.
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_ITEMS = 12;

// Rate limit por usuário, medido nas linhas de chat_messages (usuário + modelo).
// Uso normal fica muito abaixo; o teto protege a cota do Gemini e o banco.
const RATE_LIMIT_ROWS_PER_MIN = 20;
const RATE_LIMIT_ROWS_PER_DAY = 400;

// True se o usuário estourou o teto de mensagens (últimos 60s ou 24h).
async function isRateLimited(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [{ count: perMin }, { count: perDay }] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('created_at', minuteAgo),
    supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('created_at', dayAgo),
  ]);
  return (perMin ?? 0) >= RATE_LIMIT_ROWS_PER_MIN || (perDay ?? 0) >= RATE_LIMIT_ROWS_PER_DAY;
}

function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: 'Você enviou muitas mensagens em pouco tempo. Aguarde um pouco e tente de novo.' }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

function geminiUrl(): string {
  const key = Deno.env.get('GEMINI_API_KEY');
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
}

// Gera/atualiza o resumo rolante da conversa. Mantém a memória de longo prazo
// barata: em vez de reenviar todo o histórico, guardamos ~120 palavras de
// contexto. Tolerante a falhas — um erro aqui nunca quebra a resposta ao usuário.
async function refreshSummary(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  previousSummary: string | null,
  summarizedUntil: string | null,
) {
  try {
    // Quantas mensagens do usuário existem desde o último resumo?
    let countQuery = supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('role', 'user');
    if (summarizedUntil) countQuery = countQuery.gt('created_at', summarizedUntil);
    const { count } = await countQuery;

    if ((count ?? 0) < SUMMARY_EVERY_N_USER_MSGS) return;

    // Carrega as mensagens novas (ainda não resumidas) em ordem cronológica.
    let msgsQuery = supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (summarizedUntil) msgsQuery = msgsQuery.gt('created_at', summarizedUntil);
    const { data: newMsgs } = await msgsQuery;
    if (!newMsgs || newMsgs.length === 0) return;

    const transcript = newMsgs
      .map((m) => `${m.role === 'user' ? 'Usuário' : 'Sage'}: ${m.content}`)
      .join('\n');

    const summaryPrompt = `${previousSummary ? `Resumo anterior da conversa:\n${previousSummary}\n\n` : ''}Novas mensagens:\n${transcript}\n\nAtualize o resumo da conversa de apoio emocional em até 120 palavras, em português, 3ª pessoa. Inclua: temas trazidos, sentimentos relatados, técnicas de TCC sugeridas e combinados feitos. Não faça diagnósticos nem rótulos clínicos. Responda só com o resumo.`;

    const res = await fetch(geminiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: summaryPrompt }] }],
        // thinkingBudget 0: 2.5-flash é "thinking"; sem isso os tokens de
        // raciocínio consomem o limite e a saída vem truncada.
        generationConfig: { maxOutputTokens: 300, temperature: 0.3, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    const data = await res.json();
    const summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!res.ok || !summaryText) return;

    const lastTs = newMsgs[newMsgs.length - 1].created_at;
    await supabase
      .from('chat_sessions')
      .update({ summary: summaryText, summarized_until: lastTs })
      .eq('id', sessionId);
  } catch (err) {
    // Resumo é best-effort: logamos e seguimos sem afetar a conversa.
    console.error('refreshSummary failed:', err instanceof Error ? err.message : err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Supabase client with user JWT so RLS policies apply
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate the JWT signature against the auth server (do NOT trust the
    // unverified payload). getUser() rejects forged/expired tokens.
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Corpo inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { session_id, message, history, intro } = body;
    // Humor: só aceita inteiro 1–5; qualquer outra coisa vira null.
    const mood = Number.isInteger(body.mood) && body.mood >= 1 && body.mood <= 5 ? body.mood : null;

    // A sessão precisa existir E pertencer ao usuário. A consulta usa o client
    // com o JWT do usuário, então a RLS só enxerga as sessões dele — session_id
    // de outra pessoa retorna vazio. De quebra já traz o resumo rolante.
    if (typeof session_id !== 'string' || !session_id) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: sessionRow } = await supabase
      .from('chat_sessions')
      .select('id, summary, summarized_until')
      .eq('id', session_id)
      .maybeSingle();
    if (!sessionRow) {
      return new Response(JSON.stringify({ error: 'Conversa não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Humor opcional do check-in diário. Mantém o Sage coerente com o estado
    // real do usuário (sem presumir sobrecarga).
    const moodLabelForContext = mood ? MOOD_LABELS[mood] ?? null : null;
    const moodContext = moodLabelForContext
      ? `\n\nCONTEXTO DE HOJE: o usuário indicou estar se sentindo ${moodLabelForContext}. Responda coerente com esse humor e com o que ele escrever. Não presuma que ele está mal se ele não disser.`
      : '';

    // ── INTRO FLOW ─────────────────────────────────────────────────────────────
    // Saudação de abertura (só para conversa nova, sem histórico).
    if (intro) {
      // A saudação só vale para conversa vazia — impede repetir a chamada ao
      // Gemini à vontade reaproveitando o mesmo session_id.
      const { count: existingCount } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session_id);
      if ((existingCount ?? 0) > 0) {
        return new Response(JSON.stringify({ error: 'A conversa já foi iniciada' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (await isRateLimited(supabase, userId)) return rateLimitResponse();

      const moodLabel = mood ? MOOD_LABELS[mood] ?? null : null;
      // Sem humor informado: saudação GERAL, sem presumir nenhum sentimento.
      // Com humor: saudação específica que reconhece o estado com leveza.
      const introPrompt = moodLabel
        ? `O usuário está abrindo a conversa e indicou estar se sentindo ${moodLabel} hoje. Gere uma saudação inicial acolhedora e empática, breve (máximo 2 parágrafos curtos), reconhecendo com leveza como ele se sente (sem rotular nem dramatizar) e terminando com UMA única pergunta aberta que o convide a falar mais.`
        : `O usuário está abrindo a conversa pela primeira vez e AINDA NÃO disse como se sente. Gere uma saudação inicial calorosa e acolhedora, breve (máximo 2 parágrafos curtos), apresentando-se como um espaço seguro de apoio. NÃO presuma nem mencione nenhum sentimento ou estado emocional do usuário. Termine com UMA única pergunta aberta e simples, do tipo "como você está se sentindo hoje?", convidando-o a contar como está.`;

      const geminiRes = await fetch(geminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: introPrompt }] }],
          generationConfig: { maxOutputTokens: 250, temperature: 0.9, thinkingConfig: { thinkingBudget: 0 } },
        }),
      });

      const geminiData = await geminiRes.json();
      if (!geminiRes.ok || geminiData.error) {
        throw new Error(`Gemini error ${geminiRes.status}: ${geminiData.error?.message ?? JSON.stringify(geminiData)}`);
      }

      const introText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!introText) throw new Error('Gemini returned no text for intro');

      await supabase.from('chat_messages').insert({
        session_id,
        user_id: userId,
        role: 'model',
        content: introText,
      });

      return new Response(
        JSON.stringify({ response: introText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ── END INTRO FLOW ─────────────────────────────────────────────────────────

    if (typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Mensagem inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return new Response(
        JSON.stringify({ error: 'A mensagem é muito longa. Tente dividir em partes menores.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Crise é detectada no servidor também. Respostas de crise são sempre
    // respondidas e nunca passam pelo modelo — por isso ficam ANTES do rate
    // limit: quem precisa do CVV nunca pode ser bloqueado.
    if (detectCrisis(message)) {
      await supabase.from('chat_messages').insert({
        session_id,
        user_id: userId,
        role: 'user',
        content: message,
      });
      const crisisResponse = 'Isso é muito sério e você merece apoio especializado agora. Por favor, ligue para o CVV: 188 (24 horas, gratuito e sigiloso). Você também pode ir ao CAPS mais próximo ou a uma UPA. Você não está sozinho. 💜';
      await supabase.from('chat_messages').insert({
        session_id,
        user_id: userId,
        role: 'model',
        content: crisisResponse,
      });
      return new Response(
        JSON.stringify({ response: crisisResponse, crisis: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (await isRateLimited(supabase, userId)) return rateLimitResponse();

    // Save user message
    await supabase.from('chat_messages').insert({
      session_id,
      user_id: userId,
      role: 'user',
      content: message,
    });

    // Resumo rolante da sessão (já carregado na verificação de posse) —
    // memória de longo prazo injetada no system prompt.
    const sessionSummary: string | null = sessionRow?.summary ?? null;
    const summaryContext = sessionSummary
      ? `\n\nRESUMO DO QUE JÁ CONVERSARAM (use para manter continuidade; não repita de volta literalmente): ${sessionSummary}`
      : '';

    // Build Gemini history — Gemini requires contents to start with 'user'.
    // O history vem do cliente: limita a quantidade de itens e o tamanho de
    // cada um antes de montar o prompt (contém o custo e o abuso).
    const mapped = (Array.isArray(history) ? history : [])
      .filter((msg: { role?: unknown; content?: unknown }) => typeof msg?.content === 'string')
      .slice(-MAX_HISTORY_ITEMS)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === 'sage' ? 'model' : 'user',
        parts: [{ text: msg.content.slice(0, MAX_MESSAGE_CHARS) }],
      }));

    // Merge consecutive same-role turns. The client splits a single reply into
    // several bubbles (role 'sage'), which would otherwise produce consecutive
    // 'model' turns that Gemini rejects.
    const merged: { role: string; parts: { text: string }[] }[] = [];
    for (const m of mapped) {
      const last = merged[merged.length - 1];
      if (last && last.role === m.role) {
        last.parts[0].text += `\n\n${m.parts[0].text}`;
      } else {
        merged.push({ role: m.role, parts: [{ text: m.parts[0].text }] });
      }
    }

    // Drop messages from the start until we hit the first 'user' message,
    // then keep only the most recent window (the long tail vive no resumo).
    const firstUserIdx = merged.findIndex((m: { role: string }) => m.role === 'user');
    const geminiHistory = firstUserIdx >= 0 ? merged.slice(firstUserIdx).slice(-9) : [];

    const geminiBody = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT + moodContext + summaryContext }] },
      contents: [
        ...geminiHistory,
        { role: 'user', parts: [{ text: message }] },
      ],
      generationConfig: {
        maxOutputTokens: 320,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 },
      },
    };

    const geminiRes = await fetch(geminiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok || geminiData.error) {
      const errMsg = geminiData.error?.message ?? JSON.stringify(geminiData);
      console.error(`Gemini error ${geminiRes.status}: ${errMsg}`);
      throw new Error('UPSTREAM_ERROR');
    }

    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      console.error('Gemini returned no text:', JSON.stringify(geminiData).slice(0, 500));
      throw new Error('UPSTREAM_ERROR');
    }

    // Save model response
    await supabase.from('chat_messages').insert({
      session_id,
      user_id: userId,
      role: 'model',
      content: responseText,
    });

    // Atualiza o resumo rolante quando passar do limiar. Best-effort, mas
    // aguardamos para garantir persistência antes do ambiente da função encerrar.
    await refreshSummary(supabase, session_id, sessionSummary, sessionRow?.summarized_until ?? null);

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log the real cause server-side; return a generic message to the client.
    console.error('sage-chat error:', error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: 'Não foi possível processar sua mensagem agora. Tente novamente em instantes.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
