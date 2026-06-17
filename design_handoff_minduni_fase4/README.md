# Handoff: MindUni — Fase 4 (Redesign + Design System)

## ⚠️ LEIA ISTO PRIMEIRO — Projeto existente, não greenfield

**Este NÃO é um app novo.** O MindUni já existe e está em produção/desenvolvimento como um aplicativo **React Native + Expo com NativeWind (Tailwind para RN)**. Já tem telas funcionando, navegação configurada, integração com Supabase (auth + dados) e com a API Gemini (o agente "Sage").

A sua tarefa é **aplicar um redesign sobre um app que já funciona** — trocar a camada visual e adicionar microinterações, **preservando a lógica existente**. Isso é fundamentalmente diferente de construir do zero.

### Por que isso importa (e por que vai gerar bugs se ignorado)

Trocar layout, renomear componentes e migrar tokens de cor em um app com funcionalidades já conectadas **vai quebrar coisas**. É esperado. O trabalho inclui **identificar e corrigir** essas quebras, não apenas aplicar o visual novo. Pontos de atenção concretos:

1. **Migração `purple-*` → `sage-*`** é uma busca-e-substituição global. Toda referência a classes `purple-` no codebase precisa ser trocada. Risco: classes em strings dinâmicas, em styles condicionais, ou em componentes compartilhados podem ser perdidas. **Faça um grep completo por `purple` (não só `purple-`) e revise cada ocorrência manualmente.**

2. **`BadgeCard` tem um bug conhecido de classe dinâmica** (`className={badge.color}` não funciona no build NativeWind). A correção (mapa estático de variantes) **muda a assinatura/props do componente**. Qualquer lugar que renderiza `BadgeCard` precisa ser atualizado e testado.

3. **Renomeação de labels da Tab bar** ("Chat"→"Sage", "Desafios"→"Práticas", "Perfil"→"Jornada") pode afetar **rotas e deep links** se os nomes das rotas estiverem acoplados aos labels. Verifique o `_layout` das tabs e qualquer `router.push()` que use esses nomes.

4. **Trocar emoji por ícones SVG (Lucide)** na Tab bar e em badges muda o sistema de renderização de ícones. Garanta que a lib de ícones está instalada e que os imports não quebram o bundle.

5. **Adicionar `useSafeAreaInsets()`** na Tab bar exige `react-native-safe-area-context` e que o app esteja envolvido em `SafeAreaProvider`. Se já estiver, ótimo; se não, adicionar isso pode deslocar o layout de TODAS as telas.

6. **Fonte Lora (voz do Sage)** exige `expo-font` + carregamento assíncrono. Se a fonte não carregar antes do render, o texto do Sage cai no fallback serif — teste o estado de loading da fonte.

7. **Animações com Reanimated** (Bloco 3): se a versão do Reanimated no projeto for diferente da assumida (v3), a API de `useSharedValue`/`withSpring` pode divergir. Confirme a versão antes de implementar.

### Protocolo recomendado de implementação

- **Implemente por etapas, não tudo de uma vez.** Siga a prioridade do checklist (Bloco 4, seção 4.2): críticos → alto → médio → baixo.
- **Após cada etapa, rode o app e teste o fluxo afetado.** Não acumule mudanças visuais sem verificar funcionalidade.
- **Mantenha a lógica de negócio intacta.** O redesign é da camada de apresentação. Handlers, chamadas a Supabase/Gemini, cálculo de XP/streak e detecção de crise **não devem mudar de comportamento** — só de aparência.
- **Quando um layout novo quebrar uma funcionalidade, o conserto é prioridade sobre o visual.** Um botão bonito que não dispara a ação é pior que um botão feio que funciona.

---

## Overview

A Fase 4 entrega o redesign visual completo do MindUni — um app de saúde mental para universitários. Substitui a paleta roxa genérica por um sistema "minimalismo quente" (stone + sage), adiciona uma voz tipográfica distinta para o agente Sage (Lora italic), especifica 7 telas finais, todos os estados (vazio/loading/erro), o fluxo da CrisisModal, 7 microinterações com timing, e um pacote completo de tokens + checklist + princípios éticos.

## About the Design Files

Os arquivos `.html` neste pacote são **referências de design criadas em HTML/React** — protótipos que mostram a aparência e o comportamento pretendidos. **Não são código de produção para copiar diretamente.**

