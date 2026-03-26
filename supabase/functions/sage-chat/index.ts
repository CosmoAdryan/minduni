import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o Sage, um assistente de bem-estar mental especializado em Terapia Cognitivo-Comportamental (TCC) para estudantes universitários brasileiros.

IDENTIDADE E PROPÓSITO:
- Criado exclusivamente para apoiar estudantes com técnicas baseadas na TCC
- Seu objetivo é ajudar a identificar, compreender e modificar padrões de pensamento e comportamento que causam sofrimento
- Você é empático, acolhedor, sem julgamentos e profissional

TÉCNICAS QUE VOCÊ UTILIZA (apenas estas):
1. Registro de Pensamentos Automáticos: ajude a identificar e questionar pensamentos disfuncionais
2. Reestruturação Cognitiva: questione distorções como catastrofização, pensamento tudo-ou-nada, leitura mental
3. Ativação Comportamental: proponha pequenas ações concretas para melhorar o humor
4. Técnicas de Relaxamento: respiração diafragmática (4-4-4), relaxamento muscular progressivo
5. Resolução de Problemas: decomponha problemas grandes em passos menores
6. Mindfulness e Ancoragem: técnica 5-4-3-2-1 (5 coisas que vê, 4 que toca, 3 que ouve, 2 que cheira, 1 que saboreia)
7. Validação Emocional: reconheça os sentimentos antes de qualquer intervenção
8. Agendamento de Atividades: sugira rotinas e hábitos baseados em evidências

DISTORÇÕES COGNITIVAS PARA IDENTIFICAR:
Catastrofização, pensamento tudo-ou-nada, filtro mental, desqualificação do positivo, leitura mental, adivinhação, magnificação/minimização, rotulação, raciocínio emocional, personalizações e declarações "deveria".

REGRAS ABSOLUTAS:
- NUNCA faça diagnósticos (depressão, ansiedade, etc.) — você apoia, não diagnostica
- NUNCA comente ou recomende medicamentos
- NUNCA discuta temas fora de saúde mental e bem-estar emocional
- Se perguntado sobre outros temas, redirecione: "Meu foco é te apoiar no bem-estar emocional. Posso te ajudar com..."
- Sempre reforce que você é um APOIO COMPLEMENTAR, não substituto para psicólogos

PROTOCOLO DE CRISE (PRIORIDADE MÁXIMA):
Se o usuário mencionar suicídio, automutilação ou pensamentos de se machucar:
1. Acolha com empatia, sem julgamento
2. Responda IMEDIATAMENTE: "Isso é muito sério e você merece apoio especializado agora. Por favor, ligue para o CVV: 188 (24 horas, gratuito e sigiloso). Você também pode ir ao CAPS mais próximo ou a uma UPA."
3. Não retorne à conversa normal até o usuário confirmar que está seguro

FORMATO DAS RESPOSTAS:
- Máximo 3 parágrafos curtos e diretos
- Linguagem simples, acessível e calorosa
- Inclua pelo menos uma pergunta reflexiva por resposta
- Quando aplicável, sugira uma técnica TCC prática com instruções claras
- Nunca use jargões sem explicar
- Idioma: Português brasileiro`;

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

    // Decode JWT payload to get user ID — gateway already validated the token
    let userId: string;
    try {
      const token = authHeader.slice(7);
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
      if (!userId) throw new Error('no sub');
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
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

    const { session_id, message, history, intro, pre_mood } = await req.json();

    // ── INTRO FLOW ─────────────────────────────────────────────────────────────
    // Generates the opening greeting personalised by the user's pre-mood.
    // Does not count toward the daily limit and does not save a user message.
    if (intro) {
      const MOOD_LABELS: Record<number, string> = {
        1: 'muito mal (😢)',
        2: 'mal (😔)',
        3: 'neutro (😐)',
        4: 'bem (😊)',
        5: 'ótimo (😄)',
      };
      const moodLabel = pre_mood ? MOOD_LABELS[pre_mood] ?? 'não informado' : 'não informado';
      const introPrompt = `O usuário acabou de informar que está se sentindo ${moodLabel} hoje. Gere uma saudação inicial acolhedora e empática, considerando esse humor. Seja breve (máximo 2 parágrafos curtos) e termine com uma única pergunta aberta que o convide a falar mais.`;

      const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: introPrompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.9 },
        }),
      });

      const geminiData = await geminiRes.json();
      if (!geminiRes.ok || geminiData.error) {
        throw new Error(`Gemini error ${geminiRes.status}: ${geminiData.error?.message ?? JSON.stringify(geminiData)}`);
      }

      const introText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!introText) throw new Error('Gemini returned no text for intro');

      // Persist the opening message so chat history is complete
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

    // Save user message
    await supabase.from('chat_messages').insert({
      session_id,
      user_id: userId,
      role: 'user',
      content: message,
    });

    // Detect crisis on server side as well
    if (detectCrisis(message)) {
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

    // Build Gemini history — Gemini requires contents to start with 'user'
    // Map roles and skip any leading 'model' messages (e.g. static intro)
    const mapped = (history ?? [])
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === 'sage' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    // Drop messages from the start until we hit the first 'user' message
    const firstUserIdx = mapped.findIndex((m: { role: string }) => m.role === 'user');
    const geminiHistory = firstUserIdx >= 0 ? mapped.slice(firstUserIdx).slice(-9) : [];

    // Call Gemini 2.0 Flash
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

    const geminiBody = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        ...geminiHistory,
        { role: 'user', parts: [{ text: message }] },
      ],
      generationConfig: {
        maxOutputTokens: 350,
        temperature: 0.7,
      },
    };

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    const geminiData = await geminiRes.json();

    // Surface Gemini errors clearly
    if (!geminiRes.ok || geminiData.error) {
      const errMsg = geminiData.error?.message ?? JSON.stringify(geminiData);
      console.error('Gemini full response:', JSON.stringify(geminiData));
      throw new Error(`Gemini error ${geminiRes.status}: ${errMsg}`);
    }

    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error(`Gemini no text. Raw: ${JSON.stringify(geminiData).slice(0, 200)}`);

    // Save model response
    await supabase.from('chat_messages').insert({
      session_id,
      user_id: userId,
      role: 'model',
      content: responseText,
    });

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
