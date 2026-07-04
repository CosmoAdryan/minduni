# MindUni — Histórico e Documentação Completa do Projeto

> App de saúde mental e bem-estar emocional para estudantes universitários brasileiros.
> Documento gerado em **2026-06-29** a partir do histórico do Git/GitHub, do projeto Supabase e dos arquivos do repositório.

---

## 1. Visão geral

O **MindUni** é um aplicativo móvel (Android/iOS) construído com **Expo / React Native**, que oferece:

- **Sage** — assistente de bem-estar baseado em Terapia Cognitivo-Comportamental (TCC), em formato de chat contínuo com memória de longo prazo (resumo rolante), alimentado pelo **Google Gemini** via Edge Function.
- **Check-in de humor** diário (escala 1–5, paleta Jonauskaite 2020 sem vermelho).
- **Diário** emocional com registro de humor e texto.
- **Práticas/Desafios** diários de TCC.
- **Gamificação**: XP, níveis, streaks e 15 conquistas (badges).
- **Detecção de crise** (palavras-chave de risco) com encaminhamento ao **CVV 188**, no cliente e no servidor.
- **Privacidade/LGPD**: consentimento registrado, edição de conta, limpeza de dados e exclusão definitiva.

### Identificação técnica
- **Repositório:** https://github.com/CosmoAdryan/minduni
- **Projeto Supabase:** `olsooajmanagfvaxgaxb` — https://olsooajmanagfvaxgaxb.supabase.co
- **EAS (build):** `@cosmo-adryan/minduni`
- **Branch principal:** `main` · **Branch de trabalho atual:** `chore/upgrade-expo-54`
- **Total de commits:** 22

---

## 2. Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Expo SDK **54**, React **19.1.0**, React Native **0.81.5** |
| Navegação | expo-router **6** (file-based) |
| Estilo | NativeWind **4.2.5** + Tailwind CSS 3.4 (design tokens stone + sage) |
| Animação | react-native-reanimated **4.1** + react-native-worklets |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| IA | Google Gemini (via Edge Function `sage-chat`) |
| Fontes | Inter + Lora (voz do Sage em serif itálico) |
| Ícones | lucide-react-native |
| Build/Deploy | EAS Build (perfis development/preview/production) |

---

## 3. Linha do tempo (histórico de commits)

Ordem cronológica. Cada entrada lista o que foi **desenvolvido**, **alterado** ou **removido**.

### 🟢 Início do projeto

**`f9b0a0b` — 2026-03-26 — feat: MindUni - app de saúde mental para universitários**
Commit inicial (50 arquivos, ~16.7k linhas). Base completa do app:
- Telas: login, onboarding, tabs (home/chat/challenges/journal/profile).
- Serviços: auth, challenge, chat, journal, onboarding, progress, storage.
- Componentes: BadgeCard, ChatMessage, CrisisModal, XPBar, XPToast.
- Dados: badges, challenges, chatResponses.
- Edge Function `sage-chat` (1ª versão), integração Supabase, NativeWind/Tailwind.
- Docs: README, ARTIGO_TECNICO.md.

### 🤖 Automação (GitHub Actions)

**`7239d9c` — 2026-06-10 — "Claude PR Assistant workflow"** — adiciona `.github/workflows/claude.yml`.
**`688dce2` — 2026-06-10 — "Claude Code Review workflow"** — adiciona `.github/workflows/claude-code-review.yml`.

### 🔒 Correções críticas de segurança (PR #1)

**`7bcd89c` — 2026-06-10 — fix(segurança): falhas críticas na Edge Function e UI**
- **Valida assinatura do JWT** via `supabase.auth.getUser()` (antes o payload era decodificado sem verificação — qualquer token forjado acessava o Gemini).
- Habilita `verify_jwt=true` no `config.toml` da `sage-chat`.
- Implementa **limite diário de 20 mensagens** no servidor (antes inexistente, apesar de anunciado), isentando mensagens de crise.
- Para de **vazar erros internos/do Gemini** ao cliente (loga server-side, retorna mensagem genérica).
- Corrige afirmação **falsa de privacidade** na tela de login.

**`7689c6b` — 2026-06-15 — Merge PR #1** (`fix/seguranca-criticos`).

### 🎨 Redesign visual — Fase 4

