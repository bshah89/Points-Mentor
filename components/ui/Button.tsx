import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseContainer: ViewStyle = {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  };

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingVertical: 8, paddingHorizontal: 16 },
    md: { paddingVertical: 14, paddingHorizontal: 24 },
    lg: { paddingVertical: 18, paddingHorizontal: 32 },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: isDisabled ? '#4F46E5AA' : '#6366F1' },
    secondary: { backgroundColor: '#1C1C2E', borderWidth: 1, borderColor: '#6366F1' },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: isDisabled ? '#EF4444AA' : '#EF4444' },
  };

  const textSizeStyles: Record<string, TextStyle> = {
    sm: { fontSize: 13 },
    md: { fontSize: 15 },
    lg: { fontSize: 17 },
  };

  const textVariantStyles: Record<string, TextStyle> = {
    primary: { color: '#FFFFFF', fontWeight: '600' },
    secondary: { color: '#818CF8', fontWeight: '600' },
    ghost: { color: '#9CA3AF', fontWeight: '500' },
    danger: { color: '#FFFFFF', fontWeight: '600' },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[baseContainer, sizeStyles[size], variantStyles[variant], style]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
      ) : null}
      <Text style={[textSizeStyles[size], textVariantStyles[variant], textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
