# MindUni

**Aplicativo móvel de apoio à saúde mental para universitários brasileiros — gamificado com IA**

[![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-Flash-4285F4?logo=google)](https://ai.google.dev)
[![NativeWind](https://img.shields.io/badge/NativeWind-Tailwind_CSS-38BDF8)](https://www.nativewind.dev)
[![LGPD](https://img.shields.io/badge/LGPD-conforme-2D6254)](https://www.gov.br/anpd)

---

## Visão Geral

O **MindUni** é um aplicativo de saúde mental que combina:

- **Chatbot de apoio com IA** ("Sage") baseado em Terapia Cognitivo-Comportamental (TCC), com memória de longo prazo
- **Desafios diários de bem-estar** (mindfulness, gratidão, respiração)
- **Diário emocional** com rastreamento de humor
- **Sistema de gamificação** (XP, níveis, sequências, conquistas)
- **Protocolo de crise** com encaminhamento ao CVV (188)
- **Conta e privacidade conforme a LGPD** — consentimento, edição de perfil, exportação de direitos, limpeza e exclusão de dados

> **Aviso importante:** O MindUni é um recurso de apoio complementar e **não substitui** acompanhamento psicológico ou psiquiátrico profissional. Em situações de crise, procure ajuda profissional imediatamente.

---

## Funcionalidades

### Sage — Chatbot de IA
- **Chat corrido**: cada usuário tem uma conversa contínua que evolui dia após dia
- **Memória de longo prazo**: um resumo rolante da conversa é regenerado periodicamente e injetado no contexto, mantendo continuidade sem reenviar todo o histórico
- Baseado no modelo **Google Gemini (Flash)**, executado em Edge Function
- Técnicas de TCC: registro de pensamentos automáticos, reestruturação cognitiva, ativação comportamental, relaxamento, resolução de problemas, mindfulness e validação emocional
- **Check-in de humor diário** que ajusta o tom das respostas
- **XP por engajamento**: a primeira mensagem do dia recompensa um streak crescente (de +5 até +50 XP)
- Detecção automática de crise (cliente **e** servidor) com exibição do contato CVV

### Desafios Diários
| Desafio | XP | Tipo |
|---|---|---|
| Mindfulness (Respiração Consciente / Body Scan) | +30 XP | Timer guiado |
| Gratidão (Três Gratidões / Carta de Gratidão) | +25 XP | Reflexão escrita |
| Respiração (4-7-8 / Box Breathing) | +20 XP | Animação com ciclos |

- Rotação diária automática de variantes
- Mapa de calor semanal de atividades
- Feedback tátil (haptic) ao completar
- Conquista **"Dia Completo"** ao concluir os três desafios do dia

### Diário Emocional
- Registro de humor (escala 1-5 com emojis)
- Entradas de texto livre
- Histórico e gráfico de tendência de humor (componente `MoodChart`)
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

**15 Conquistas (Badges):**
- **Sage:** Primeira Conversa · Diálogo Constante (7 dias seguidos)
- **Acesso:** Constância (3d) · Semana Perfeita (7d) · Mês de Ouro (30d) · Veterano (30 dias de uso)
- **Humor:** Observador (7 registros) · Autoconhecimento (30 registros)
- **Diário:** Escritor (5 entradas) · Cronista (15 entradas)
- **Desafios:** Dia Completo
- **Níveis:** Primeiros Passos (nv.3) · Meio Caminho (nv.5) · Mestre MindUni (nv.10)
- **XP:** Mil Pontos (1.000 XP)

Conquistas recém-desbloqueadas aparecem como um toast (`BadgeToast`); a descrição de cada uma é exibida ao tocar no badge no perfil.

### Conta e Privacidade (LGPD)
- **Consentimento LGPD** no onboarding, vinculado à conta (data e versão da política)
- **Tela de edição de perfil**: alterar **foto**, **nome** e **senha** (com reautenticação)
- **Política de Privacidade** acessível dentro do app
- **Recuperação de senha por código (OTP)** enviado por e-mail
- **Limpar meus dados**: apaga humor, diário, conversas, práticas e progresso, mantendo a conta
- **Excluir minha conta**: remoção definitiva da conta e de todos os dados

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework mobile | Expo SDK 54 + Expo Router 6 |
| Runtime | React 19 · React Native 0.81 (New Architecture) |
| Linguagem | JavaScript/JSX + TypeScript |
| Estilização | NativeWind (Tailwind CSS para React Native) |
| Backend & Auth | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| IA / LLM | Google Gemini (Flash) via Edge Function Deno |
| Estado global | React Context API |
| Ícones | Lucide React Native |
| Animações | React Native Reanimated 4 |
| Imagens | expo-image-picker |

---

## Arquitetura

```
minduni/
├── app/                          # Páginas (roteamento por arquivo - Expo Router)
│   ├── _layout.jsx               # Layout raiz com guard de autenticação + toasts globais
│   ├── index.jsx                 # Rota inicial / redirecionamento
│   ├── privacy-policy.jsx        # Política de Privacidade (LGPD)
│   ├── edit-profile.jsx          # Edição de conta: foto, nome, senha, limpar/excluir dados
│   ├── (auth)/                   # Login, cadastro e recuperação de senha
│   │   ├── login.jsx
│   │   ├── forgot-password.jsx
│   │   └── reset-password.jsx    # Redefinição via código OTP
│   ├── (onboarding)/index.jsx    # Carrossel de boas-vindas + consentimento LGPD
│   └── (tabs)/                   # 5 abas principais
│       ├── index.jsx             # Início (Dashboard)
│       ├── chat.jsx              # Sage (chat corrido)
│       ├── challenges.jsx        # Práticas (desafios diários)
│       ├── journal.jsx           # Diário emocional
│       └── profile.jsx           # Jornada (perfil e conquistas)
├── src/
│   ├── components/               # Componentes reutilizáveis
│   │   ├── XPBar.jsx · XPToast.jsx · BadgeCard.jsx · BadgeToast.jsx
│   │   ├── ChatMessage.jsx · CrisisModal.jsx · CVVButton.jsx
│   │   └── MoodChart.jsx · MoodOption.jsx · StreakCard.jsx
│   ├── context/UserContext.jsx   # Estado global do usuário
│   ├── lib/supabase.js           # Cliente Supabase
│   ├── services/                 # Lógica de negócio
│   │   ├── authService.js · accountService.js
│   │   ├── chatService.js · challengeService.js · journalService.js
│   │   ├── progressService.js · onboardingService.js · storage.js
│   └── data/                     # Dados estáticos
│       ├── challenges.js · badges.js
└── supabase/
    └── functions/sage-chat/      # Edge Function Deno (Gemini API)
        └── index.ts
```

> As Edge Functions **`upload-avatar`** (envio de foto via `service_role`) e **`delete-account`** (exclusão definitiva da conta) rodam no Supabase. Mantenha-as versionadas em `supabase/functions/` ao evoluí-las.

### Fluxo de Autenticação

```
Primeiro acesso:  Onboarding + consentimento LGPD → Cadastro → Início
Retorno:          Sessão persistida → Auto-login → Início
Recuperação:      E-mail → código OTP → nova senha
Proteção:         Guard no _layout.jsx redireciona conforme estado de login
```

### Fluxo do Chat (Sage)

```
1. Check-in de humor do dia (1-5), quando aplicável
2. Reaproveita a conversa contínua do usuário (ou cria na primeira vez)
3. Mensagem → Edge Function → resumo rolante + histórico recente → Gemini
4. Detecção de crise (cliente + servidor) com resposta de acolhimento + CVV
5. XP por streak da 1ª mensagem do dia + verificação de conquistas
```

---

## Banco de Dados (Supabase)

Tabelas principais:
- `profiles` — dados do usuário (nome, `avatar_url`, consentimento LGPD: data e versão)
- `progress` — XP, nível, sequências, conquistas, histórico de humor
- `chat_sessions` — conversa contínua + resumo rolante (`summary`, `summarized_until`)
- `chat_messages` — mensagens individuais
- `journal_entries` — entradas do diário
- `challenge_logs` — registro de desafios concluídos

Storage:
- Bucket público `avatars` — fotos de perfil (escrita restrita à pasta do próprio usuário)

Todas as tabelas têm **RLS** habilitado e as chaves estrangeiras para `auth.users` usam `ON DELETE CASCADE`, garantindo a remoção completa dos dados ao excluir a conta.

---

## Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Chave da API do [Google AI Studio](https://aistudio.google.com)
- App [Expo Go](https://expo.dev/go) no celular (para testes)

### 1. Clone o repositório
```bash
git clone https://github.com/CosmoAdryan/minduni.git
cd minduni
npm install --legacy-peer-deps
```

> O `--legacy-peer-deps` é necessário por conta das faixas de peer dependencies do ecossistema Expo SDK 54 / React 19.

### 2. Configure as variáveis de ambiente
Crie o arquivo `.env` na raiz:
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Configure o Supabase
- Crie as tabelas acima com RLS por usuário e o bucket público `avatars`
- Faça o deploy das Edge Functions: `sage-chat`, `upload-avatar` e `delete-account`
- Configure o secret do Gemini para a `sage-chat`:
```bash
supabase secrets set GEMINI_API_KEY=sua-chave-gemini
```
- Para a recuperação de senha por OTP, configure o template de e-mail do Supabase para usar `{{ .Token }}` (código de 6 dígitos)

### 4. Inicie o app
```bash
npx expo start
```
Escaneie o QR code com o Expo Go (Android/iOS) ou pressione `a`/`i` para emulador.

> A foto de perfil usa `expo-image-picker`. No Expo Go funciona direto; para **builds nativos (EAS)**, refaça o `prebuild`/build para que a permissão de fotos (declarada no `app.json`) seja aplicada.

---

## Segurança e Privacidade

- Autenticação via Supabase Auth (JWT)
- Row-Level Security (RLS) habilitado em todas as tabelas
- Chave da API Gemini armazenada **apenas no servidor** (Edge Function)
- Upload de avatar intermediado por Edge Function com `service_role` (o usuário grava só na própria pasta)
- Detecção de crise com encaminhamento imediato ao CVV (188)
- Conformidade com a **LGPD**: consentimento explícito, direito de acesso/correção, limpeza e exclusão de dados

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

Desenvolvido como projeto acadêmico (TCC) de pesquisa e inovação em saúde mental digital para universitários brasileiros.

> Se você está em crise ou conhece alguém que esteja, ligue **188** (CVV) — gratuito, 24 horas.
