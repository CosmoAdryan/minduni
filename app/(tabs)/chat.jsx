import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Send, RefreshCcw, AlertCircle } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';
import { ChatMessage, TypingIndicator } from '../../src/components/ChatMessage';
import { detectCrisis } from '../../src/data/chatResponses';
import CrisisModal from '../../src/components/CrisisModal';
import CVVButton from '../../src/components/CVVButton';
import MoodOption from '../../src/components/MoodOption';
import { MOOD_COLORS } from '../../src/theme/tokens';
import * as chatService from '../../src/services/chatService';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: 'Muito mal' },
  { value: 2, emoji: '😔', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Neutro' },
  { value: 4, emoji: '😊', label: 'Bem' },
  { value: 5, emoji: '😄', label: 'Ótimo' },
];

const PHASES = ['pre_mood', 'chatting', 'post_mood', 'done'];
const PHASE_LABELS = ['Humor', 'Conversa', 'Revisão'];

const SAGE_INTRO = 'Olá! Sou o Sage, seu companheiro de bem-estar mental. Estou aqui para te ouvir com atenção e sem julgamentos. Como você está se sentindo hoje?';

function StepIndicator({ phase }) {
  const steps = PHASE_LABELS;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F4F2EE' }}>
      {steps.map((label, i) => {
        const stepActive = phase === 'pre_mood' ? i === 0 : phase === 'chatting' ? i === 1 : i === 2;
        const stepDone = phase === 'chatting' ? i === 0 : phase === 'post_mood' ? i <= 1 : phase === 'done' ? i <= 2 : false;
        return (
          <React.Fragment key={label}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: stepDone ? '#3D7A67' : stepActive ? '#D4E9DE' : '#F4F2EE',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: stepActive ? 2 : 0,
                borderColor: '#3D7A67',
              }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: stepDone ? 'white' : stepActive ? '#3D7A67' : '#A29D95' }}>
                  {stepDone ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: '600', color: stepActive || stepDone ? '#3D7A67' : '#A29D95', marginTop: 2 }}>
                {label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={{ flex: 1, height: 2, backgroundColor: stepDone ? '#3D7A67' : '#E6E2DB', marginHorizontal: 4, marginBottom: 16 }} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// Barra de topo presente em todas as fases do chat — garante que o CVV 188
// nunca desapareça (princípio ético não-negociável).
function ChatTopBar() {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: '#FAFAF8',
    }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1C1917' }}>Conversa com o Sage</Text>
      <CVVButton />
    </View>
  );
}

