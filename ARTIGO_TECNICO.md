# MindUni: Desenvolvimento de um Aplicativo Móvel Gamificado com Inteligência Artificial para Apoio à Saúde Mental de Universitários Brasileiros

---

## Resumo

Este artigo descreve o processo de concepção, design e desenvolvimento do **MindUni**, um aplicativo móvel voltado ao apoio à saúde mental de estudantes universitários brasileiros. A solução combina um chatbot terapêutico baseado em Terapia Cognitivo-Comportamental (TCC) com inteligência artificial generativa, desafios diários de bem-estar, diário emocional e um sistema de gamificação. Foram utilizados React Native com Expo, Supabase como Backend-as-a-Service e o modelo de linguagem Google Gemini 2.0 Flash. O artigo discute as motivações do projeto, decisões arquiteturais, desafios técnicos encontrados e as soluções adotadas, contribuindo para o campo emergente de aplicações digitais em saúde mental (*digital mental health*).

**Palavras-chave:** saúde mental; universitários; aplicativo móvel; inteligência artificial; gamificação; React Native; TCC; chatbot.

---

## 1. Introdução

A saúde mental de estudantes universitários é uma questão de crescente preocupação global. No Brasil, pesquisas recentes indicam que parcela significativa dos universitários apresenta sintomas de ansiedade, depressão e estresse, agravados pela pressão acadêmica, adaptação ao ambiente universitário e, em muitos casos, distância da família e da rede de suporte social (FONAPRACE, 2019).

Paralelamente, os avanços em inteligência artificial generativa abriram novas possibilidades para a criação de ferramentas de apoio psicológico acessíveis, disponíveis 24 horas por dia e capazes de oferecer interações naturais em linguagem coloquial. A convergência dessas duas realidades motivou o desenvolvimento do **MindUni**: uma plataforma móvel que busca democratizar o acesso a técnicas de saúde mental baseadas em evidências, envolvendo o usuário por meio de mecanismos de gamificação e uma experiência conversacional empática e segura.

O presente artigo relata a jornada de desenvolvimento do aplicativo, desde a identificação do problema até as decisões técnicas adotadas, passando pelos obstáculos encontrados e as lições aprendidas.

---

## 2. Problema e Motivação

### 2.1 Lacuna no Acesso a Recursos de Saúde Mental

O acesso a psicólogos e psiquiatras no Brasil é limitado, tanto pelo custo quanto pela disponibilidade de profissionais, especialmente fora dos grandes centros urbanos. Serviços universitários de saúde mental, quando existentes, costumam ter filas de espera extensas. O resultado é que muitos estudantes lidam com sofrimento psíquico sem suporte adequado.

### 2.2 Potencial das Tecnologias Digitais

Aplicativos como Woebot (EUA) e Wysa (Reino Unido) demonstraram que intervenções digitais baseadas em TCC podem ter impacto positivo mensurável em escalas de ansiedade e depressão (Fitzpatrick et al., 2017). No entanto, a maioria dessas soluções não está adaptada ao contexto cultural e linguístico brasileiro.

### 2.3 Engajamento como Desafio Central

Mesmo aplicativos bem projetados enfrentam o problema do abandono precoce (*churn*). A literatura aponta que a gamificação — quando implementada de forma coerente com os objetivos do produto — pode aumentar significativamente o engajamento e a retenção de usuários em aplicativos de saúde (Lister et al., 2014).

---

## 3. Concepção e Design

### 3.1 Personas e Casos de Uso

O público-alvo principal foi definido como estudantes universitários brasileiros entre 18 e 30 anos, com acesso a smartphones e conectividade, mas sem acesso regular a acompanhamento psicológico. As necessidades centrais identificadas foram:

- Um espaço seguro para expressar sentimentos e pensamentos
- Ferramentas práticas e rápidas de regulação emocional
- Motivação para manter hábitos de autocuidado no longo prazo
- Acesso imediato a recursos de crise

### 3.2 Pilares da Solução

O MindUni foi concebido sobre quatro pilares:

1. **Conversa** — Um chatbot empático, baseado em TCC, disponível a qualquer hora
2. **Prática** — Desafios diários curtos e baseados em evidências (mindfulness, gratidão, respiração)
3. **Reflexão** — Diário emocional com rastreamento de humor
4. **Progressão** — Sistema de gamificação (XP, níveis, sequências, conquistas) para estimular a continuidade

### 3.3 Princípios de UX e Segurança

Desde o início, dois princípios nortearam as decisões de design:

