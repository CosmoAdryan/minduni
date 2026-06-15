import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { T } from '../theme';

// Skeleton shimmer genérico em stone-200/100. Usado nos loadings (sem layout shift).
export function Skeleton({ width = '100%', height = 14, borderRadius = 6, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] });
  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: T.s200, opacity }, style]} />
  );
}

// Skeleton do dashboard — mantém a estrutura exata do layout final.
export function DashboardSkeleton() {
  return (
    <View style={{ padding: 16, gap: 14 }}>
      <View style={{ gap: 6 }}>
        <Skeleton width={80} height={10} />
        <Skeleton width={140} height={22} />
      </View>
      <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: T.s200, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Skeleton width={34} height={34} borderRadius={10} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="80%" height={12} />
            <Skeleton width="50%" height={10} />
          </View>
        </View>
        <Skeleton width="100%" height={6} borderRadius={99} />
      </View>
      <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: T.s200, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Skeleton width={36} height={36} borderRadius={10} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="40%" height={9} />
          <Skeleton width="65%" height={12} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[0, 1].map((i) => (
          <View key={i} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: T.s200 }}>
            <Skeleton width={24} height={24} borderRadius={6} />
            <Skeleton width="60%" height={9} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default Skeleton;
