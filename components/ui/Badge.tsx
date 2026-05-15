import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

interface BadgeProps {
  label: string;
  color?: 'green' | 'amber' | 'red' | 'indigo' | 'gray' | 'blue';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const COLOR_MAP = {
  green: { bg: '#10B98120', text: '#10B981', border: '#10B98140' },
  amber: { bg: '#F59E0B20', text: '#F59E0B', border: '#F59E0B40' },
  red: { bg: '#EF444420', text: '#EF4444', border: '#EF444440' },
  indigo: { bg: '#6366F120', text: '#818CF8', border: '#6366F140' },
  gray: { bg: '#9CA3AF20', text: '#9CA3AF', border: '#9CA3AF40' },
  blue: { bg: '#3B82F620', text: '#60A5FA', border: '#3B82F640' },
};

export function Badge({ label, color = 'gray', size = 'sm', style }: BadgeProps) {
  const colors = COLOR_MAP[color];

  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          borderRadius: 6,
          paddingHorizontal: size === 'sm' ? 8 : 12,
          paddingVertical: size === 'sm' ? 3 : 5,
          borderWidth: 1,
          borderColor: colors.border,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: size === 'sm' ? 11 : 13,
          fontWeight: '600',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
