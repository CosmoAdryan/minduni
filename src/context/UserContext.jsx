import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as authService from '../services/authService';
import * as accountService from '../services/accountService';
import * as progressService from '../services/progressService';
import * as journalService from '../services/journalService';
import * as challengeService from '../services/challengeService';
import * as taskService from '../services/taskService';
import { BADGES } from '../data/badges';

// Re-export LEVELS so existing imports (e.g. XPBar) keep working
export const LEVELS = progressService.LEVELS;

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [progress, setProgress] = useState(progressService.INITIAL_PROGRESS);
  const [xpNotification, setXpNotification] = useState(null);
  const [badgeNotification, setBadgeNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  // Ref espelha isRecovering para uso dentro do listener de auth (closure).
  const recoveringRef = useRef(false);

  function beginRecovery() {
    recoveringRef.current = true;
    setIsRecovering(true);
  }

  function endRecovery() {
    recoveringRef.current = false;
    setIsRecovering(false);
  }

  useEffect(() => {
    // Restore session on app launch and listen for auth changes.
    // O callback é síncrono e barato de propósito: await de chamadas ao
    // Supabase aqui dentro segura o lock de auth do supabase-js e trava a
    // inicialização (splash longo no 1º cold start). O usuário é montado na
    // hora a partir da sessão local (AsyncStorage, sem rede) para destravar a
    // navegação; perfil e progresso chegam em segundo plano.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Durante a recuperação de senha a sessão (temporária) é criada pelo
        // handler de deep link. Não entramos na área autenticada: deixamos o
        // usuário na tela de redefinição.
        if (recoveringRef.current) {
          setLoading(false);
          return;
        }
        if (session?.user) {
          const { user } = session;
          setCurrentUser((u) => u ?? {
            id: user.id,
            name: '',
            email: user.email,
            avatarUrl: null,
            createdAt: user.created_at,
          });
          setLoading(false);
          // Busca em segundo plano só na restauração do cold start. No
          // SIGNED_IN quem carrega perfil/progresso são login()/register()
          // (buscar aqui também criaria corrida com o applyLogin do login).
          if (event === 'INITIAL_SESSION') {
            setTimeout(async () => {
              try {
                const [fullUser, prog] = await Promise.all([
                  authService.getCurrentUser(),
                  progressService.getProgress(),
                ]);
                if (fullUser) setCurrentUser(fullUser);
                if (prog) setProgress(prog);
              } catch (e) {
                console.error('Session restore error', e);
              }
            }, 0);
          }
        } else {
          setCurrentUser(null);
          setProgress(progressService.INITIAL_PROGRESS);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  function showXpNotification(amount) {
    // Não exibe toast para ganho zero (evita "+0 XP").
    if (!amount || amount <= 0) return;
    setXpNotification(amount);
    setTimeout(() => setXpNotification(null), 3100);
  }

  function showBadgeNotification(badge) {
    setBadgeNotification(badge);
    setTimeout(() => setBadgeNotification(null), 3600);
  }

  // Dispara o popup de conquista para badges recém-desbloqueados (diferença
  // entre os badges anteriores e os novos). Mostra o primeiro novo; eventuais
  // demais aparecem no perfil. Não é usado em login/restore para evitar popups
  // de conquistas que o usuário já tinha.
  function notifyNewBadges(prevBadges, nextBadges) {
    const before = prevBadges || [];
    const newOnes = (nextBadges || []).filter((id) => !before.includes(id));
    if (newOnes.length > 0) {
      const badge = BADGES.find((b) => b.id === newOnes[0]);
      if (badge) showBadgeNotification(badge);
    }
  }

  async function register(name, email, password) {
    const user = await authService.register(name, email, password);
    // A linha de progresso é criada pelo trigger handle_new_user; o reset via
    // RPC garante o estado inicial com last_login = hoje (sem +10 XP no dia).
    const newProgress = await progressService.resetProgress();
    setCurrentUser(user);
    setProgress(newProgress);
    return user;
  }

  async function login(email, password) {
    const user = await authService.login(email, password);
    const { progress: updated, loginXP } = await progressService.applyLogin();
    setCurrentUser(user);
    setProgress(updated);
    if (loginXP > 0) showXpNotification(loginXP);
    return user;
  }

  async function logout() {
    await authService.logout();
    endRecovery();
    setCurrentUser(null);
    setProgress(progressService.INITIAL_PROGRESS);
  }

  async function resetPassword(email) {
    await authService.resetPassword(email);
  }

  // Valida o código OTP e abre a sessão de recuperação. Marca isRecovering para
  // que o AuthGuard não redirecione o usuário ao entrar a sessão temporária:
  // ele deve permanecer na tela de redefinição até salvar a nova senha.
  async function verifyRecoveryOtp(email, token) {
    beginRecovery();
    try {
      await authService.verifyRecoveryOtp(email, token);
    } catch (e) {
      endRecovery();
      throw e;
    }
  }

  async function updatePassword(newPassword) {
    await authService.updatePassword(newPassword);
  }

  // --- Edição de conta (perfil do usuário) ---

  async function updateName(name) {
    const saved = await accountService.updateName(name);
    setCurrentUser((u) => (u ? { ...u, name: saved } : u));
  }

  async function updateAvatar() {
    const asset = await accountService.pickAvatarImage();
    if (!asset) return false; // usuário cancelou
    const url = await accountService.uploadAvatar(asset);
    setCurrentUser((u) => (u ? { ...u, avatarUrl: url } : u));
    return true;
  }

  async function changePassword(currentPassword, newPassword) {
    await accountService.changePassword(currentPassword, newPassword);
  }

  // Limpa dados de uso, mantendo a conta. O reset acontece no servidor.
  async function clearData() {
    const fresh = await accountService.clearUserData();
    setProgress(fresh ?? { ...progressService.INITIAL_PROGRESS });
  }

  // Exclui a conta definitivamente e limpa o estado local (volta ao login).
  async function deleteAccount() {
    await accountService.deleteAccount();
    // A conta de auth já foi removida no servidor; limpamos o token em cache.
    try { await authService.logout(); } catch (_) { /* sessão já inválida */ }
    endRecovery();
    setCurrentUser(null);
    setProgress(progressService.INITIAL_PROGRESS);
  }

  async function addMoodEntry(mood, phase) {
    const prevBadges = progress.unlockedBadges;
    const updated = await progressService.addMoodEntry(mood, phase);
    setProgress(updated);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
  }

  // Chamado ao enviar uma mensagem ao Sage. O servidor aplica o streak de
  // mensagem do dia (5 -> 50, 1x/dia) e marca a primeira conversa (badge
  // first_chat) numa única transação.
  async function onSageMessageSent() {
    const prevBadges = progress.unlockedBadges;
    const { progress: updated, chatXP } = await progressService.applyChatStreak();
    setProgress(updated);
    if (chatXP > 0) showXpNotification(chatXP);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
  }

  // Garante o streak de login do dia a partir da Home (widget "streak em
  // risco"). O servidor decide +10 XP e o incremento/reset do streak
  // (idempotente no dia — chamar de novo não premia duas vezes).
  async function secureDailyStreak() {
    const prevBadges = progress.unlockedBadges;
    const { progress: updated, loginXP } = await progressService.applyLogin();
    setProgress(updated);
    if (loginXP > 0) showXpNotification(loginXP);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
    return loginXP;
  }

  async function addJournalEntry(mood, text) {
    const prevBadges = progress.unlockedBadges;
    const { entry, progressRow, journalXP } = await journalService.addEntry(mood, text);
    const updated = progressService.dbToProgress(progressRow);
    setProgress(updated);
    if (journalXP > 0) showXpNotification(journalXP);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
    return entry;
  }

  async function getJournalEntries() {
    return journalService.getEntries();
  }

  // Conclui um desafio do dia. XP e badge all_challenges são decididos no
  // servidor (idempotente por usuário/desafio/dia).
  async function completeChallengeToday(challengeId) {
    const prevBadges = progress.unlockedBadges;
    const { progress: updated, challengeXP } = await progressService.completeChallenge(challengeId);
    setProgress(updated);
    if (challengeXP > 0) showXpNotification(challengeXP);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
  }

  async function getCompletedChallenges() {
    return challengeService.getCompletedToday();
  }

  // --- Agenda / calendário (tarefas e cronogramas) ---

  async function getTasks() {
    return taskService.getTasks();
  }

  async function getTaskCompletions(fromISO, toISO) {
    return taskService.getCompletions(fromISO, toISO);
  }

  async function addTask(params) {
    return taskService.addTask(params);
  }

  async function deleteTask(taskId) {
    return taskService.deleteTask(taskId);
  }

  async function getTaskHistory(limit) {
    return taskService.getHistory(limit);
  }

  // Marca/desmarca a conclusão de uma ocorrência. O XP e os badges são decididos
  // no servidor; aqui só refletimos o progresso e disparamos os toasts.
  // Returns { done } para a UI atualizar o checkbox otimista.
  async function toggleTaskDone(taskId, isoDate) {
    const prevBadges = progress.unlockedBadges;
    const { progress: updated, taskXP, done } = await taskService.toggleCompletion(taskId, isoDate);
    setProgress(updated);
    if (taskXP > 0) showXpNotification(taskXP);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
    return { done };
  }

  const levelInfo = progressService.calculateLevel(progress.totalXP || 0);
  const nextLevel = LEVELS.find((l) => l.level === levelInfo.level + 1);

  const value = {
    currentUser,
    progress,
    loading,
    isRecovering,
    xpNotification,
    badgeNotification,
    levelInfo,
    nextLevel,
    register,
    login,
    logout,
    resetPassword,
    verifyRecoveryOtp,
    updatePassword,
    updateName,
    updateAvatar,
    changePassword,
    clearData,
    deleteAccount,
    addMoodEntry,
    onSageMessageSent,
    secureDailyStreak,
    addJournalEntry,
    getJournalEntries,
    completeChallengeToday,
    getCompletedChallenges,
    getTasks,
    getTaskCompletions,
    addTask,
    deleteTask,
    getTaskHistory,
    toggleTaskDone,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
