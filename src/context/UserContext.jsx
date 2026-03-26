import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    // Restore session on app launch and listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
    setXpNotification(amount);
    setTimeout(() => setXpNotification(null), 2500);
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
    setCurrentUser(null);
    setProgress(progressService.INITIAL_PROGRESS);
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
    xpNotification,
    levelInfo,
    nextLevel,
    register,
    login,
    logout,
    addXP,
    addMoodEntry,
    addChatSession,
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
