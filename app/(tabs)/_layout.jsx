import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, MessageCircle, Target, BookOpen, User } from 'lucide-react-native';

const SAGE = '#3D7A67';
const INACTIVE = '#A29D95';

// Labels renomeados na Fase 4 (Sage / Práticas / Jornada). Os nomes de rota
// (name) permanecem os mesmos — só o título exibido muda.
const TABS = [
  { name: 'index', title: 'Início', Icon: LayoutDashboard },
  { name: 'chat', title: 'Sage', Icon: MessageCircle },
  { name: 'challenges', title: 'Práticas', Icon: Target },
  { name: 'journal', title: 'Diário', Icon: BookOpen },
  { name: 'profile', title: 'Jornada', Icon: User },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: SAGE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#E6E2DB',
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {TABS.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {/* Dot indicator no topo do ícone ativo */}
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    marginBottom: 3,
                    backgroundColor: focused ? SAGE : 'transparent',
                  }}
                />
                <Icon size={size - 2} color={color} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