A tarefa é **recriar esses designs no codebase React Native + Expo + NativeWind existente**, usando os padrões e bibliotecas já estabelecidos no projeto. Os protótipos usam React DOM e CSS inline apenas para fins de demonstração no navegador; no app real, traduza para componentes React Native com `StyleSheet`/NativeWind e animações com Reanimated.

Abra cada arquivo `.html` em um navegador para ver os designs ao vivo (incluindo as microinterações interativas no arquivo 03 e os toggles de checklist no 04).

## Fidelity

**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamento, border-radius e timing de animação são finais e devem ser reproduzidos com precisão. Todos os valores hex e medidas estão documentados na seção Design Tokens abaixo e no arquivo 04. A direção visual (Variação A — monocromática, base stone) já foi escolhida e travada; não há mais decisões A/B pendentes.

## Stack do projeto (confirme antes de começar)

- **Framework:** React Native + Expo
- **Estilização:** NativeWind v4 (Tailwind para RN) — `tailwind.config.js` (config final no arquivo 04)
- **Navegação:** Expo Router (tabs)
- **Backend:** Supabase (auth + persistência de diário/sessões)
- **IA:** Google Gemini (agente Sage)
- **Animação:** Reanimated 3 (assumido — confirmar versão)
- **Fontes:** Inter (UI geral) + Lora Italic (exclusivo para mensagens do Sage), via `expo-font`
- **Ícones:** Lucide (SVG) — substitui emoji
- **Safe area:** `react-native-safe-area-context`

## Screens / Views

As 7 telas finais estão no **arquivo 01** (com ficha técnica de cada uma). Resumo:

| # | Tela | Arquivo de referência (sugestão) | Propósito |
|---|------|----------------------------------|-----------|
| 01 | Login / Auth | `LoginScreen.tsx` | Google SSO + e-mail. **Remover afirmação falsa de privacidade.** |
| 02 | Onboarding | `OnboardingScreen.tsx` | 4 slides; slide final dark com "criar conta" / "explorar sem conta" + aviso de persistência |
| 03 | Dashboard | `DashboardScreen.tsx` | XP, streak, prática do dia, mini-chart de humor |
| 04 | Chat com Sage | `ChatScreen.tsx` + `PreChatScreen.tsx` | Pré-tela de humor → conversa; CVV permanente no header; Lora italic |
| 05 | Práticas | `PracticesScreen.tsx` | Filtros, cards locked/done/pending |
| 06 | Diário | `DiaryScreen.tsx` | Lista de entradas, FAB, mini-chart, empty states |
| 07 | Jornada (Perfil) | `ProfileScreen.tsx` | Stats, badges (locked/unlocked sem cor dinâmica) |

Para layout detalhado (grid, padding, dimensões, cores por elemento, copy exata), **abra o arquivo 01 no navegador** e leia a ficha técnica ao lado de cada telefone. Os valores estão também no código React de cada arquivo.

## Interactions & Behavior

- **Estados (vazio / loading / erro):** arquivo **02**, seção 1. Skeleton com shimmer, banner offline âmbar (nunca vermelho — não é culpa do usuário), fallback de dados via AsyncStorage.
- **CrisisModal (3 momentos):** arquivo **02**, seção 2. Detecção via Gemini → mensagem âncora **hardcoded** → bottom sheet com acknowledgment obrigatório (sem botão X, sem swipe-to-dismiss) → pós-confirmação com CVV pin permanente. Acesso manual via botão 188 sempre no header.
- **5 tons do Sage:** arquivo **02**, seção 3. Acolhedor / Reflexivo / Sugestivo / Âncora (texto fixo, não-IA) / Retomada. Cada tom tem temperatura Gemini e system prompt próprios.
- **7 microinterações com timing/easing/haptics:** arquivo **03**. XP Toast, Respiração 4-7-8, Mood Selector, XP Bar Fill, Streak Pop, Typing Indicator, Crisis Entry. Cada uma tem tabela de spec + nota de implementação Reanimated 3. **As demos no arquivo 03 são interativas — clique em "Reproduzir".**

## State Management

