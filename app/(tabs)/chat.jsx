import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Send, RefreshCcw, AlertCircle } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';
import { ChatMessage, TypingIndicator, SageAvatar } from '../../src/components/ChatMessage';
import { detectCrisis } from '../../src/data/chatResponses';
import CrisisModal from '../../src/components/CrisisModal';
import CVVButton from '../../src/components/CVVButton';
import * as chatService from '../../src/services/chatService';
import { T, MOOD_COLORS } from '../../src/theme';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: 'Muito mal' },
  { value: 2, emoji: '😔', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Neutro' },
  { value: 4, emoji: '😊', label: 'Bem' },
  { value: 5, emoji: '😄', label: 'Ótimo' },
];

// Mensagem âncora (Momento 1 da CrisisModal) — HARDCODED, nunca gerada por IA.
const SAGE_ANCHOR = 'Obrigado por confiar isso a mim. O que você disse importa muito.';

const PHASES = ['pre_mood', 'chatting', 'post_mood', 'done'];
const PHASE_LABELS = ['Humor', 'Conversa', 'Revisão'];

const SAGE_INTRO = 'Olá! Sou o Sage, seu companheiro de bem-estar mental. Estou aqui para te ouvir com atenção e sem julgamentos. Como você está se sentindo hoje?';

function StepIndicator({ phase }) {
  const steps = PHASE_LABELS;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: T.s100 }}>
      {steps.map((label, i) => {
        const stepActive = phase === 'pre_mood' ? i === 0 : phase === 'chatting' ? i === 1 : i === 2;
        const stepDone = phase === 'chatting' ? i === 0 : phase === 'post_mood' ? i <= 1 : phase === 'done' ? i <= 2 : false;
        return (
          <React.Fragment key={label}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: stepDone ? T.g500 : stepActive ? T.g50 : T.s100,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: stepActive ? 2 : 0,
                borderColor: T.g500,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: stepDone ? 'white' : stepActive ? T.g500 : T.s400 }}>
                  {stepDone ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: '600', color: stepActive || stepDone ? T.g500 : T.s400, marginTop: 2 }}>
                {label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={{ flex: 1, height: 2, backgroundColor: stepDone ? T.g500 : T.s200, marginHorizontal: 4, marginBottom: 16 }} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// Header mínimo com o botão CVV sempre presente nas telas de humor/conclusão.
function CrisisHeader({ onOpen }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 }}>
      <CVVButton onPress={onOpen} />
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

    // Crise: o Sage envia UMA mensagem âncora (texto fixo, não-IA) e só então,
    // após ~1.2s, a CrisisModal sobe — sem interromper abruptamente.
    if (detectCrisis(userMsg.content)) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'sage', content: SAGE_ANCHOR, timestamp: new Date().toISOString() },
        ]);
        setTimeout(() => setCrisisVisible(true), 1200);
      }, 700);
      return;
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
        <CrisisHeader onOpen={() => setCrisisVisible(true)} />
        <StepIndicator phase="pre_mood" />
        <View className="flex-1 justify-center px-6">
          <View className="bg-white rounded-3xl p-6 shadow-md">
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              Como você está?
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Antes de conversar com o Sage, como está seu humor agora?
            </Text>
            <View className="flex-row justify-around mb-6">
              {MOOD_OPTIONS.map((m) => {
                const on = preMood === m.value;
                const c = MOOD_COLORS[m.value - 1];
                return (
                  <TouchableOpacity
                    key={m.value}
                    style={{ alignItems: 'center', padding: 10, borderRadius: 16, borderWidth: 2, borderColor: on ? c : 'transparent', backgroundColor: on ? c + '18' : T.s50 }}
                    onPress={() => setPreMood(m.value)}
                    accessibilityLabel={`Humor: ${m.label}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={{ fontSize: 32 }}>{m.emoji}</Text>
                    <Text style={{ fontSize: 11, color: on ? c : T.s600, marginTop: 4, fontWeight: on ? '700' : '400' }}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              className={`py-4 rounded-2xl items-center ${preMood ? 'bg-sage-500' : 'bg-gray-200'}`}
              onPress={startChat}
              disabled={!preMood}
              accessibilityLabel="Começar conversa com o Sage"
              accessibilityRole="button"
              accessibilityState={{ disabled: !preMood }}
            >
              <Text className={`font-bold text-base ${preMood ? 'text-white' : 'text-gray-400'}`}>
                Começar conversa
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-start mt-4 px-2">
            <AlertCircle size={14} color={T.s400} style={{ marginTop: 2, marginRight: 6 }} />
            <Text className="text-xs text-gray-400 flex-1">
              O Sage é um apoio complementar e não substitui atendimento psicológico profissional. Em emergências, ligue para o CVV: 188.
            </Text>
          </View>
        </View>
        <CrisisModal visible={crisisVisible} onClose={() => setCrisisVisible(false)} />
      </SafeAreaView>
    );
  }

  if (phase === 'post_mood') {
    return (
      <SafeAreaView className="flex-1 bg-stone-50">
        <CrisisHeader onOpen={() => setCrisisVisible(true)} />
        <StepIndicator phase="post_mood" />
        <View className="flex-1 justify-center px-6">
          <View className="bg-white rounded-3xl p-6 shadow-md">
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              E agora?
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Como você está se sentindo após a conversa?
            </Text>
            <View className="flex-row justify-around mb-6">
              {MOOD_OPTIONS.map((m) => {
                const on = postMood === m.value;
                const c = MOOD_COLORS[m.value - 1];
                return (
                  <TouchableOpacity
                    key={m.value}
                    style={{ alignItems: 'center', padding: 10, borderRadius: 16, borderWidth: 2, borderColor: on ? c : 'transparent', backgroundColor: on ? c + '18' : T.s50 }}
                    onPress={() => setPostMood(m.value)}
                    accessibilityLabel={`Humor: ${m.label}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={{ fontSize: 32 }}>{m.emoji}</Text>
                    <Text style={{ fontSize: 11, color: on ? c : T.s600, marginTop: 4, fontWeight: on ? '700' : '400' }}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              className={`py-4 rounded-2xl items-center ${postMood ? 'bg-sage-500' : 'bg-gray-200'}`}
              onPress={finishSession}
              disabled={!postMood}
              accessibilityLabel="Finalizar sessão e ganhar 50 XP"
              accessibilityRole="button"
              accessibilityState={{ disabled: !postMood }}
            >
              <Text className={`font-bold text-base ${postMood ? 'text-white' : 'text-gray-400'}`}>
                Finalizar (+50 XP)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <CrisisModal visible={crisisVisible} onClose={() => setCrisisVisible(false)} />
      </SafeAreaView>
    );
  }

  if (phase === 'done') {
    const diff = postMood - preMood;
    const doneEmoji = diff > 0 ? '🎉' : diff < 0 ? '🌱' : '💙';
    const doneTitle = diff > 0 ? 'Você melhorou!' : diff < 0 ? 'Obrigado por compartilhar.' : 'Você está aqui.';
    return (
      <SafeAreaView className="flex-1 bg-stone-50">
        <CrisisHeader onOpen={() => setCrisisVisible(true)} />
        <View className="flex-1 justify-center px-6">
          <View className="bg-white rounded-3xl p-6 shadow-md items-center">
            <Text style={{ fontSize: 60 }}>{doneEmoji}</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-4 mb-2">{doneTitle}</Text>
            <Text className="text-gray-500 text-center mb-4">
              Você completou uma sessão com o Sage e ganhou +50 XP!
            </Text>
            {diff > 0 ? (
              <Text style={{ color: T.g600, fontWeight: '600', marginBottom: 24 }}>
                Seu humor melhorou em {diff} ponto{diff > 1 ? 's' : ''}.
              </Text>
            ) : diff < 0 ? (
              <Text style={{ color: MOOD_COLORS[1], fontWeight: '600', marginBottom: 24 }}>
                Às vezes é difícil. Falar sobre isso já é um passo importante.
              </Text>
            ) : (
              <Text style={{ color: T.s600, fontWeight: '600', marginBottom: 24 }}>
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
        <CrisisModal visible={crisisVisible} onClose={() => setCrisisVisible(false)} />
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
        <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100 shadow-sm">
          <View className="flex-row items-center">
            <View style={{ marginRight: 10 }}>
              <SageAvatar size={36} />
            </View>
            <View>
              <Text className="font-bold text-gray-900">Sage</Text>
              <Text style={{ fontSize: 11, color: T.g400, fontWeight: '600' }}>● Ouvindo</Text>
            </View>
          </View>
          {/* CVV 188 — sempre visível no header (acesso manual à CrisisModal) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CVVButton onPress={() => setCrisisVisible(true)} />
            <TouchableOpacity
              style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: T.s200 }}
              onPress={endSession}
              accessibilityLabel="Encerrar conversa com o Sage"
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 11, color: T.s500, fontWeight: '600' }}>Encerrar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ backgroundColor: T.a50, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: T.a100 }}>
          <AlertCircle size={12} color={T.a500} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 11, color: T.a500, flex: 1 }}>
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

        <View className="bg-white px-4 py-3 flex-row items-end border-t border-gray-100">
          <TextInput
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mr-3 text-gray-800 max-h-28"
            placeholder="Digite sua mensagem..."
            value={input}
            onChangeText={setInput}
            multiline
            accessibilityLabel="Campo de mensagem para o Sage"
          />
          <TouchableOpacity
            className={`w-11 h-11 rounded-full items-center justify-center ${input.trim() ? 'bg-sage-500' : 'bg-gray-200'}`}
            onPress={sendMessage}
            disabled={!input.trim() || typing}
            accessibilityLabel="Enviar mensagem"
            accessibilityRole="button"
            accessibilityState={{ disabled: !input.trim() }}
          >
            <Send size={18} color={input.trim() ? 'white' : T.s400} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CrisisModal visible={crisisVisible} onClose={() => setCrisisVisible(false)} />
    </SafeAreaView>
  );
}
