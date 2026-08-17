import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, Pressable, ActivityIndicator,
  Switch, ScrollView, Keyboard,
} from 'react-native';
import { X, Clock } from 'lucide-react-native';
import { stone, sage } from '../theme/tokens';

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Uma vez' },
  { value: 'daily', label: 'Todo dia' },
  { value: 'weekly', label: 'Toda semana' },
];

const pad2 = (n) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, i) => pad2(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad2(i));

const ITEM_H = 44;      // altura de cada item da roda
const VISIBLE = 5;      // itens visíveis (deve ser ímpar p/ centralizar)
const PAD = ITEM_H * Math.floor(VISIBLE / 2);

// Coluna "roda" de rolagem com encaixe (estilo seletor de alarme). Atualiza o
// índice selecionado ao terminar o movimento e também durante a rolagem (para o
// destaque acompanhar o dedo).
function WheelColumn({ data, index, onIndexChange, accessibilityLabel }) {
  const ref = useRef(null);

  // Posiciona na opção atual ao montar (sem animação).
  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: index * ITEM_H, animated: false });
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function indexFromEvent(e) {
    const y = e.nativeEvent.contentOffset.y;
    return Math.max(0, Math.min(data.length - 1, Math.round(y / ITEM_H)));
  }

  return (
    <ScrollView
      ref={ref}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      onScroll={(e) => {
        const i = indexFromEvent(e);
        if (i !== index) onIndexChange(i);
      }}
      scrollEventThrottle={16}
      onMomentumScrollEnd={(e) => {
        const i = indexFromEvent(e);
        if (i !== index) onIndexChange(i);
      }}
      style={{ height: ITEM_H * VISIBLE, flex: 1 }}
      contentContainerStyle={{ paddingVertical: PAD }}
      accessibilityLabel={accessibilityLabel}
    >
      {data.map((d, i) => (
        <View key={d} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{
            fontSize: 24,
            color: i === index ? sage[700] : stone[300],
            fontWeight: i === index ? '700' : '400',
          }}>{d}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// Modal de criação de tarefa. `defaultDate` é o dia selecionado no calendário
// ('YYYY-MM-DD'). Chama onSubmit({ title, time, recurrence }) e fecha.
export default function TaskFormModal({ visible, defaultDate, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [hasTime, setHasTime] = useState(false);   // um horário foi definido
  const [showWheel, setShowWheel] = useState(false); // a roda está expandida
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [recurrence, setRecurrence] = useState('none');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reseta os campos toda vez que o modal abre (hora inicial = agora).
  useEffect(() => {
    if (visible) {
      const now = new Date();
      setTitle('');
      setHasTime(false);
      setShowWheel(false);
      setHour(now.getHours());
      setMinute(now.getMinutes());
      setRecurrence('none');
      setError('');
      setSaving(false);
    }
  }, [visible]);

  async function handleSave() {
    const clean = title.trim();
    if (!clean) {
      setError('Dê um nome para a tarefa.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const time = hasTime ? `${pad2(hour)}:${pad2(minute)}` : null;
      await onSubmit({ title: clean, time, recurrence });
    } catch (e) {
      setError(e?.message || 'Não foi possível salvar. Tente de novo.');
      setSaving(false);
    }
  }

  const dateLabel = defaultDate
    ? defaultDate.split('-').reverse().slice(0, 2).join('/')
    : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Fundo: toque fora fecha. É um irmão do sheet (não o envolve), para
            não capturar o gesto de rolagem das rodas de horário. */}
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
          onPress={onClose}
          accessibilityLabel="Fechar"
        />
        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: stone[900] }}>Nova tarefa</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar" accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={stone[400]} />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, color: stone[500], marginBottom: 6 }}>O que você quer fazer{dateLabel ? ` em ${dateLabel}` : ''}?</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex.: Respiração 4-4-4, estudar cálculo..."
            placeholderTextColor={stone[400]}
            style={{ backgroundColor: stone[100], borderWidth: 1, borderColor: stone[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: stone[900], marginBottom: 16 }}
            accessibilityLabel="Título da tarefa"
            returnKeyType="done"
            onFocus={() => setShowWheel(false)}
            onSubmitEditing={() => Keyboard.dismiss()}
          />

          {/* Horário — seletor em roda, estilo alarme (opcional). A roda expande
              ao ligar e recolhe quando o foco vai para outro campo, deixando só
              o resumo "Horário · HH:MM" (tocável para reabrir e editar). */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => { if (hasTime) { Keyboard.dismiss(); setShowWheel((s) => !s); } }}
              disabled={!hasTime}
              accessibilityRole="button"
              accessibilityLabel={hasTime ? `Horário ${pad2(hour)}:${pad2(minute)}. Toque para editar` : 'Horário'}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingVertical: 4 }}
            >
              <Clock size={16} color={stone[500]} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: stone[600] }}>
                Horário {hasTime ? `· ${pad2(hour)}:${pad2(minute)}` : '(opcional)'}
              </Text>
              {hasTime && !showWheel && (
                <Text style={{ fontSize: 12, color: sage[600], fontWeight: '600' }}>editar</Text>
              )}
            </TouchableOpacity>
            <Switch
              value={hasTime}
              onValueChange={(v) => {
                Keyboard.dismiss();
                setHasTime(v);
                setShowWheel(v); // ligar abre a roda; desligar a esconde
              }}
              trackColor={{ false: stone[200], true: sage[200] }}
              thumbColor={hasTime ? sage[500] : '#f4f3f4'}
              accessibilityLabel="Definir um horário para a tarefa"
            />
          </View>

          {hasTime && showWheel && (
            <View style={{ height: ITEM_H * VISIBLE, marginTop: 8, position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
              {/* faixa central que marca a seleção */}
              <View
                pointerEvents="none"
                style={{ position: 'absolute', left: 0, right: 0, top: PAD, height: ITEM_H, backgroundColor: sage[50], borderRadius: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: sage[100] }}
              />
              <WheelColumn data={HOURS} index={hour} onIndexChange={setHour} accessibilityLabel="Selecionar hora" />
              <Text style={{ fontSize: 26, fontWeight: '700', color: stone[400] }}>:</Text>
              <WheelColumn data={MINUTES} index={minute} onIndexChange={setMinute} accessibilityLabel="Selecionar minuto" />
            </View>
          )}

          <Text style={{ fontSize: 13, color: stone[500], marginBottom: 8, marginTop: 16 }}>Repetir</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {RECURRENCE_OPTIONS.map((opt) => {
              const active = recurrence === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { setRecurrence(opt.value); setShowWheel(false); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
                    backgroundColor: active ? sage[100] : stone[100],
                    borderWidth: 1, borderColor: active ? sage[400] : stone[200],
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: active ? sage[700] : stone[500] }}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? <Text style={{ color: '#C04A4A', fontSize: 13, marginTop: 4 }}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Salvar tarefa"
            style={{ marginTop: 18, backgroundColor: sage[500], borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: saving ? 0.7 : 1 }}
          >
            {saving
              ? <ActivityIndicator color="white" />
              : <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Adicionar à agenda</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