- **Nenhum dano (*do no harm*):** O app nunca deve criar a ilusão de substituir um profissional. Toda a comunicação é explícita sobre o caráter de apoio complementar do produto.
- **Protocolo de crise:** A detecção de intenção suicida deve ser robusta e resultar sempre no encaminhamento ao CVV (Centro de Valorização da Vida, 188).

---

## 4. Arquitetura Técnica

### 4.1 Stack Tecnológica

A escolha das tecnologias priorizou produtividade no desenvolvimento, redução de custos de infraestrutura e capacidade de entrega multiplataforma (Android e iOS) a partir de uma única base de código.

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Aplicativo móvel | React Native + Expo SDK 52 | Cross-platform, ecossistema maduro, hot reload, Expo Go para testes |
| Roteamento | Expo Router 4 | File-based routing, semelhante ao Next.js, tipagem automática de rotas |
| Estilização | NativeWind (Tailwind CSS) | Produtividade, consistência visual, sem overhead de StyleSheet |
| Backend | Supabase | PostgreSQL gerenciado, autenticação, Row-Level Security, funções serverless |
| IA / LLM | Google Gemini 2.0 Flash | Custo-benefício, baixa latência, suporte a português, multimodal |
| Estado global | React Context API | Suficiente para a escala do projeto, sem dependência de biblioteca externa |

### 4.2 Estrutura de Diretórios

A organização do projeto segue o padrão recomendado pelo Expo Router, com separação clara entre camadas:

```
APP-expo/
├── app/                    # Telas (roteamento por sistema de arquivos)
│   ├── (auth)/             # Grupo de autenticação
│   ├── (onboarding)/       # Grupo de onboarding
│   └── (tabs)/             # Navegação principal (5 abas)
├── src/
│   ├── components/         # Componentes visuais reutilizáveis
│   ├── context/            # Estado global (UserContext)
│   ├── lib/                # Clientes de serviços externos (Supabase)
│   ├── services/           # Lógica de negócio isolada por domínio
│   └── data/               # Dados estáticos (desafios, badges)
└── supabase/
    └── functions/sage-chat/ # Edge Function (Deno) — integração com Gemini
```

Essa separação facilita a manutenção, os testes e a evolução independente de cada camada.

### 4.3 Modelo de Dados

O banco de dados PostgreSQL no Supabase possui as seguintes tabelas principais:

- **profiles** — dados do perfil do usuário (id, nome)
- **progress** — objeto JSON com XP, nível, sequência, conquistas desbloqueadas, histórico de humor, contadores de sessões
- **chat_sessions** — metadados de cada conversa (humor pré e pós, data)
- **chat_messages** — mensagens individuais com role (user/model), conteúdo e timestamp
- **journal_entries** — entradas do diário com humor (1-5) e texto
- **challenge_logs** — registro de conclusão de desafios por data

O objeto `progress` foi deliberadamente armazenado como JSONB para permitir evolução do schema sem migrations destrutivas — uma decisão pragmática que simplificou o desenvolvimento iterativo.

### 4.4 Fluxo de Autenticação e Navegação

O Expo Router permite definir guards de autenticação diretamente no layout raiz (`app/_layout.jsx`). O fluxo implementado é:

```
Inicialização do app
  → Restaurar sessão (Supabase onAuthStateChange)
  → Se sem sessão:   redireciona para (auth)/login
  → Se com sessão:
      → Verificar flag de onboarding (AsyncStorage)
      → Se primeiro acesso: redireciona para (onboarding)
      → Caso contrário: redireciona para (tabs)
```

Essa lógica centralizada evita duplicação de código de guarda em cada tela.

---

## 5. O Chatbot Sage — Integração com IA Generativa

### 5.1 Arquitetura da Integração

A integração com o Google Gemini foi implementada como uma **Edge Function no Supabase**, escrita em TypeScript/Deno. Essa decisão foi fundamental por duas razões:

1. **Segurança:** A chave da API Gemini nunca fica exposta no código cliente
2. **Controle server-side:** Regras de negócio críticas (limite de mensagens, detecção de crise) são aplicadas antes de qualquer chamada à IA

O fluxo de uma mensagem é:

```
Cliente → Supabase Edge Function (sage-chat)
  → Autentica usuário (JWT)
  → Verifica limite diário (20 mensagens/usuário/dia)
  → Detecta palavras-chave de crise
  → Persiste mensagem do usuário (chat_messages)
  → Chama Gemini API com system prompt + histórico
  → Persiste resposta do modelo
  → Retorna { response, crisis? } ao cliente
```

