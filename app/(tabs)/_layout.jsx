import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { LayoutDashboard, MessageCircle, Clock, BookOpen, User } from 'lucide-react-native';
import { T } from '../../src/theme';

// Labels renomeados (Chat→Sage, Desafios→Práticas, Perfil→Jornada).
// Os NOMES de rota (name) permanecem os mesmos — deep links e router.push intactos.
const TABS = [
  { name: 'index', title: 'Início', Icon: LayoutDashboard },
  { name: 'chat', title: 'Sage', Icon: MessageCircle },
  { name: 'challenges', title: 'Práticas', Icon: Clock },
  { name: 'journal', title: 'Diário', Icon: BookOpen },
  { name: 'profile', title: 'Jornada', Icon: User },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.g500,
        tabBarInactiveTintColor: T.s400,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: T.s200,
          height: 64,
          paddingBottom: 10,
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
              <View style={{ alignItems: 'center', justifyContent: 'flex-start' }}>
                {/* Dot indicator no topo do tab ativo */}
                <View style={{ width: 18, height: 3, borderRadius: 2, marginBottom: 5, backgroundColor: focused ? T.g500 : 'transparent' }} />
                <Icon size={size - 2} color={color} strokeWidth={1.8} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