**`039fa73` — 2026-06-15 — Fase 4: redesign visual (stone + sage)**
Migra a apresentação da paleta roxa para o sistema "minimalismo quente" (stone + sage), **preservando toda a lógica de negócio**:
- Migração global `purple-*` → `sage-*`/`stone-*`.
- `BadgeCard` com mapa estático de variantes (corrige bug de className dinâmico).
- CVV 188 sempre visível no header do Chat.
- `CrisisModal` redesenhada (bottom sheet, coral, acknowledgment obrigatório, sem botão fechar).
- Voz do Sage em serif itálico (Lora).
- Tab bar renomeada (Sage/Práticas/Jornada), escala de humor Jonauskaite 2020.
- Novos: `CVVButton`, `Skeleton`, `src/theme.js`.

**`5388a80` — 2026-06-17 — checkpoint: redesign fase 4 + recuperação de senha via OTP**
Ponto de restauração antes do upgrade. Adiciona:
- Recuperação de senha por **OTP**: `forgot-password.jsx` + `reset-password.jsx`.
- Componentes `MoodOption`, `StreakCard`; `src/theme/tokens.js`.
- Pasta `design_handoff_minduni_fase4/` (specs HTML).

### ⬆️ Upgrade Expo SDK 54 + LGPD (PR #3)

**`b79fe8c` — 2026-06-18 — feat: upgrade Expo SDK 54, correções de UX e consentimento LGPD**
- **Upgrade Expo SDK 52 → 54** (React 19.1, RN 0.81, Reanimated 4, expo-router 6).
- Corrige navegação pós-login (rota raiz `app/index.jsx` + AuthGuard).
- Corrige upsert de progresso e desafios (`onConflict`).
- Safe-area edge-to-edge, teclado do chat, XP toast duplicado.
- Animação de respiração consciente (anel SVG).
- **Onboarding com tela de consentimento LGPD obrigatória** + `app/privacy-policy.jsx`.
- Novo serviço `onboardingService` (consentimento gravado em `profiles`).

**`2b5e6c7` — 2026-06-18 — Merge PR #3.**

**`d32a7e3` — 2026-06-18 — chore: remove tooling/materiais locais do versionamento** ❌
Destrackeia (mantendo cópias locais): `.claude/`, `.mcp.json`, `.agents/`, `skills-lock.json`, `ARTIGO_TECNICO.md`, `design_handoff_minduni_fase4/`.

### 💬 Chat contínuo + conquistas (PRs #4 e #5)

**`1374c03` — 2026-06-23 — refactor(humor): extrai MoodChart para componente compartilhado**
Unifica o gráfico "Humor recente" (duplicado na Home e Diário) em `src/components/MoodChart.jsx` (média diária).

**`a9efdd0` — 2026-06-23 — feat(sage): chat corrido com memória de longo prazo e XP por engajamento**
- **Chat corrido**: uma conversa por usuário, histórico recarregado ao abrir; remove fases pré/pós-humor e botão "Encerrar".
- **Memória**: resumo rolante regenerado a cada ~8 mensagens, injetado no contexto (`chat_sessions.summary`).
- System prompt enxuto (~895 → ~558 tokens); `thinkingBudget 0`; remove `DAILY_MESSAGE_LIMIT`.
- XP por streak de mensagem; check-in de humor leve 1x/dia; badge `first_chat`.

**`496ddf5` — 2026-06-23 — Merge PR #4.**

**`a733426` — 2026-06-23 — feat(conquistas): all_challenges alcançável, modal de descrição e novos badges**
- Torna `all_challenges` alcançável (3 desafios/dia concluídos).
- Badges tocáveis → modal com descrição e status.
- +5 conquistas: `level_3`, `chat_streak_7`, `mood_30`, `journal_15`, `active_30`.
- Stat do perfil "Sessões" → "Mensagens" (contagem real).

**`7ede339` — 2026-06-23 — Merge PR #5.**

### 👤 Conta e LGPD (PR #6)

**`6e68e31` — 2026-06-25 — feat(conta): edição de perfil (foto/nome/senha) e direitos LGPD**
- Tela `app/edit-profile.jsx`: alterar foto, editar nome, trocar senha (com reautenticação).
- **Limpar dados de uso** (mantém conta) e **excluir conta definitivamente**.
- Edge Functions `upload-avatar` e `delete-account` (service_role); coluna `profiles.avatar_url`; `expo-image-picker`.
- Componente `BadgeToast`; finaliza fiação das conquistas.

**`b361d90` — 2026-06-25 — Merge PR #6.**

### 📦 Build, branding e ajustes finais

**`b44d9ae` — 2026-06-25 — docs: atualiza README** (SDK 54, chat com memória, LGPD).

**`0a6986f` — 2026-06-25 — chore(build): configura EAS Build** — `eas.json` (development/preview/production, APK preview), `.npmrc` (legacy-peer-deps), `.easignore`.