### 5.2 O System Prompt

O system prompt do Sage foi cuidadosamente elaborado para:

- Posicionar o assistente como suporte complementar, nunca substituto profissional
- Instrui sobre técnicas específicas de TCC: registro de pensamentos automáticos, reestruturação cognitiva, ativação comportamental, relaxamento muscular progressivo, resolução de problemas, mindfulness e validação emocional
- Proibir explicitamente diagnósticos, prescrição de medicamentos e aconselhamento de isolamento
- Manter tom empático, acolhedor e não julgamental
- Responder exclusivamente em português brasileiro
- Respostas limitadas a 350 tokens (promove concisão e reduz latência)

```typescript
const systemPrompt = `Você é Sage, um assistente de saúde mental acolhedor e empático,
especializado em Terapia Cognitivo-Comportamental (TCC). Você apoia estudantes
universitários brasileiros em seu bem-estar emocional.

VOCÊ PODE:
- Oferecer técnicas de TCC: registros de pensamentos, reestruturação cognitiva...
- Praticar mindfulness e exercícios de respiração guiada
- Validar emoções e oferecer perspectivas alternativas
- Encorajar hábitos saudáveis e autocuidado

VOCÊ NUNCA DEVE:
- Diagnosticar condições de saúde mental
- Recomendar ou discutir medicamentos
- Substituir um profissional de saúde mental
- Encorajar o usuário a se isolar

[...demais diretrizes de segurança e formato]`;
```

### 5.3 Configurações do Modelo

```typescript
generationConfig: {
  maxOutputTokens: 350,
  temperature: 0.7,      // Balanceia criatividade e coerência
  topP: 0.9,             // Amostragem por núcleo
},
safetySettings: [
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
]
```

### 5.4 Detecção de Crise

A detecção de intenção suicida é implementada em dois níveis:

**Cliente (JavaScript):** Verificação imediata de palavras-chave na mensagem do usuário antes mesmo do envio ao servidor:

```javascript
const crisisKeywords = [
  'suicídio', 'suicidio', 'me matar', 'quero morrer', 'não quero viver',
  'acabar com tudo', 'me machucar', 'sem saída', 'não aguento mais'
];
```

**Servidor (Edge Function):** Segunda verificação antes de chamar a Gemini API, garantindo que nenhum prompt de crise chegue ao modelo sem tratamento.

Quando detectada uma crise, o cliente exibe o `CrisisModal` com mensagem acolhedora e botão de ligação direta ao **CVV (188)**.

---

## 6. Sistema de Gamificação

### 6.1 Fundamentos

O sistema de gamificação foi projetado com base no modelo **Octalysis** de Yu-kai Chou, priorizando motivadores intrínsecos (desenvolvimento pessoal, significado) sobre motivadores extrínsecos (recompensas materiais).

Os elementos implementados foram:

- **Pontos de experiência (XP):** Representam progresso acumulado
- **Níveis:** 10 estágios com nomes temáticos em português
- **Sequências (*streaks*):** Incentivam a consistência diária
- **Conquistas (*badges*):** Marcos de progresso em diferentes dimensões

### 6.2 Distribuição de XP

| Ação | XP |
|---|---|
| Login diário | +10 |
| Sessão de chat completa | +50 |
| Desafio de mindfulness | +30 |
| Desafio de gratidão | +25 |
| Desafio de respiração | +20 |
| Entrada no diário | +20 |

### 6.3 Notificação de XP

Um componente `XPToast` exibe uma notificação animada no rodapé da tela imediatamente após cada ação recompensada. Essa resposta imediata é fundamental para o reforço positivo — o usuário sente o progresso instantaneamente.

---

## 7. Desafios Técnicos e Soluções

### 7.1 Estilização com NativeWind

**Problema:** NativeWind (Tailwind CSS para React Native) requer configuração específica no Metro bundler e no Babel. Classes Tailwind com modificadores dinâmicos (ex: `bg-${color}`) não funcionam — o JIT compiler precisa ver as classes completas em tempo de build.

**Solução:** Todas as strings de classe Tailwind foram tornadas estáticas. Para variantes dinâmicas de cor em badges e componentes, foi criado um mapeamento explícito de objetos JavaScript ao invés de interpolação de strings.

### 7.2 Gerenciamento de Estado entre Progresso e IA

**Problema:** O progresso do usuário (XP, conquistas) é atualizado localmente via Context, mas precisa ser sincronizado com o Supabase. Condições de corrida podiam ocorrer quando múltiplas ações rápidas tentavam atualizar o estado simultaneamente.

