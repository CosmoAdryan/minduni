import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, AlertCircle, X } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';
import { ChatMessage, TypingIndicator } from '../../src/components/ChatMessage';
import { detectCrisis } from '../../src/data/chatResponses';
import CrisisModal from '../../src/components/CrisisModal';
import CVVButton from '../../src/components/CVVButton';
import { MOOD_COLORS } from '../../src/theme/tokens';
import * as chatService from '../../src/services/chatService';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢' },
  { value: 2, emoji: '😔' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '😊' },
  { value: 5, emoji: '😄' },
];

const SAGE_INTRO = 'Olá! Sou o Sage, seu companheiro de bem-estar mental. Estou aqui para te ouvir com atenção e sem julgamentos. Como você está se sentindo hoje?';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Divide a resposta do Sage em mensagens curtas (uma por parágrafo), como num
// chat real. Remove markdown e quebra parágrafos muito longos por frases.
function splitIntoMessages(text) {
  const cleaned = (text || '')
    .replace(/\*\*(.*?)\*\*/g, '$1') // negrito markdown
    .replace(/^\s*[-*]\s+/gm, '')      // marcadores de lista
    .trim();

  const paragraphs = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const out = [];

  for (const para of paragraphs) {
    if (para.length <= 280) {
      out.push(para);
      continue;
    }
    const sentences = para.match(/[^.!?]+[.!?]*\s*/g) || [para];
    let buffer = '';
    for (const s of sentences) {
      if ((buffer + s).length > 280 && buffer) {
        out.push(buffer.trim());
        buffer = s;
      } else {
        buffer += s;
      }
    }
    if (buffer.trim()) out.push(buffer.trim());
  }

  return out.length ? out : [cleaned];
}

// Devolve o humor registrado hoje (se houver), a partir do progresso.
function moodLoggedToday(moods) {
  const key = new Date().toDateString();
  for (let i = (moods || []).length - 1; i >= 0; i--) {
    try {
      if (new Date(moods[i].date).toDateString() === key) return moods[i].mood;
    } catch { /* ignora datas inválidas */ }
  }
  return null;
}

export default function ChatPage() {
  const { progress, addMoodEntry, onSageMessageSent } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [crisisVisible, setCrisisVisible] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [moodChoice, setMoodChoice] = useState(null);
  const [moodDismissed, setMoodDismissed] = useState(false);
  const listRef = useRef(null);

  const todaysMood = useMemo(() => moodLoggedToday(progress.moods), [progress.moods]);
  const activeMood = moodChoice ?? todaysMood;
  const showCheckin = !activeMood && !moodDismissed && !loading;

  // Revela a resposta do Sage como várias mensagens curtas, com o indicador de
  // digitação entre elas — sensação de conversa real, não de "parede de texto".
  const revealSageMessages = useCallback(async (text) => {
    const parts = splitIntoMessages(text);
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        setTyping(true);
        await delay(Math.min(1300, 450 + parts[i].length * 11));
      }
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-${i}`, role: 'sage', content: parts[i], timestamp: new Date().toISOString() },
      ]);
    }
  }, []);

  // Abre (ou reabre) a conversa contínua: carrega o histórico e, se estiver
  // vazia, pede a saudação de abertura ao Sage.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await chatService.getOrCreateSession();
        if (!active) return;
        setSessionId(session.id);
        const history = await chatService.getMessages(session.id);
        if (!active) return;
        if (history.length > 0) {
          setMessages(history);
          setLoading(false);
        } else {
          setLoading(false);
          setTyping(true);
          try {
            const data = await chatService.getIntroMessage(session.id, activeMood);
            if (active) await revealSageMessages(data.response);
          } catch {
            if (active) {
              setMessages([{ id: '1', role: 'sage', content: SAGE_INTRO, timestamp: new Date().toISOString() }]);
            }
          } finally {
            if (active) setTyping(false);
          }
        }
      } catch (e) {
        console.error('Failed to open chat:', e.message);
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickMood(value) {
    setMoodChoice(value);
    addMoodEntry(value, 'daily');
  }

  async function handleSend() {
    if (!input.trim() || typing) return;

    const text = input.trim();
    const history = messages; // estado antes de adicionar a mensagem atual
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Aplica o streak de mensagem do dia (5->50) e marca a primeira conversa
    // (badge first_chat). Guardado por data/estado internamente.
    onSageMessageSent();

    if (detectCrisis(text)) setCrisisVisible(true);

    setTyping(true);
    try {
      const data = await chatService.sendMessage(sessionId, text, history.slice(-9), activeMood);
      await revealSageMessages(data.response);
    } catch (err) {
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
    } finally {
      setTyping(false);
    }
  }

  // FlatList invertida: a mensagem mais recente fica em data[0] (no rodapé).
  const data = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-50">
      <KeyboardAvoidingView className="flex-1" behavior="padding" keyboardVerticalOffset={0}>
        {/* Header */}
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
          <CVVButton compact />
        </View>

        {/* Aviso ético permanente */}
        <View style={{ backgroundColor: '#FEF8EC', paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}>
          <AlertCircle size={12} color="#B87A28" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 11, color: '#B87A28', flex: 1 }}>
            Sage é um apoio complementar, não substitui psicólogos. Crise? CVV: 188
          </Text>
        </View>

        {/* Check-in de humor — leve, 1x por dia */}
        {showCheckin && (
          <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F4F2EE' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#57534E' }}>Como você está hoje?</Text>
              <TouchableOpacity
                onPress={() => setMoodDismissed(true)}
                accessibilityLabel="Dispensar check-in de humor"
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#A29D95" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {MOOD_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => pickMood(m.value)}
                  accessibilityLabel={`Registrar humor ${m.value} de 5`}
                  accessibilityRole="button"
                  style={{
                    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: `${MOOD_COLORS[m.value - 1]}22`,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Conversa */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3D7A67" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={data}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatMessage message={item} />}
            ListHeaderComponent={typing ? <TypingIndicator /> : null}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Composer */}
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
            onPress={handleSend}
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
