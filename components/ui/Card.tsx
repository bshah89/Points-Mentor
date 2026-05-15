import React from 'react';
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding = 16 }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#141420',
          borderRadius: 16,
          padding,
          borderWidth: 1,
          borderColor: '#1C1C2E',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
