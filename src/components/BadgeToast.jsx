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
 * BadgeToast — banner celebratório exibido no momento em que uma conquista é
 * desbloqueada. Fica abaixo do XPToast para não sobrepor quando ambos disparam
 * (ex.: uma ação que dá XP e destrava um badge). O valor exibido vem de ESTADO
 * (não ref), então sempre mostra a conquista correta.
 */
export default function BadgeToast() {
  const { badgeNotification } = useUser();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.94);
  // Mantém a conquista visível durante o fade-out (quando badgeNotification volta a null).
  const [displayBadge, setDisplayBadge] = useState(null);
  const exitTimer = useRef(null);

  useEffect(() => {
    if (!badgeNotification) return;
    setDisplayBadge(badgeNotification);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    translateY.value = withSpring(0, { damping: 14, stiffness: 170 });
    scale.value = withSpring(1, { damping: 14, stiffness: 170 });
    opacity.value = withTiming(1, { duration: 220 });

    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: 340, easing: Easing.in(Easing.ease) });
      scale.value = withTiming(0.94, { duration: 340, easing: Easing.in(Easing.ease) });
      opacity.value = withTiming(0, { duration: 340, easing: Easing.in(Easing.ease) });
    }, 3200);

    return () => clearTimeout(exitTimer.current);
  }, [badgeNotification]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!displayBadge) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Conquista desbloqueada: ${displayBadge.name}`}
      style={[
        {
          position: 'absolute',
          top: 110,
          left: 16,
          right: 16,
          alignItems: 'center',
          zIndex: 9999,
        },
        style,
      ]}
    >
      <View
        style={{
          backgroundColor: '#3D7A67',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          maxWidth: 360,
          shadowColor: '#1E4D41',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 22 }}>{displayBadge.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
            CONQUISTA DESBLOQUEADA
          </Text>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
            {displayBadge.name}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
