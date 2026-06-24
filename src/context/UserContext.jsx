import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as authService from '../services/authService';
import * as progressService from '../services/progressService';
import * as journalService from '../services/journalService';
import * as challengeService from '../services/challengeService';

// Re-export LEVELS so existing imports (e.g. XPBar) keep working
export const LEVELS = progressService.LEVELS;

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [progress, setProgress] = useState(progressService.INITIAL_PROGRESS);
  const [xpNotification, setXpNotification] = useState(null);
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

  async function addXP(amount) {
    const updated = await progressService.addXP(progress, amount);
    setProgress(updated);
    showXpNotification(amount);
  }

  async function addMoodEntry(mood, phase) {
    const updated = await progressService.addMoodEntry(progress, mood, phase);
    setProgress(updated);
  }

  async function addChatSession() {
    const updated = await progressService.addChatSession(progress);
    setProgress(updated);
  }

  // Recompensa a 1ª mensagem do dia no chat (streak 5 -> 50). Silencioso se já
  // recompensou hoje.
  async function awardChatStreakXP() {
    const { progress: updated, chatXP } = await progressService.applyChatStreak(progress);
    setProgress(updated);
    if (chatXP > 0) showXpNotification(chatXP);
  }

  async function addJournalEntry(mood, text) {
    const entry = await journalService.addEntry(mood, text);
    const updated = await progressService.incrementJournalEntries(progress);
    setProgress(updated);
    return entry;
  }

  async function getJournalEntries() {
    return journalService.getEntries();
  }

  async function completeChallengeToday(challengeId, xp) {
    await challengeService.markChallengeComplete(challengeId);
    await addXP(xp);
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
    levelInfo,
    nextLevel,
    register,
    login,
    logout,
    resetPassword,
    verifyRecoveryOtp,
    updatePassword,
    addXP,
    addMoodEntry,
    addChatSession,
    awardChatStreakXP,
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
