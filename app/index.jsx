import { View, ActivityIndicator } from 'react-native';

// Rota raiz "/". Serve apenas como ponto de entrada: o AuthGuard (no _layout)
// redireciona para onboarding, login ou tabs conforme o estado. Mostra um
// indicador enquanto a decisão é tomada.
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF9' }}>
      <ActivityIndicator color="#3D7A67" />
    </View>
  );
}
