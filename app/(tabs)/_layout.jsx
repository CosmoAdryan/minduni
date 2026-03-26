import { Tabs } from 'expo-router';
import { LayoutDashboard, MessageCircle, Target, BookOpen, User } from 'lucide-react-native';

const TABS = [
  { name: 'index', title: 'Início', Icon: LayoutDashboard },
  { name: 'chat', title: 'Chat', Icon: MessageCircle },
  { name: 'challenges', title: 'Desafios', Icon: Target },
  { name: 'journal', title: 'Diário', Icon: BookOpen },
  { name: 'profile', title: 'Perfil', Icon: User },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
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
            tabBarIcon: ({ color, size }) => <Icon size={size - 2} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
