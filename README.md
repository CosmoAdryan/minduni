# MindUni

**Aplicativo móvel de apoio à saúde mental para universitários brasileiros — gamificado com IA**

[![Expo](https://img.shields.io/badge/Expo-52.0-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?logo=react)](https://reactnative.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-IA-4285F4?logo=google)](https://ai.google.dev)
[![NativeWind](https://img.shields.io/badge/NativeWind-Tailwind_CSS-38BDF8)](https://www.nativewind.dev)

---

## Visão Geral

O **MindUni** é um aplicativo de saúde mental que combina:

- **Chatbot terapêutico com IA** ("Sage") baseado em Terapia Cognitivo-Comportamental (TCC)
- **Desafios diários de bem-estar** (mindfulness, gratidão, respiração)
- **Diário emocional** com rastreamento de humor
- **Sistema de gamificação** (XP, níveis, sequências, conquistas)
- **Protocolo de crise** com encaminhamento ao CVV (188)

> **Aviso importante:** O MindUni é um recurso de apoio complementar e **não substitui** acompanhamento psicológico ou psiquiátrico profissional. Em situações de crise, procure ajuda profissional imediatamente.

---

## Funcionalidades

### Sage — Chatbot de IA
- Conversas multi-turno em português com a IA Sage
- Baseado no modelo **Google Gemini 2.0 Flash**
- Técnicas de TCC: registros de pensamentos automáticos, reestruturação cognitiva, ativação comportamental, relaxamento, resolução de problemas, mindfulness e validação emocional
- Rastreamento de humor antes e depois de cada sessão
- Limite de 20 mensagens/dia (aplicado no servidor)
- Detecção automática de crise com exibição do contato CVV

### Desafios Diários
| Desafio | XP | Tipo |
|---|---|---|
| Mindfulness (Respiração Consciente / Body Scan) | +30 XP | Timer guiado |
| Gratidão (Três Gratidões / Carta de Gratidão) | +25 XP | Reflexão escrita |
| Respiração (4-7-8 / Box Breathing) | +20 XP | Animação com ciclos |

- Rotação diária automática de variantes
- Mapa de calor semanal de atividades
- Feedback tátil (haptic) ao completar

### Diário Emocional
- Registro de humor (escala 1-5 com emojis)
- Entradas de texto livre (até 1.000 caracteres)
- Histórico com filtro por humor e busca
- Gráfico de tendência semanal
- +20 XP por entrada

### Sistema de Gamificação
**10 Níveis:**
| Nível | Nome | XP Necessário |
|---|---|---|
| 1 | Explorador Mental | 0 |
| 2 | Buscador de Luz | 100 |
| 3 | Mente Curiosa | 250 |
| 4 | Navegador Emocional | 450 |
| 5 | Guardião do Equilíbrio | 700 |
| 6 | Mestre da Resiliência | 1.000 |
| 7 | Sábio Interior | 1.350 |
| 8 | Iluminado | 1.750 |
| 9 | Arquiteto Mental | 2.200 |
| 10 | Mestre MindUni | 2.700 |

**10 Conquistas (Badges):**
- Primeira conversa com o Sage
- Sequências de 3, 7 e 30 dias
- Completar todos os desafios diários
- Registrar humor 7 vezes
- Atingir nível 5 e nível 10
- Escrever 5 entradas no diário
- Acumular 1.000 XP

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework mobile | Expo SDK 52 + Expo Router 4 |
| Linguagem | JavaScript/JSX + TypeScript |
| Estilização | NativeWind (Tailwind CSS para React Native) |
| Backend & Auth | Supabase (PostgreSQL + Auth + Edge Functions) |
| IA / LLM | Google Gemini 2.0 Flash |
| Estado global | React Context API |
| Ícones | Lucide React Native |
| Animações | React Native Reanimated |

---

## Arquitetura

```
APP-expo/
├── app/                          # Páginas (roteamento por arquivo - Expo Router)
│   ├── _layout.jsx              # Layout raiz com guard de autenticação
│   ├── (auth)/login.jsx         # Login e cadastro
│   ├── (onboarding)/index.jsx   # Carrossel de boas-vindas (4 slides)
│   └── (tabs)/                  # 5 abas principais
│       ├── index.jsx            # Dashboard
│       ├── chat.jsx             # Chat com Sage
│       ├── challenges.jsx       # Desafios diários
│       ├── journal.jsx          # Diário emocional
│       └── profile.jsx          # Perfil e conquistas
├── src/
│   ├── components/              # Componentes reutilizáveis
│   │   ├── XPBar.jsx
│   │   ├── XPToast.jsx
│   │   ├── ChatMessage.jsx
│   │   ├── CrisisModal.jsx
│   │   └── BadgeCard.jsx
│   ├── context/UserContext.jsx  # Estado global do usuário
│   ├── lib/supabase.js          # Cliente Supabase
│   ├── services/                # Lógica de negócio
│   │   ├── authService.js
│   │   ├── chatService.js
│   │   ├── challengeService.js
│   │   ├── journalService.js
│   │   ├── progressService.js
│   │   └── onboardingService.js
│   └── data/                    # Dados estáticos
│       ├── challenges.js
│       ├── badges.js
│       └── chatResponses.js
└── supabase/
    └── functions/sage-chat/     # Edge Function Deno (Gemini API)
        └── index.ts
```

### Fluxo de Autenticação

```
Primeiro acesso:  Onboarding (4 slides) → Login/Cadastro → Dashboard
Retorno:          Sessão persistida → Auto-login → Dashboard
Proteção:         Guard no _layout.jsx raiz redireciona conforme estado
```

### Fluxo do Chat (Sage)

```
1. Seleção de humor pré-sessão (1-5)
2. Criação de sessão no Supabase
3. Troca de mensagens → Edge Function → Gemini API
4. Detecção de crise (cliente + servidor)
5. Seleção de humor pós-sessão
6. +50 XP + verificação de conquistas
```

---

## Banco de Dados (Supabase)

Tabelas principais:
- `profiles` — dados do usuário (nome)
- `progress` — XP, nível, sequência, conquistas, histórico de humor
- `chat_sessions` — metadados das sessões de chat
- `chat_messages` — mensagens individuais
- `journal_entries` — entradas do diário
- `challenge_logs` — registro de desafios concluídos

---

## Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Conta no [Supabase](https://supabase.com)
- Chave da API do [Google AI Studio](https://aistudio.google.com)
- App [Expo Go](https://expo.dev/go) no celular (para testes)

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/minduni-expo.git
cd minduni-expo
npm install
```

### 2. Configure as variáveis de ambiente
Crie o arquivo `.env` na raiz:
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Configure o Supabase
Execute as migrations no painel SQL do Supabase para criar as tabelas necessárias (ver pasta `supabase/`).

### 4. Configure a Edge Function
No painel do Supabase, crie a função `sage-chat` com o código em `supabase/functions/sage-chat/index.ts`.

Adicione o secret:
```bash
supabase secrets set GEMINI_API_KEY=sua-chave-gemini
```

### 5. Inicie o app
```bash
npx expo start
```
Escaneie o QR code com o Expo Go (Android/iOS) ou pressione `a` para Android emulador, `i` para iOS.

---

## Segurança

- Autenticação via Supabase Auth (JWT)
- Row-Level Security (RLS) habilitado em todas as tabelas
- Chave da API Gemini armazenada **apenas no servidor** (Edge Function)
- Limite de mensagens diárias aplicado no servidor
- Detecção de crise com encaminhamento imediato ao CVV (188)
- Sem armazenamento local de tokens (gerenciado pelo Supabase)

---

## Protocolo de Crise

O app monitora palavras-chave em português relacionadas a crise suicida tanto no cliente quanto no servidor. Quando detectadas:

1. A resposta do Sage é substituída por uma mensagem de acolhimento
2. Um modal exibe o número do **CVV: 188** (gratuito, 24h)
3. Um botão de ligação direta é disponibilizado

---

## Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## Licença

Este projeto está licenciado sob a MIT License.

---

## Contato

Desenvolvido como projeto de pesquisa e inovação em saúde mental digital para universitários brasileiros.

> Se você está em crise ou conhece alguém que esteja, ligue **188** (CVV) — gratuito, 24 horas.