- **XP / nível / streak:** persistir em AsyncStorage (fonte de verdade local) + sincronizar com Supabase em background. Permite estado offline.
- **`hasOpenedDiary`** (AsyncStorage): controla prompt suave na 1ª abertura do Diário vs. empty state limpo depois.
- **`onboardingDone`** (AsyncStorage): pula onboarding em reaberturas.
- **Mood da sessão:** mood selecionado na pré-tela do chat é injetado no contexto enviado ao Gemini.
- **Estado da CrisisModal:** flag de acknowledgment; CVV pin persiste pelo resto da sessão após confirmação.

## Design Tokens

Config completa e final no **arquivo 04, seção 4.1** (pronta para colar no `tailwind.config.js`). Resumo:

**Cores**
- **Stone** (neutro quente): `50 #FAFAF8` · `100 #F4F2EE` · `200 #E6E2DB` · `300 #CEC9BF` · `400 #A29D95` · `500 #756F66` · `600 #5A544C` · `700 #3A3731` · `800 #282521` · `900 #1C1917`
- **Sage** (accent único): `50 #EEF5F1` · `100 #D4E9DE` · `200 #A9D3BF` · `400 #5E9B84` · `500 #3D7A67` (PRIMARY) · `600 #2D6254` · `700 #1E4D41`
- **XP** (âmbar): `light #FEF8EC` · `border #FCEECE` · `main #D4973E` · `dark #B87A28`
- **Crisis** (coral, não vermelho): `light #FDF2F2` · `border #F5C6C6` · `main #C04A4A` · `dark #9B2424`
- **Mood scale** (Jonauskaite 2020): `1 #3B6FAB` (azul profundo) · `2 #6B8FAB` · `3 #888787` (cinza) · `4 #5E9B84` (sage) · `5 #C9963A` (dourado). **Nenhum estado de humor usa vermelho.**
- **Dark mode:** `bg #131210` · `surf #1D1B17` · `border #2C2922` (sage mantém o mesmo valor no dark)

**Tipografia**
- `Inter` para toda a UI; `Lora Italic` **exclusivamente** para mensagens do Sage (`role === 'sage'`)
- Escala: caption 11/16 · small 13/20 · body 15/24 · title-sm 17/26/700 · title 20/28/800 · display 24/32/800

**Espaçamento** (base 4pt): 1=4 · 2=8 · 3=12 · 4=16 · 5=20 · 6=24 · 8=32 · 12=48 (px)

**Border radius:** sm 6 · md 12 · lg 20 · pill 999 (px)

## Checklist de implementação priorizado

**Arquivo 04, seção 4.2** — 20 itens com prioridade (crítico/alto/médio/baixo), descrição e arquivo-alvo. **Comece pelos 4 críticos:**
1. Remover afirmação falsa de privacidade no login
2. Migrar `purple-*` → `sage-*` (global)
3. `BadgeCard` — remover className dinâmico (corrige bug de build)
4. CVV 188 — garantir visibilidade em todos os estados do Chat

## Acessibilidade

**Arquivo 04, seção 4.5** — 10 requisitos com snippets prontos de `accessibilityLabel` / `accessibilityRole` / `accessibilityState`. Implementar antes do release (VoiceOver/TalkBack).

## Princípios éticos não-negociáveis

**Arquivo 04, seção 4.6** — 7 princípios que **não podem ser removidos por decisão de produto**:
1. CVV 188 visível em todas as telas de interação (nunca colapsa/some)
2. CrisisModal sem bypass (sem X, acknowledgment obrigatório, mensagem âncora hardcoded)
3. Streak sem punição (sem vermelho, sem "você perdeu")
4. Privacidade sem afirmação falsa
5. Humor sem julgamento de cor (sem vermelho para estados negativos)
6. Sage não é terapeuta (sem diagnóstico; ancora e passa para o CVV em crise)
7. Dados de saúde mental com sensibilidade máxima (criptografia, retenção limitada, sem treino sem consentimento)

## Files (neste pacote)

- `01-telas-finais.html` — 7 telas finais + fichas técnicas
- `02-estados-crisis-sage.html` — estados, CrisisModal (3 momentos), 5 tons do Sage
- `03-microinteracoes.html` — 7 microinterações interativas + specs Reanimated
- `04-tokens-checklist-etica.html` — tokens, checklist priorizado, mapa de componentes, guia de copy, acessibilidade, ética
- `README.md` — este arquivo

> **Dica:** abra os arquivos `.html` em um navegador para ver os designs ao vivo. O arquivo 03 tem demos interativas (botões "Reproduzir") e o 04 tem um checklist com toggles.
