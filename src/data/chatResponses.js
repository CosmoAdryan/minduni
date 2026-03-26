const RESPONSES = [
  {
    keywords: ['olá', 'oi', 'hey', 'ola', 'bom dia', 'boa tarde', 'boa noite'],
    responses: [
      'Olá! Fico feliz em te ver aqui. Como você está se sentindo hoje?',
      'Oi! Estou aqui para te ouvir. O que está no seu coração hoje?',
      'Que bom te ver! Como foi o seu dia até agora?',
    ],
    followUp: 'Lembre-se, este é um espaço seguro para compartilhar o que quiser.',
    technique: 'acolhimento',
  },
  {
    keywords: ['ansioso', 'ansiedade', 'nervoso', 'preocupado', 'angustiado'],
    responses: [
      'Entendo que a ansiedade pode ser muito desconfortável. Vamos respirar juntos? Inspire por 4 segundos, segure por 4 e expire por 4.',
      'A ansiedade é uma resposta natural do corpo. O que você acha que está causando esse sentimento?',
      'Quando nos sentimos ansiosos, o corpo ativa o sistema de alerta. Tente nomear 5 coisas que pode ver ao redor.',
    ],
    followUp: 'Técnica TCC: identificar pensamentos automáticos pode ajudar a reduzir a ansiedade.',
    technique: 'respiração e aterramento',
  },
  {
    keywords: ['triste', 'tristeza', 'chorar', 'choro', 'deprimido', 'mal'],
    responses: [
      'Sinto muito que você esteja passando por isso. A tristeza é uma emoção válida e merece atenção.',
      'É corajoso compartilhar quando estamos tristes. Quer me contar mais sobre o que está sentindo?',
      'Às vezes precisamos de um momento para sentir. O que poderia te trazer um pouquinho de conforto agora?',
    ],
    followUp: 'Lembre-se: buscar apoio profissional é sempre uma opção válida e importante.',
    technique: 'validação emocional',
  },
  {
    keywords: ['estresse', 'estressado', 'sobrecarregado', 'cansado', 'esgotado'],
    responses: [
      'O estresse universitário é real e intenso. Vamos identificar o que mais está pesando?',
      'Quando tudo parece demais, ajuda priorizar. O que é mais urgente agora?',
      'Seu corpo está mandando sinais importantes. Quando foi a última vez que você fez uma pausa real?',
    ],
    followUp: 'Técnica: liste suas tarefas por importância e urgência. Faça uma de cada vez.',
    technique: 'gestão de estresse',
  },
  {
    keywords: ['sozinho', 'solidão', 'isolado', 'ninguém', 'sem amigos'],
    responses: [
      'Sentir solidão na universidade é mais comum do que parece. Você não está sozinho nessa.',
      'A conexão humana é uma necessidade básica. Existe algum ambiente onde você se sente mais à vontade?',
      'Às vezes a solidão nos ensina sobre nós mesmos. O que você descobriu sobre si nesse tempo?',
    ],
    followUp: 'Pequenos passos: participar de um clube ou grupo pode ajudar a criar conexões gradualmente.',
    technique: 'ativação comportamental',
  },
  {
    keywords: ['raiva', 'irritado', 'bravo', 'ódio', 'frustrado'],
    responses: [
      'A raiva é uma emoção válida que merece ser expressada de forma saudável. O que aconteceu?',
      'Antes de reagir, respire fundo. O que está por trás dessa raiva — medo, injustiça, frustração?',
      'Entendo sua frustração. Às vezes ajuda escrever o que sente antes de agir.',
    ],
    followUp: 'TCC: a raiva muitas vezes protege sentimentos mais vulneráveis. Vale explorar.',
    technique: 'regulação emocional',
  },
  {
    keywords: ['bem', 'feliz', 'ótimo', 'alegre', 'contente', 'animado'],
    responses: [
      'Que ótimo ouvir isso! O que está contribuindo para esse sentimento positivo?',
      'Maravilhoso! Momentos bons merecem ser celebrados. O que de especial aconteceu?',
      'Fico feliz com você! Como você pode preservar esse estado positivo?',
    ],
    followUp: 'Registrar momentos felizes ajuda a acessá-los em dias difíceis.',
    technique: 'fortalecimento de recursos positivos',
  },
];

const DEFAULT_RESPONSES = [
  'Obrigado por compartilhar. Pode me contar mais sobre isso?',
  'Entendo. Como esse sentimento afeta seu dia a dia?',
  'Isso é importante. O que você acha que causou isso?',
  'Estou ouvindo. Como você está lidando com essa situação?',
];

const CRISIS_KEYWORDS = [
  'suicídio', 'suicidio', 'me matar', 'quero morrer', 'não quero mais viver',
  'nao quero mais viver', 'me machucar', 'acabar com tudo', 'não aguento mais',
  'nao aguento mais', 'sem saída', 'sem saida', 'desaparecer', 'tirar minha vida',
  'me jogar', 'me enforcar', 'tomar remédios', 'me cortar',
];

export function detectCrisis(message) {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

export function findResponse(message) {
  const lower = message.toLowerCase();
  for (const item of RESPONSES) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      const response = item.responses[Math.floor(Math.random() * item.responses.length)];
      return { response, followUp: item.followUp, technique: item.technique };
    }
  }
  return {
    response: DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)],
    followUp: null,
    technique: null,
  };
}

export const SAGE_INTRO =
  'Olá! Sou o Sage, seu companheiro de bem-estar mental. Estou aqui para te ouvir com atenção e sem julgamentos. Como você está se sentindo hoje?';

export const SAGE_CLOSING =
  'Foi muito bom conversar com você hoje. Lembre-se de cuidar de si mesmo. Até a próxima! 💜';
