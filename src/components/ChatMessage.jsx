import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { T, SAGE_FONT } from '../theme';

// Avatar SVG-like do Sage (círculo sage, sem emoji) — pequeno, reutilizável.
function SageAvatar({ size = 32 }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: T.g100, alignItems: 'center', justifyContent: 'center',
      }}
    >
      <View style={{ width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21, borderWidth: 1.6, borderColor: T.g500 }} />
    </View>
  );
}

export function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isUser) {
    return (
      <View className="items-end mb-3">
        <View style={{ backgroundColor: T.g500, borderRadius: 14, borderTopRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 280 }}>
          <Text style={{ color: '#fff', fontSize: 14, lineHeight: 21 }}>{message.content}</Text>
        </View>
        <Text style={{ fontSize: 11, color: T.s400, marginTop: 4 }}>{time}</Text>
      </View>
    );
  }

  return (
    <View className="items-start mb-3">
      <View className="flex-row items-end">
        <View style={{ marginRight: 8, marginBottom: 4 }}>
          <SageAvatar size={32} />
        </View>
        <View>
          <View style={{ backgroundColor: '#fff', borderRadius: 14, borderTopLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 280, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
            {/* Voz do Sage — serif itálico (Lora / fallback serif) */}
            <Text style={{ fontFamily: SAGE_FONT, fontStyle: 'italic', color: T.s800, fontSize: 14, lineHeight: 23 }}>
              {message.content}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: T.s400, marginTop: 4, marginLeft: 4 }}>{time}</Text>
        </View>
      </View>
    </View>
  );
}

// Typing indicator — 3 dots com bounce sequencial (delays 0/160/320ms).
export function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 180, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 540, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);

  return (
    <View className="items-start mb-3">
      <View className="flex-row items-end">
        <View style={{ marginRight: 8, marginBottom: 4 }}>
          <SageAvatar size={32} />
        </View>
        <View style={{ backgroundColor: '#fff', borderRadius: 14, borderTopLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 4, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={{
                width: 6, height: 6, borderRadius: 3, backgroundColor: T.s300,
                opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export { SageAvatar };
