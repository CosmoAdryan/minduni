import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { T } from '../theme';

/**
 * XPToast — notificação visual animada que aparece no topo da tela
 * sempre que o usuário ganha XP. Renderizado no root layout para
 * funcionar em qualquer tab/tela.
 */
export default function XPToast() {
  const { xpNotification } = useUser();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  // mantém o valor mesmo durante o fade-out
  const lastAmount = useRef(0);

  useEffect(() => {
    if (!xpNotification) return;
    lastAmount.current = xpNotification;

    Animated.sequence([
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 22,
          bounciness: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1700),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [xpNotification]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Você ganhou ${lastAmount.current} XP`}
      style={{
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <View
        style={{
          backgroundColor: T.s900,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: T.a50, alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={16} color={T.a400} fill={T.a400} />
        </View>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 }}>
          +{lastAmount.current} XP
        </Text>
      </View>
    </Animated.View>
  );
}