**Solução:** Todas as atualizações de progresso passam obrigatoriamente pelo `progressService`, que opera sobre o estado mais recente lido do Supabase antes de cada escrita. O hook `useUser()` expõe funções que garantem essa sequência.

### 7.3 Persistência de Sessão e Onboarding

**Problema:** O Expo Router processa as rotas antes do Supabase restaurar a sessão assíncrona, causando flashes de tela indesejados (usuário logado sendo redirecionado para login por um instante).

**Solução:** Um estado `loading` no `UserContext` bloqueia qualquer renderização de rota até que a sessão seja restaurada. O `_layout.jsx` raiz exibe uma tela de splash enquanto `loading === true`.

### 7.4 Limite de Mensagens e Controle de Abuso

**Problema:** Implementar um limite diário de 20 mensagens por usuário que não pudesse ser burlado pelo cliente.

**Solução:** O limite é aplicado exclusivamente na Edge Function do Supabase, que consulta a tabela `chat_messages` contando mensagens do usuário com `role = 'user'` no dia corrente. O cliente não tem como contornar essa verificação.

### 7.5 Rotação de Desafios sem Repetição Imediata

**Problema:** Garantir que os desafios diários rotem de forma determinística sem armazenamento de estado e sem repetição no dia seguinte.

**Solução:** A seleção do desafio usa o número do dia no ano (`dayOfYear`) como índice de rotação sobre o array de desafios disponíveis por categoria:

```javascript
const today = new Date();
const dayOfYear = Math.floor(
  (today - new Date(today.getFullYear(), 0, 0)) / 86400000
);
const challengeIndex = dayOfYear % challenges[category].length;
```

Isso garante rotação determinística, sem banco de dados e sem repetição consecutiva quando há dois ou mais desafios por categoria.

### 7.6 Animação do Círculo de Respiração

**Problema:** Animar um círculo que expande/contrai sincronizado com fases de respiração (inspirar, segurar, expirar) de forma fluida sem travar a UI.

**Solução:** Uso do `Animated.timing` do React Native com `useNativeDriver: false` (necessário para animações de tamanho) e estado de fase controlado por `setTimeout` encadeados. A animação é limpa com `clearTimeout` no `useEffect` cleanup para evitar memory leaks.

### 7.7 Segurança das Chaves de API

**Problema:** As variáveis de ambiente do Expo com prefixo `EXPO_PUBLIC_` são embarcadas no bundle do aplicativo e ficam visíveis para quem descompilar o APK.

**Solução:** A chave do Gemini **nunca** passa pelo cliente. Ela é configurada como secret no Supabase e consumida exclusivamente pela Edge Function. As únicas chaves no cliente são a URL e a *anon key* do Supabase, que são projetadas para ser públicas e protegidas pelas políticas de RLS.

---

## 8. Interface e Experiência do Usuário

### 8.1 Sistema Visual

