import { Tabs } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

interface TabIconProps {
  focused: boolean;
  emoji: string;
  label: string;
}

function TabIcon({ focused, emoji, label }: TabIconProps) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10,
        color: focused ? '#6366F1' : '#6B7280',
        fontWeight: focused ? '700' : '400',
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D0D1A',
          borderTopColor: '#1C1C2E',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🏠" label="Home" />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="💳" label="Vault" />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="📅" label="Benefits" />,
        }}
      />
      <Tabs.Screen
        name="till"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🏪" label="Till" />,
        }}
      />
      <Tabs.Screen
        name="mentor"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="✦" label="Mentor" />,
        }}
      />
    </Tabs>
  );
}
