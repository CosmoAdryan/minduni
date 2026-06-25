import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as authService from '../services/authService';
import * as accountService from '../services/accountService';
import * as progressService from '../services/progressService';
import * as journalService from '../services/journalService';
import * as challengeService from '../services/challengeService';
import { getDailyChallenges } from '../data/challenges';
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
    // Restore session on app launch and listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Durante a recuperação de senha a sessão (temporária) é criada pelo
        // handler de deep link. Não entramos na área autenticada: deixamos o
        // usuário na tela de redefinição.
        if (recoveringRef.current) {
          setLoading(false);
          return;
        }
        if (session?.user) {
          try {
            const [user, prog] = await Promise.all([
              authService.getCurrentUser(),
              progressService.getProgress(),
            ]);
            if (user) setCurrentUser(user);
            setProgress(prog || { ...progressService.INITIAL_PROGRESS });
          } catch (e) {
            console.error('Session restore error', e);
          }
        } else {
          setCurrentUser(null);
          setProgress(progressService.INITIAL_PROGRESS);
        }
        setLoading(false);
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
    const newProgress = { ...progressService.INITIAL_PROGRESS, lastLogin: new Date().toDateString() };
    await progressService.saveProgress(newProgress);
    setCurrentUser(user);
    setProgress(newProgress);
    return user;
  }

  async function login(email, password) {
    const user = await authService.login(email, password);
    const saved = await progressService.getProgress();
    const { progress: updated, loginXP } = await progressService.applyLogin(saved);
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

  // Limpa dados de uso, mantendo a conta. Reseta o progresso em memória.
  async function clearData() {
    await accountService.clearUserData();
    setProgress({ ...progressService.INITIAL_PROGRESS, lastLogin: new Date().toDateString() });
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

  async function addXP(amount) {
    const prevBadges = progress.unlockedBadges;
    const updated = await progressService.addXP(progress, amount);
    setProgress(updated);
    showXpNotification(amount);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
  }

  async function addMoodEntry(mood, phase) {
    const prevBadges = progress.unlockedBadges;
    const updated = await progressService.addMoodEntry(progress, mood, phase);
    setProgress(updated);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
  }

  async function addChatSession() {
    const prevBadges = progress.unlockedBadges;
    const updated = await progressService.addChatSession(progress);
    setProgress(updated);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
  }

  // Chamado ao enviar uma mensagem ao Sage. Aplica o streak de mensagem do dia
  // (5 -> 50, 1x/dia) e marca a primeira conversa (badge first_chat) — tudo numa
  // ÚNICA cadeia de atualização para evitar corrida entre duas mutações sobre o
  // mesmo `progress` (que perderia o chatStreak ou o first_chat).
  async function onSageMessageSent() {
    const prevBadges = progress.unlockedBadges;
    let { progress: updated, chatXP } = await progressService.applyChatStreak(progress);
    if (!updated.chatSessions) {
      updated = await progressService.addChatSession(updated);
    }
    setProgress(updated);
    if (chatXP > 0) showXpNotification(chatXP);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
  }

  async function addJournalEntry(mood, text) {
    const prevBadges = progress.unlockedBadges;
    const entry = await journalService.addEntry(mood, text);
    const updated = await progressService.incrementJournalEntries(progress);
    setProgress(updated);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
    return entry;
  }

  async function getJournalEntries() {
    return journalService.getEntries();
  }

  async function completeChallengeToday(challengeId, xp) {
    const prevBadges = progress.unlockedBadges;
    await challengeService.markChallengeComplete(challengeId);
    let updated = await progressService.addXP(progress, xp);
    showXpNotification(xp);

    // Badge "all_challenges": destrava quando os 3 desafios do dia estão
    // concluídos. A condição depende dos challenge_logs (não de `progress`),
    // por isso é verificada aqui e não em checkBadges.
    const daily = getDailyChallenges();
    const requiredIds = [daily.mindfulness.id, daily.gratitude.id, daily.breathing.id];
    const done = await challengeService.getCompletedToday();
    if (requiredIds.every((id) => done.includes(id))) {
      updated = await progressService.unlockBadge(updated, 'all_challenges');
    }
    setProgress(updated);
    notifyNewBadges(prevBadges, updated.unlockedBadges);
  }

  async function getCompletedChallenges() {
    return challengeService.getCompletedToday();
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
    addXP,
    addMoodEntry,
    addChatSession,
    onSageMessageSent,
    addJournalEntry,
    getJournalEntries,
    completeChallengeToday,
    getCompletedChallenges,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
