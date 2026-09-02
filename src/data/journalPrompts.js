// Perguntas de apoio à escrita do diário. Rotacionam por dia (como os desafios)
// para reduzir a "página em branco" sem repetir sempre o mesmo estímulo.
export const JOURNAL_PROMPTS = [
  'O que te deu energia hoje?',
  'O que te tirou energia hoje?',
  'Teve algum momento em que você se sentiu em paz?',
  'O que você faria diferente se pudesse repetir o dia?',
  'Por quê você é grato agora, mesmo que pequeno?',
  'Que pensamento ficou repetindo na sua cabeça hoje?',
  'Como seu corpo está se sentindo neste momento?',
  'O que você diria para um amigo que estivesse passando pelo seu dia?',
  'Qual foi o maior desafio de hoje e como você reagiu?',
  'O que você está evitando pensar? Tente escrever sobre isso.',
  'Quem ou o que te fez sorrir hoje?',
  'O que você precisa ouvir agora?',
  'Que pequena vitória de hoje merece ser reconhecida?',
  'Se o seu dia fosse uma cor, qual seria e por quê?',
];

// Escolhe a pergunta do dia pelo dia do ano (mesmo critério de getDailyChallenges).
// `date` é parametrizável para testes.
export function getDailyPrompt(date = new Date()) {
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return JOURNAL_PROMPTS[dayOfYear % JOURNAL_PROMPTS.length];
}
