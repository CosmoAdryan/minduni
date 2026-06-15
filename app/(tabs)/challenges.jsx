import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  SafeAreaView, Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CheckCircle, X, Play, Pause, RotateCcw } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';
import { getDailyChallenges } from '../../src/data/challenges';
import { getWeeklyCompletion } from '../../src/services/challengeService';
import { T } from '../../src/theme';

const DAY_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function WeeklyHeatmap({ weekData }) {
  const today = new Date();
  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: T.s900, marginBottom: 10 }}>
        Atividade da semana
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {weekData.map((active, i) => {
          const date = new Date();
          date.setDate(today.getDate() - (6 - i));
          const dayLabel = DAY_ABBR[date.getDay()];
          const isToday = i === 6;
          return (
            <View key={i} style={{ alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: active ? T.g500 : T.s100,
                  borderWidth: isToday ? 2 : 0,
                  borderColor: T.g600,
                  alignItems: 'center', justifyContent: 'center',
                }}
                accessibilityLabel={`${dayLabel}: ${active ? 'prática completada' : 'sem práticas'}`}
              >
                {active && <Text style={{ fontSize: 14, color: '#fff' }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 9, color: isToday ? T.g500 : T.s400, fontWeight: isToday ? '700' : '400' }}>
                {dayLabel}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MindfulnessChallenge({ challenge, onComplete, onClose }) {
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(challenge.duration);
  const [currentStep, setCurrentStep] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            onComplete();
            return 0;
          }
          const stepDuration = challenge.duration / challenge.steps.length;
          const elapsed = challenge.duration - t + 1;
          setCurrentStep(Math.min(Math.floor(elapsed / stepDuration), challenge.steps.length - 1));
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const progress = (challenge.duration - timeLeft) / challenge.duration;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <View className="flex-1 p-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-xl font-bold text-gray-800">{challenge.title}</Text>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar desafio" accessibilityRole="button">
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <View className="items-center mb-8">
        <View className="w-40 h-40 rounded-full border-8 border-blue-200 items-center justify-center bg-blue-50">
          <View
            className="absolute inset-0 rounded-full border-8 border-blue-500"
            style={{ borderRightColor: 'transparent', transform: [{ rotate: `${progress * 360}deg` }] }}
          />
          <Text className="text-3xl font-bold text-blue-600">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
        </View>
      </View>
      <View className="bg-blue-50 rounded-2xl p-4 mb-6">
        <Text className="text-sm font-semibold text-blue-700 mb-1">
          Passo {currentStep + 1}/{challenge.steps.length}
        </Text>
        <Text className="text-blue-800">{challenge.steps[currentStep]}</Text>
      </View>
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 bg-blue-500 py-4 rounded-2xl flex-row items-center justify-center"
          onPress={() => setRunning(!running)}
          accessibilityLabel={running ? 'Pausar meditação' : 'Iniciar meditação'}
          accessibilityRole="button"
        >
          {running
            ? <Pause size={20} color="white" style={{ marginRight: 8 }} />
            : <Play size={20} color="white" style={{ marginRight: 8 }} />}
          <Text className="text-white font-bold">{running ? 'Pausar' : 'Iniciar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-14 bg-gray-100 rounded-2xl items-center justify-center"
          onPress={() => { setRunning(false); setTimeLeft(challenge.duration); setCurrentStep(0); }}
          accessibilityLabel="Reiniciar timer"
          accessibilityRole="button"
        >
          <RotateCcw size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GratitudeChallenge({ challenge, onComplete, onClose }) {
  const [answers, setAnswers] = useState(['', '', '']);
  const allFilled = answers.every((a) => a.trim().length > 0);

  return (
    <View className="flex-1 p-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-xl font-bold text-gray-800">{challenge.title}</Text>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar desafio" accessibilityRole="button">
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1">
        {challenge.prompts.map((prompt, i) => (
          <View key={i} className="mb-4">
            <Text className="text-sm font-medium text-yellow-700 mb-2">{prompt}</Text>
            <TextInput
              className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-gray-800 min-h-16"
              placeholder="Escreva aqui..."
              value={answers[i]}
              onChangeText={(t) => {
                const updated = [...answers];
                updated[i] = t;
                setAnswers(updated);
              }}
              multiline
              accessibilityLabel={`Gratidão ${i + 1}: ${prompt}`}
            />
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity
        className={`py-4 rounded-2xl items-center mt-4 ${allFilled ? 'bg-yellow-500' : 'bg-gray-200'}`}
        onPress={onComplete}
        disabled={!allFilled}
        accessibilityLabel={`Salvar gratidões e ganhar ${challenge.xp} XP`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !allFilled }}
      >
        <Text className={`font-bold ${allFilled ? 'text-white' : 'text-gray-400'}`}>
          Salvar gratidões (+{challenge.xp} XP)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function BreathingChallenge({ challenge, onComplete, onClose }) {
  const [active, setActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [cyclesDone, setCyclesDone] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    runPhase(0, 0);
    return () => clearTimeout(timerRef.current);
  }, [active]);

  function runPhase(pIdx, cycleCount) {
    if (cycleCount >= challenge.cycles) {
      setActive(false);
      setCyclesDone(cycleCount);
      onComplete();
      return;
    }
    const phase = challenge.phases[pIdx];
    setPhaseIdx(pIdx);
    setCountdown(phase.duration);
    const isInspire = phase.name === 'Inspire';
    Animated.timing(scaleAnim, {
      toValue: isInspire ? 1.5 : 0.8,
      duration: phase.duration * 1000,
      useNativeDriver: true,
    }).start();
    let remaining = phase.duration;
    const tick = () => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        const nextPhase = pIdx + 1;
        if (nextPhase >= challenge.phases.length) {
          runPhase(0, cycleCount + 1);
          setCyclesDone(cycleCount + 1);
        } else {
          runPhase(nextPhase, cycleCount);
        }
      } else {
        timerRef.current = setTimeout(tick, 1000);
      }
    };
    timerRef.current = setTimeout(tick, 1000);
  }

  const phase = challenge.phases[phaseIdx];

  return (
    <View className="flex-1 p-6 items-center">
      <View className="flex-row justify-between items-center w-full mb-6">
        <Text className="text-xl font-bold text-gray-800">{challenge.title}</Text>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar desafio" accessibilityRole="button">
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <View className="flex-1 items-center justify-center">
        <Animated.View
          className="w-36 h-36 rounded-full items-center justify-center"
          style={{ transform: [{ scale: scaleAnim }], backgroundColor: T.g500 }}
          accessibilityLabel={active ? `${phase.name}: ${countdown} segundos` : 'Círculo de respiração'}
        >
          <Text className="text-white text-3xl font-bold">
            {active && countdown !== null ? countdown : ''}
          </Text>
        </Animated.View>
        <Text className="text-2xl font-bold text-gray-800 mt-8">
          {active ? phase.name : 'Pronto?'}
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          {active ? phase.instruction : 'Toque em iniciar para começar'}
        </Text>
        <Text style={{ color: T.g500, fontWeight: '600', marginTop: 16 }}>
          Ciclos: {cyclesDone}/{challenge.cycles}
        </Text>
      </View>
      {!active && (
        <TouchableOpacity
          className="w-full py-4 rounded-2xl items-center"
          style={{ backgroundColor: T.g500 }}
          onPress={() => { setCyclesDone(0); setActive(true); scaleAnim.setValue(1); }}
          accessibilityLabel="Iniciar exercício de respiração"
          accessibilityRole="button"
        >
          <Text className="text-white font-bold">Iniciar respiração</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ChallengesPage() {
  const { completeChallengeToday, getCompletedChallenges } = useUser();
  const [completed, setCompleted] = useState([]);
  const [active, setActive] = useState(null);
  const [weekData, setWeekData] = useState([false, false, false, false, false, false, false]);
  const challenges = getDailyChallenges();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [done, week] = await Promise.all([
      getCompletedChallenges(),
      getWeeklyCompletion(),
    ]);
    setCompleted(done);
    setWeekData(week);
  }

  async function handleComplete(challenge) {
    await completeChallengeToday(challenge.id, challenge.xp);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActive(null);
    loadData();
  }

  const challengeList = [
    { ...challenges.mindfulness, type: 'mindfulness', color: T.g500, bg: T.g50 },
    { ...challenges.gratitude, type: 'gratitude', color: T.a400, bg: T.a50 },
    { ...challenges.breathing, type: 'breathing', color: T.g600, bg: T.g50 },
  ];

  const completedCount = challengeList.filter((c) => completed.includes(c.id)).length;

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Práticas de hoje</Text>
        <Text className="text-gray-500 mb-4">{completedCount}/3 completas</Text>

        {/* Progress bar */}
        <View className="h-3 bg-gray-200 rounded-full mb-6 overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{ width: `${(completedCount / 3) * 100}%`, backgroundColor: T.g500 }}
          />
        </View>

        {/* Weekly heatmap */}
        <WeeklyHeatmap weekData={weekData} />

        {/* Challenge cards */}
        {challengeList.map((ch) => {
          const isDone = completed.includes(ch.id);
          return (
            <TouchableOpacity
              key={ch.id}
              className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
              style={{ opacity: isDone ? 0.7 : 1 }}
              onPress={() => !isDone && setActive(ch)}
              disabled={isDone}
              accessibilityLabel={`${ch.title}${isDone ? ', concluído' : `, +${ch.xp} XP`}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: isDone }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: ch.bg }}
                >
                  <Text style={{ fontSize: 28 }}>{ch.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900">{ch.title}</Text>
                  <Text className="text-sm text-gray-500 mt-0.5">{ch.description}</Text>
                  <Text className="text-xs font-semibold mt-1" style={{ color: ch.color }}>
                    +{ch.xp} XP
                  </Text>
                </View>
                {isDone && <CheckCircle size={24} color={T.g500} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={!!active} animationType="slide" presentationStyle="pageSheet">
        {active && (
          <SafeAreaView className="flex-1 bg-white">
            {active.type === 'mindfulness' && (
              <MindfulnessChallenge challenge={active} onComplete={() => handleComplete(active)} onClose={() => setActive(null)} />
            )}
            {active.type === 'gratitude' && (
              <GratitudeChallenge challenge={active} onComplete={() => handleComplete(active)} onClose={() => setActive(null)} />
            )}
            {active.type === 'breathing' && (
              <BreathingChallenge challenge={active} onComplete={() => handleComplete(active)} onClose={() => setActive(null)} />
            )}
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
