import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeInUp,
  FadeOutUp,
} from 'react-native-reanimated';

// Um ponto do indicador de digitação. Sobe ~5px no pico (30% do ciclo) e
// repousa com opacidade menor. Delay escalonado para não parecer mecânico.
function TypingDot({ delay }) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 270 }),
          withTiming(0, { duration: 630 }),
        ),
        -1,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -5 * p.value }],
    opacity: 0.4 + 0.6 * p.value,
  }));

  return (
    <Animated.View
      style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#CEC9BF' }, style]}
    />
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
        <View className="bg-sage-500 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
          <Text className="text-white text-sm">{message.content}</Text>
        </View>
        <Text className="text-xs text-stone-400 mt-1">{time}</Text>
      </View>
    );
  }

  return (
    <View className="items-start mb-3">
      <View className="flex-row items-end">
        <View className="w-8 h-8 rounded-full bg-sage-100 items-center justify-center mr-2 mb-1">
          <Text style={{ fontSize: 16 }}>🌿</Text>
        </View>
        <View>
          <View className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs shadow-sm">
            {/* Voz tipográfica do Sage: Lora Italic, exclusiva de role === 'sage' */}
            <Text
              accessibilityLabel={`Sage: ${message.content}`}
              className="text-stone-900"
              style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 15, lineHeight: 24 }}
            >
              {message.content}
            </Text>
          </View>
          <Text className="text-xs text-stone-400 mt-1 ml-1">{time}</Text>
        </View>
      </View>
    </View>
  );
}

export function TypingIndicator() {
  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(150)}
      className="items-start mb-3"
    >
      <View className="flex-row items-end">
        <View className="w-8 h-8 rounded-full bg-sage-100 items-center justify-center mr-2 mb-1">
          <Text style={{ fontSize: 16 }}>🌿</Text>
        </View>
        <View
          className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex-row items-center"
          style={{ gap: 4 }}
          accessibilityLabel="Sage está digitando"
        >
          <TypingDot delay={0} />
          <TypingDot delay={160} />
          <TypingDot delay={320} />
        </View>
      </View>
    </Animated.View>
  );
}
