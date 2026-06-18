import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { CheckCircle, X, Play, Pause, RotateCcw } from 'lucide-react-native';

// Dimensões do anel de progresso (timer de meditação).
const RING_SIZE = 176;
const RING_STROKE = 12;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;
import { useUser } from '../../src/context/UserContext';
import { getDailyChallenges } from '../../src/data/challenges';
import { getWeeklyCompletion } from '../../src/services/challengeService';

const DAY_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function WeeklyHeatmap({ weekData }) {
  const today = new Date();
  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1C1917', marginBottom: 10 }}>
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
                  backgroundColor: active ? '#3D7A67' : '#F4F2EE',
                  borderWidth: isToday ? 2 : 0,
                  borderColor: '#2D6254',
                  alignItems: 'center', justifyContent: 'center',
                }}
                accessibilityLabel={`${dayLabel}: ${active ? 'desafio completado' : 'sem desafios'}`}
              >
                {active && <Text style={{ fontSize: 14 }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 9, color: isToday ? '#3D7A67' : '#A29D95', fontWeight: isToday ? '700' : '400' }}>
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
        <Text className="text-xl font-bold text-stone-900">{challenge.title}</Text>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar desafio" accessibilityRole="button">
          <X size={24} color="#756F66" />
        </TouchableOpacity>
      </View>
      <View className="items-center mb-8">
        <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
          {/* Anel SVG: a faixa azul escura representa o tempo restante e
              diminui (esvazia) conforme o cronômetro avança. */}
          <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="#DBEAFE"
              strokeWidth={RING_STROKE}
              fill="#EFF6FF"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="#2563EB"
              strokeWidth={RING_STROKE}
              fill="none"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={RING_CIRC * progress}
              strokeLinecap="round"
            />
          </Svg>
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
          className="w-14 bg-stone-200 rounded-2xl items-center justify-center"
          onPress={() => { setRunning(false); setTimeLeft(challenge.duration); setCurrentStep(0); }}
          accessibilityLabel="Reiniciar timer"
          accessibilityRole="button"
        >
          <RotateCcw size={20} color="#756F66" />
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
        <Text className="text-xl font-bold text-stone-900">{challenge.title}</Text>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar desafio" accessibilityRole="button">
          <X size={24} color="#756F66" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1">
        {challenge.prompts.map((prompt, i) => (
          <View key={i} className="mb-4">
            <Text className="text-sm font-medium text-yellow-700 mb-2">{prompt}</Text>
            <TextInput
              className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-stone-900 min-h-16"
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
        className={`py-4 rounded-2xl items-center mt-4 ${allFilled ? 'bg-yellow-500' : 'bg-stone-200'}`}
        onPress={onComplete}
        disabled={!allFilled}
        accessibilityLabel={`Salvar gratidões e ganhar ${challenge.xp} XP`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !allFilled }}
      >
        <Text className={`font-bold ${allFilled ? 'text-white' : 'text-stone-400'}`}>
          Salvar gratidões (+{challenge.xp} XP)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Cores do círculo por fase (tokens sage): inspire = presença, hold = mais
// denso, expire = liberação.
const PHASE_COLOR = {
  Inspire: '#3D7A67', // sage-500
  Segure: '#2D6254',  // sage-600
  Espere: '#2D6254',  // sage-600 (box breathing)
  Expire: '#5E9B84',  // sage-400
};

function BreathingChallenge({ challenge, onComplete, onClose }) {
  const [active, setActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [cyclesDone, setCyclesDone] = useState(0);
  const timerRef = useRef(null);

  // Escala do círculo (1.0 ↔ 1.6) e pulso do anel durante o "segure".
  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);
  const holdSV = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    runPhase(0, 0);
    return () => clearTimeout(timerRef.current);
  }, [active]);

  // Pulso contínuo do anel — só fica visível durante a fase "segure" (holdSV).
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }), -1);
  }, []);

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

    const ms = phase.duration * 1000;
    const ease = Easing.inOut(Easing.ease);
    if (phase.name === 'Inspire') {
      scale.value = withTiming(1.6, { duration: ms, easing: ease });
      holdSV.value = withTiming(0, { duration: 300 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); // início do ciclo
    } else if (phase.name === 'Expire') {
      scale.value = withTiming(1.0, { duration: ms, easing: ease });
      holdSV.value = withTiming(0, { duration: 300 });
    } else {
      // Segure / Espere — mantém a escala, ativa o pulso do anel.
      holdSV.value = withTiming(1, { duration: 300 });
    }

    let remaining = phase.duration;
    const tick = () => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (phase.name === 'Expire') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); // fim do ciclo
        }
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
  const circleColor = active ? (PHASE_COLOR[phase.name] || '#3D7A67') : '#A9D3BF';

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: holdSV.value * 0.4 * (1 - pulse.value),
    transform: [{ scale: 1 + 0.5 * pulse.value }],
  }));

  return (
    <View className="flex-1 p-6 items-center">
      <View className="flex-row justify-between items-center w-full mb-6">
        <Text className="text-xl font-bold text-stone-900">{challenge.title}</Text>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar desafio" accessibilityRole="button">
          <X size={24} color="#756F66" />
        </TouchableOpacity>
      </View>
      <View className="flex-1 items-center justify-center">
        <View className="w-44 h-44 items-center justify-center">
          {/* Anel que pulsa durante o "segure" */}
          <Animated.View
            pointerEvents="none"
            style={[
              { position: 'absolute', width: 144, height: 144, borderRadius: 999, borderWidth: 2, borderColor: '#3D7A67' },
              ringStyle,
            ]}
          />
          <Animated.View
            className="w-36 h-36 rounded-full items-center justify-center"
            style={[{ backgroundColor: circleColor }, circleStyle]}
            accessibilityLabel={active ? `${phase.name}: ${countdown} segundos` : 'Círculo de respiração'}
          >
            <Text className="text-white text-3xl font-bold" style={{ fontVariant: ['tabular-nums'] }}>
              {active && countdown !== null ? countdown : ''}
            </Text>
          </Animated.View>
        </View>
        <Text className="text-2xl font-bold text-stone-900 mt-8">
          {active ? phase.name : 'Pronto?'}
        </Text>
        <Text className="text-stone-500 mt-2 text-center">
          {active ? phase.instruction : 'Toque em iniciar para começar'}
        </Text>
        <Text className="text-sage-500 font-semibold mt-4">
          Ciclos: {cyclesDone}/{challenge.cycles}
        </Text>
      </View>
      {!active && (
        <TouchableOpacity
          className="w-full bg-sage-500 py-4 rounded-2xl items-center"
          onPress={() => { setCyclesDone(0); scale.value = withTiming(1, { duration: 200 }); setActive(true); }}
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
    { ...challenges.mindfulness, type: 'mindfulness', color: '#3B82F6', bg: '#EFF6FF' },
    { ...challenges.gratitude, type: 'gratitude', color: '#D4973E', bg: '#FFFBEB' },
    { ...challenges.breathing, type: 'breathing', color: '#6366F1', bg: '#EEF2FF' },
  ];

  const completedCount = challengeList.filter((c) => completed.includes(c.id)).length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-2xl font-bold text-stone-900 mb-1">Desafios de hoje</Text>
        <Text className="text-stone-500 mb-4">{completedCount}/3 completos</Text>

        {/* Progress bar */}
        <View className="h-3 bg-stone-200 rounded-full mb-6 overflow-hidden">
          <View
            className="h-full bg-sage-500 rounded-full"
            style={{ width: `${(completedCount / 3) * 100}%` }}
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
                  <Text className="font-bold text-stone-900">{ch.title}</Text>
                  <Text className="text-sm text-stone-500 mt-0.5">{ch.description}</Text>
                  <Text className="text-xs font-semibold mt-1" style={{ color: ch.color }}>
                    +{ch.xp} XP
                  </Text>
                </View>
                {isDone && <CheckCircle size={24} color="#10B981" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={!!active} animationType="slide" presentationStyle="pageSheet">
        {active && (
          <SafeAreaView edges={['top']} className="flex-1 bg-white">
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