**`fa6e686` — 2026-06-25 — chore(build): vincula projeto EAS** (`@cosmo-adryan/minduni`).

**`196a0a5` — 2026-06-26 — fix: saudação geral do Sage sem humor e trava de tema claro**
- `sage-chat`: saudação de abertura geral quando o humor ainda não foi informado.
- `expo-system-ui`: força `userInterfaceStyle: light` no Android.

**`345efbb` — 2026-06-26 — feat(branding): logo do MindUni como ícone, marca no onboarding e Sage** *(HEAD)*
- `assets/logo.png` (fundo transparente), ícone e adaptive icon.
- Logo + wordmark no onboarding; avatar do Sage usa a logo no lugar do emoji 🌿.

---

## 4. Arquitetura atual do app (`src/` e `app/`)

### Telas (`app/` — expo-router)
| Rota | Função |
|------|--------|
| `(auth)/login.jsx` | Login/cadastro |
| `(auth)/forgot-password.jsx` · `reset-password.jsx` | Recuperação por OTP |
| `(onboarding)/index.jsx` | Onboarding + consentimento LGPD |
| `(tabs)/index.jsx` | Home/Dashboard |
| `(tabs)/chat.jsx` | Sage (chat contínuo) |
| `(tabs)/challenges.jsx` | Práticas de TCC |
| `(tabs)/journal.jsx` | Diário emocional |
| `(tabs)/profile.jsx` | Perfil, conquistas, stats |
| `edit-profile.jsx` | Edição de conta + direitos LGPD |
| `privacy-policy.jsx` | Política de Privacidade |
| `index.jsx` · `_layout.jsx` | Rota raiz + AuthGuard |

### Serviços (`src/services/`)
`authService`, `accountService`, `challengeService`, `chatService`, `journalService`, `onboardingService`, `progressService`, `storage`.

### Componentes (`src/components/`)
`BadgeCard`, `BadgeToast`, `ChatMessage`, `CrisisModal`, `CVVButton`, `MoodChart`, `MoodOption`, `StreakCard`, `XPBar`, `XPToast`.

### Contexto e dados
- `src/context/UserContext.jsx` — estado global (usuário, progresso, ações).
- `src/data/` — `badges.js` (15 conquistas), `challenges.js`, `chatResponses.js`.
- `src/theme/tokens.js` — design tokens.

---

## 5. Backend Supabase

### 5.1 Tabelas (schema `public`, todas com RLS habilitado)

| Tabela | Colunas principais | RLS | Linhas* |
|--------|-------------------|-----|--------|
| `profiles` | `id`(FK auth.users), `name`, `avatar_url`, `consent_given_at`, `consent_version` | ✅ | 1 |
| `progress` | `user_id`, `total_xp`, `level`, `streak`, `unlocked_badges[]`, `moods`(jsonb), `chat_streak`, `chat_streak_date`, `days_active`… | ✅ | 1 |
| `journal_entries` | `user_id`, `mood`(1–5), `text`, `created_at` | ✅ | 8 |
| `challenge_logs` | `user_id`, `challenge_id`, `completed_date` | ✅ | 3 |
| `chat_sessions` | `user_id`, `pre_mood`, `post_mood`, `summary`, `summarized_until` | ✅ | 8 |
| `chat_messages` | `session_id`(FK), `user_id`, `role`(user/model), `content` | ✅ | 109 |

\* Contagem em 2026-06-29. Todas as FKs de `user_id` apontam para `auth.users` com **ON DELETE CASCADE**.

### 5.2 Política de RLS
Todas as tabelas usam uma policy `FOR ALL` com `auth.uid() = user_id` (ou `= id` em `profiles`). O `WITH CHECK` herda o `USING`, garantindo que ninguém insira/edite linhas de outro usuário.
**Teste de isolamento executado em 2026-06-29: PASSOU** (usuário com id alheio enxerga 0 linhas em todas as tabelas).

### 5.3 Migrations
| Versão | Nome |
|--------|------|
| `20260618232753` | `add_consent_to_profiles` (LGPD) |
| `20260623000221` | `continuous_chat_summary_and_chat_streak` (memória + streak de chat) |
| `20260625232024` | `add_avatar_and_storage` (avatar_url + bucket) |
| `20260625232833` | `tighten_avatar_select_policy` |
| `20260629234957` | `harden_security_search_path_and_anon_grants` (endurecimento — ver §6) |

> Nota: a migration de segurança também foi salva localmente em `supabase/migrations/` para versionamento.

