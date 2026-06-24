import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useUser } from '../context/UserContext';

/**
 * XPToast — notificação visual animada (Reanimated) que aparece no topo da tela
 * sempre que o usuário ganha XP. Entrada com spring, saída com ease-in.
 * Renderizado no root layout para funcionar em qualquer tab/tela.
 */
export default function XPToast() {
  const { xpNotification } = useUser();
  const translateY = useSharedValue(-90);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.94);
  // Estado (não ref) para o valor exibido: dispara re-render com o número certo
  // e o mantém visível durante o fade-out (quando xpNotification volta a null).
  const [displayAmount, setDisplayAmount] = useState(0);
  const exitTimer = useRef(null);

  useEffect(() => {
    if (!xpNotification) return;
    setDisplayAmount(xpNotification);

    // Háptico leve no momento em que o toast aparece.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // Entrada — spring suave, overshoot discreto.
    translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
    scale.value = withSpring(1, { damping: 14, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 200 });

    // Saída — ease-in, mais rápido que a entrada (sai pelo mesmo caminho).
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => {
      translateY.value = withTiming(-90, { duration: 320, easing: Easing.in(Easing.ease) });
      scale.value = withTiming(0.94, { duration: 320, easing: Easing.in(Easing.ease) });
      opacity.value = withTiming(0, { duration: 320, easing: Easing.in(Easing.ease) });
    }, 2700);

    return () => clearTimeout(exitTimer.current);
  }, [xpNotification]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Você ganhou ${displayAmount} XP`}
      style={[
        {
          position: 'absolute',
          top: 56,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 9999,
        },
        style,
      ]}
    >
      <View
        style={{
          backgroundColor: '#D4973E',
          paddingHorizontal: 22,
          paddingVertical: 10,
          borderRadius: 28,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#B87A28',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <Text style={{ fontSize: 18, marginRight: 8 }}>⚡</Text>
        <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 }}>
          +{displayAmount} XP
        </Text>
      </View>
    </Animated.View>
  );
}