export default function ChatPage() {
  const { addXP, addMoodEntry, addChatSession } = useUser();
  const [phase, setPhase] = useState('pre_mood');
  const [preMood, setPreMood] = useState(null);
  const [postMood, setPostMood] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [crisisVisible, setCrisisVisible] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);

  async function startChat() {
    addMoodEntry(preMood, 'pre');
    let sid = null;
    try {
      const session = await chatService.createSession(preMood);
      sid = session.id;
      setSessionId(sid);
    } catch (e) {
      console.error('Failed to create session:', e.message);
    }
    setPhase('chatting');
    setMessages([]);
    setTyping(true);
    try {
      const data = await chatService.getIntroMessage(sid, preMood);
      setMessages([
        { id: '1', role: 'sage', content: data.response, timestamp: new Date().toISOString() },
      ]);
    } catch (e) {
      // Fallback para mensagem estática se o Gemini falhar na abertura
      setMessages([
        { id: '1', role: 'sage', content: SAGE_INTRO, timestamp: new Date().toISOString() },
      ]);
    } finally {
      setTyping(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || typing) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setInput('');

    if (detectCrisis(input)) {
      setCrisisVisible(true);
    }

    setTyping(true);
    try {
      // Pass messages (history before current msg) — edge function adds current msg itself
      const data = await chatService.sendMessage(sessionId, userMsg.content, messages);
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'sage',
          content: data.response,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setTyping(false);
      console.error('[Sage error]', err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'sage',
          content: 'Desculpe, tive um problema para responder. Tente novamente em instantes.',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }

  async function endSession() {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'sage',
          content: 'Foi muito bom conversar com você hoje. Lembre-se de cuidar de si mesmo. Até a próxima! 💜',
          timestamp: new Date().toISOString(),
        },
      ]);
      setPhase('post_mood');
    }, 600);
  }

  async function finishSession() {
    if (sessionId) {
      await chatService.updateSessionPostMood(sessionId, postMood);
    }
    addMoodEntry(postMood, 'post');
    await addChatSession();
    await addXP(50);
    setPhase('done');
  }

  function resetChat() {
    setPhase('pre_mood');
    setPreMood(null);
    setPostMood(null);
    setMessages([]);
    setSessionId(null);
  }

  if (phase === 'pre_mood') {
    return (
      <SafeAreaView className="flex-1 bg-stone-50">
        <ChatTopBar />
        <StepIndicator phase="pre_mood" />
        <View className="flex-1 justify-center px-6">
          <View className="bg-white rounded-3xl p-6 shadow-md">
            <Text className="text-2xl font-bold text-stone-900 text-center mb-2">
              Como você está?
            </Text>
            <Text className="text-stone-500 text-center mb-6">
              Antes de conversar com o Sage, como está seu humor agora?
            </Text>
            <View className="flex-row justify-around mb-6">
              {MOOD_OPTIONS.map((m) => (
                <MoodOption
                  key={m.value}
                  emoji={m.emoji}
                  label={m.label}
                  color={MOOD_COLORS[m.value - 1]}
                  selected={preMood === m.value}
                  onPress={() => setPreMood(m.value)}
                  accessibilityLabel={`Humor: ${m.label}`}
                />
              ))}
            </View>
            <TouchableOpacity
              className={`py-4 rounded-2xl items-center ${preMood ? 'bg-sage-500' : 'bg-stone-200'}`}
              onPress={startChat}
              disabled={!preMood}
              accessibilityLabel="Começar conversa com o Sage"
              accessibilityRole="button"
              accessibilityState={{ disabled: !preMood }}
            >
              <Text className={`font-bold text-base ${preMood ? 'text-white' : 'text-stone-400'}`}>
                Começar conversa
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-start mt-4 px-2">
            <AlertCircle size={14} color="#A29D95" style={{ marginTop: 2, marginRight: 6 }} />
            <Text className="text-xs text-stone-400 flex-1">
              O Sage é um apoio complementar e não substitui atendimento psicológico profissional. Em emergências, ligue para o CVV: 188.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'post_mood') {
    return (
      <SafeAreaView className="flex-1 bg-stone-50">
        <ChatTopBar />
        <StepIndicator phase="post_mood" />
        <View className="flex-1 justify-center px-6">
          <View className="bg-white rounded-3xl p-6 shadow-md">
            <Text className="text-2xl font-bold text-stone-900 text-center mb-2">
              E agora?
            </Text>
            <Text className="text-stone-500 text-center mb-6">
              Como você está se sentindo após a conversa?
            </Text>
            <View className="flex-row justify-around mb-6">
              {MOOD_OPTIONS.map((m) => (
                <MoodOption
                  key={m.value}
                  emoji={m.emoji}
                  label={m.label}
                  color={MOOD_COLORS[m.value - 1]}
                  selected={postMood === m.value}
                  onPress={() => setPostMood(m.value)}
                  accessibilityLabel={`Humor: ${m.label}`}
                />
              ))}
            </View>
            <TouchableOpacity
              className={`py-4 rounded-2xl items-center ${postMood ? 'bg-sage-500' : 'bg-stone-200'}`}
              onPress={finishSession}
              disabled={!postMood}
              accessibilityLabel="Finalizar sessão e ganhar 50 XP"
              accessibilityRole="button"
              accessibilityState={{ disabled: !postMood }}
            >
              <Text className={`font-bold text-base ${postMood ? 'text-white' : 'text-stone-400'}`}>
                Finalizar (+50 XP)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'done') {
    const diff = postMood - preMood;
    const doneEmoji = diff > 0 ? '🎉' : diff < 0 ? '🌱' : '💙';
    const doneTitle = diff > 0 ? 'Você melhorou!' : diff < 0 ? 'Obrigado por compartilhar.' : 'Você está aqui.';
    return (
      <SafeAreaView className="flex-1 bg-stone-50">
        <ChatTopBar />
        <View className="flex-1 justify-center px-6">
          <View className="bg-white rounded-3xl p-6 shadow-md items-center">
            <Text style={{ fontSize: 60 }}>{doneEmoji}</Text>
            <Text className="text-2xl font-bold text-stone-900 mt-4 mb-2">{doneTitle}</Text>
            <Text className="text-stone-500 text-center mb-4">
              Você completou uma sessão com o Sage e ganhou +50 XP!
            </Text>
            {diff > 0 ? (
              <Text className="text-green-600 font-semibold mb-6">
                📈 Seu humor melhorou em {diff} ponto{diff > 1 ? 's' : ''}!
              </Text>
            ) : diff < 0 ? (
              <Text className="text-blue-500 font-semibold mb-6">
                Às vezes é difícil. Falar sobre isso já é um passo importante.
              </Text>
            ) : (
              <Text className="text-stone-600 font-semibold mb-6">
                Manter-se estável também é uma conquista. Continue cuidando de você.
              </Text>
            )}
            <TouchableOpacity
              className="bg-sage-500 py-4 px-8 rounded-2xl flex-row items-center"
              onPress={resetChat}
              accessibilityLabel="Iniciar nova conversa"
              accessibilityRole="button"
            >
              <RefreshCcw size={18} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold">Nova conversa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Chatting phase
  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <StepIndicator phase="chatting" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-stone-200 shadow-sm">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-sage-100 items-center justify-center mr-3">
              <Text style={{ fontSize: 20 }}>🌿</Text>
            </View>
            <View>
              <Text className="font-bold text-stone-900">Sage</Text>
              <Text className="text-xs text-green-500">● Online</Text>
            </View>
          </View>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <CVVButton compact />
            <TouchableOpacity
              className="bg-sage-100 px-3 py-2 rounded-xl"
              onPress={endSession}
              accessibilityLabel="Encerrar conversa com o Sage"
              accessibilityRole="button"
            >
              <Text className="text-sage-500 text-sm font-semibold">Encerrar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ backgroundColor: '#FEF8EC', paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}>
          <AlertCircle size={12} color="#B87A28" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 11, color: '#B87A28', flex: 1 }}>
            Sage é um apoio complementar, não substitui psicólogos. Crise? CVV: 188
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4 py-4"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {typing && <TypingIndicator />}
        </ScrollView>

        <View className="bg-white px-4 py-3 flex-row items-end border-t border-stone-200">
          <TextInput
            className="flex-1 bg-stone-100 border border-stone-200 rounded-2xl px-4 py-3 mr-3 text-stone-900 max-h-28"
            placeholder="Digite sua mensagem..."
            value={input}
            onChangeText={setInput}
            multiline
            accessibilityLabel="Campo de mensagem para o Sage"
          />
          <TouchableOpacity
            className={`w-11 h-11 rounded-full items-center justify-center ${input.trim() ? 'bg-sage-500' : 'bg-stone-200'}`}
            onPress={sendMessage}
            disabled={!input.trim() || typing}
            accessibilityLabel="Enviar mensagem"
            accessibilityRole="button"
            accessibilityState={{ disabled: !input.trim() }}
          >
            <Send size={18} color={input.trim() ? 'white' : '#A29D95'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CrisisModal visible={crisisVisible} onClose={() => setCrisisVisible(false)} />
    </SafeAreaView>
  );
}
