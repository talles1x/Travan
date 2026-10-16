import { Redirect, Tabs } from 'expo-router';

import { Icon } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useStore } from '@/lib/store';

export default function TabsLayout() {
  const { ready, user, myTickets } = useStore();
  if (ready && !user) return <Redirect href="/welcome" />;

  const active = myTickets.filter((t) => t.status === 'confirmed' || t.status === 'pending').length;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.brandDark },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, minHeight: 64 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Buscar',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'search' : 'search-outline'} color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Passagens',
          tabBarBadge: active || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.white, fontSize: 11 },
          tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'ticket' : 'ticket-outline'} color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'person' : 'person-outline'} color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
