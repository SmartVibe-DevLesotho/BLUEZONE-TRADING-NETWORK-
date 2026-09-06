import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2563EB' }}>
      <Tabs.Screen name="markets" options={{ title: 'Markets', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color} size={size} /> }} />
      <Tabs.Screen name="chart" options={{ title: 'Chart', tabBarIcon: ({ color, size }) => <Ionicons name="analytics" color={color} size={size} /> }} />
      <Tabs.Screen name="sessions" options={{ title: 'Sessions', tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} /> }} />
      <Tabs.Screen name="autotrade" options={{ title: 'AutoTrade', tabBarIcon: ({ color, size }) => <Ionicons name="flash" color={color} size={size} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name="menu" color={color} size={size} /> }} />
    </Tabs>
  );
}