O MindUni adota uma paleta de cores centrada no roxo (#8B5CF6) — cor associada a intuição, sabedoria e espiritualidade — complementada por tons de índigo e cinzas neutros. A escolha intencional difere do verde estéril associado a apps médicos, buscando uma identidade mais acolhedora e menos clínica.

Componentes visuais seguem o princípio de *mobile-first* com:
- Bordas arredondadas (12px–24px)
- Sombras suaves para hierarquia visual
- Espaçamento generoso (grid de 8px)
- Tipografia legível com escala bem definida

### 8.2 Fluxo do Chat em Três Fases

O chat com o Sage foi estruturado em três fases deliberadas:

1. **Pré-sessão:** Seleção de humor inicial com emojis (1-5). Isso ancora a conversa no estado emocional presente e cria o ponto de comparação para a fase pós-sessão.
2. **Conversa:** Troca de mensagens com a IA, com indicador de digitação animado para naturalidade.
3. **Pós-sessão:** Nova seleção de humor. A diferença entre pré e pós é exibida ao usuário como feedback imediato do impacto da conversa.

Essa estrutura foi inspirada nas avaliações pré/pós de intervenções clínicas em TCC.

### 8.3 Onboarding

O carrossel de boas-vindas (4 slides) cumpre papel essencial: define expectativas. O último slide é um aviso explícito sobre o caráter complementar do app e encoraja o usuário a buscar apoio profissional quando necessário. Essa transparência é um princípio ético inegociável do produto.

---

## 9. Segurança e Ética

O desenvolvimento do MindUni seguiu diretrizes éticas específicas para aplicações em saúde mental:

1. **Não-maleficência:** Nenhuma funcionalidade simula diagnóstico ou prescrição
2. **Transparência:** O usuário é sempre informado de que está interagindo com uma IA
3. **Privacidade:** Dados são armazenados com criptografia e acesso controlado por RLS
4. **Acesso a crise:** O CVV (188) é acessível com um toque em qualquer momento de crise detectada
5. **Limitações explícitas:** O app reconhece proativamente suas limitações e encoraja busca por ajuda profissional

---

## 10. Resultados e Discussão

O MindUni resultou em um aplicativo funcional e completo com:

- **5 telas principais** integradas e funcionais (Dashboard, Chat, Desafios, Diário, Perfil)
- **Integração completa com IA** generativa via Gemini 2.0 Flash em português
- **Sistema de gamificação** com 10 níveis, 10 conquistas e rastreamento de sequências
- **Protocolo de segurança** robusto com detecção de crise em duas camadas
- **Arquitetura escalável** com separação clara de responsabilidades

A combinação de Expo + Supabase + Gemini provou-se altamente produtiva para o desenvolvimento de um MVP (*Minimum Viable Product*) completo, permitindo que um desenvolvedor solo entregasse uma solução end-to-end com infraestrutura de produção.

Do ponto de vista técnico, o principal aprendizado foi a importância de **não expor lógica de negócio crítica no cliente** — o padrão de Edge Functions para toda comunicação com a IA se mostrou correto tanto do ponto de vista de segurança quanto de manutenção.

---

## 11. Trabalhos Futuros

As próximas versões do MindUni podem explorar:

- **Notificações push** para lembretes de desafios e sequências (Expo Notifications)
- **Modo offline** com sincronização assíncrona para áreas com conectividade limitada
- **Acessibilidade** aprimorada (suporte a VoiceOver/TalkBack, tamanhos de fonte dinâmicos)
- **Avaliação clínica:** Questionários validados (PHQ-9, GAD-7) integrados ao acompanhamento de progresso
- **Integração com profissionais:** Canal para encaminhamento a psicólogos parceiros
- **Internacionalização:** Adaptação para outros idiomas e contextos culturais
- **Análise de dados:** Dashboard para pesquisadores com dados anonimizados sobre padrões de uso e bem-estar

---

## 12. Conclusão

O MindUni demonstra que é viável desenvolver uma aplicação de saúde mental digital responsável, eficaz e tecnicamente robusta utilizando tecnologias modernas de desenvolvimento móvel e inteligência artificial generativa. A combinação de TCC estruturada, gamificação motivacional e IA conversacional cria uma experiência que vai além de um simples chatbot — o app é um companheiro de autocuidado que respeita os limites éticos da atuação tecnológica em saúde mental.

O desenvolvimento revelou que os principais desafios não são técnicos, mas de design responsável: como criar um produto que genuinamente ajude sem criar dependência ou ilusão de substituto profissional. Essa tensão deve permanecer no centro de qualquer produto nesse espaço.

O código fonte do MindUni está disponível em: [github.com/seu-usuario/minduni-expo]

---

## Referências

FONAPRACE (Fórum Nacional de Pró-Reitores de Assuntos Estudantis). **V Pesquisa Nacional de Perfil Socioeconômico e Cultural dos Graduandos das IFES**. Brasília: ANDIFES, 2019.

FITZPATRICK, K. K.; DARCY, A.; VIERHILE, M. Delivering Cognitive Behavior Therapy to Young Adults With Symptoms of Depression and Anxiety Using a Fully Automated Conversational Agent (Woebot): A Randomized Controlled Trial. **JMIR Mental Health**, v. 4, n. 2, e19, 2017.

LISTER, C.; WEST, J. H.; CANNON, B.; SAX, T.; BRODEGARD, D. Just a fad? Gamification in health and fitness apps. **JMIR Serious Games**, v. 2, n. 2, e9, 2014.

CHOU, Y. Actionable Gamification: Beyond Points, Badges, and Leaderboards. Fremont: Octalysis Media, 2015.

EXPO DOCUMENTATION. Expo Router: File-based routing. Disponível em: https://docs.expo.dev/router/introduction. Acesso em: mar. 2026.

SUPABASE DOCUMENTATION. Edge Functions. Disponível em: https://supabase.com/docs/guides/functions. Acesso em: mar. 2026.

GOOGLE AI. Gemini API Documentation. Disponível em: https://ai.google.dev/docs. Acesso em: mar. 2026.

---

*Artigo submetido em março de 2026.*