### 5.4 Edge Functions (todas com `verify_jwt=true`)
| Função | Papel | Descrição |
|--------|-------|-----------|
| `sage-chat` (v19) | anon + JWT do usuário | Chat com Gemini; valida JWT via `getUser()`; resumo rolante; detecção de crise server-side; erros genéricos ao cliente. |
| `upload-avatar` (v1) | service_role | Upload do avatar para `{uid}/avatar.jpg` (contorna instabilidade da RLS do Storage no RN); identifica o usuário pelo token. |
| `delete-account` (v1) | service_role | Exclusão definitiva (LGPD art. 18, VI): remove avatar do Storage + `auth.admin.deleteUser` (cascade apaga todos os dados). |

### 5.5 Storage
- Bucket **`avatars`** (público). Estrutura `{uid}/avatar.jpg`. Sem cascade — limpeza manual no `delete-account`.

---

## 6. Histórico de segurança

| Data | Ação |
|------|------|
| 2026-06-10 | Correções críticas: validação de assinatura do JWT, `verify_jwt`, rate-limit server-side, parada de vazamento de erros, correção de claim de privacidade. |
| 2026-06-29 | **Auditoria + endurecimento** (migration `20260629234957`): `handle_new_user` com `search_path=''` e `EXECUTE` revogado de PUBLIC/anon/authenticated; **`REVOKE ALL` do papel `anon`** nas 6 tabelas (42 → 0 grants); teste de isolamento de RLS confirmado. |

### Pendências de segurança (exigem ação no Dashboard)
- ⚠️ **Ativar "Leaked Password Protection"** (HaveIBeenPwned) em Auth → Password.
- ℹ️ Aviso `pg_graphql_authenticated_table_exposed` nas 6 tabelas é **aceito/intencional**: o app precisa que o usuário autenticado leia as próprias linhas; a RLS garante o isolamento.

### Estado do cliente
- `.env` **não versionado** (no `.gitignore`); enviado ao EAS via `.easignore`.
- Sem `service_role` no cliente — usa apenas a *publishable/anon key* (pública por design).

---

## 7. Build e Deploy (EAS)

- `eas.json`: perfis **development**, **preview** (gera **APK** com link de download) e **production**.
- `.npmrc` com `legacy-peer-deps=true` (necessário para o install na nuvem com SDK 54).
- `.easignore` permite enviar o `.env` ao EAS sem versioná-lo no Git.
- `app.json`: `versionCode` incrementado a cada release (atual: 3); `userInterfaceStyle: light`.

---

## 8. Branches e Pull Requests

**Branches remotas:** `main`, `chore/upgrade-expo-54`, `fix/seguranca-criticos`, `add-claude-github-actions-1781143112022`, `claude/nifty-pasteur-eugm27`.

**Pull Requests mesclados:**
- **#1** `fix/seguranca-criticos` → correções críticas de segurança.
- **#3** `chore/upgrade-expo-54` → upgrade SDK 54 + LGPD.
- **#4** → chat corrido com memória + MoodChart.
- **#5** → conquistas (correções e novos badges).
- **#6** → edição de conta e direitos LGPD.

> A branch `chore/upgrade-expo-54` segue ativa (HEAD em `345efbb`), à frente de `main` desde o merge #6.

---

## 9. Pendências e próximos passos sugeridos

- [ ] Ativar Leaked Password Protection no Supabase (segurança). **Passo manual**: só pode ser
      feito no Dashboard (a Management API exige token com acesso ao projeto, que a CLI local não
      tem): Dashboard → Authentication → Sign In / Providers → Passwords → habilitar
      *"Prevent use of leaked passwords"* (checa contra HaveIBeenPwned). Aproveitar e subir o
      mínimo de senha para 8 caracteres (hoje 6) — se subir, ajustar também a validação em
      `accountService.changePassword` e nas telas de cadastro/reset.
- [x] Criar suíte de **testes automatizados**. *(feito em 2026-07-03: jest-expo com 42 testes — detecção de crise, níveis/XP e contrato das RPCs de gamificação; rodar com `npm test`. A lógica autoritativa de XP/streak/badges migrou para o Postgres — migration `server_side_gamification`.)*
- [ ] Análise heurística de **usabilidade** (Nielsen) e acessibilidade.
- [ ] Considerar reverter `GEMINI_MODEL` para `gemini-2.5-flash` ao ligar billing (hoje em modelo *preview* por cota).
- [x] Merge da `chore/upgrade-expo-54` em `main` quando estabilizada. *(feito em 2026-07-03; correções de segurança seguem na branch `fix/hardening-seguranca`)*

---

*Documento gerado automaticamente a partir do Git, do projeto Supabase `olsooajmanagfvaxgaxb` e dos arquivos do repositório em 2026-06-29.*
