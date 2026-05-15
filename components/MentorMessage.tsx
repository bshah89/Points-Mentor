import React from 'react';
import { View, Text } from 'react-native';
import type { MentorMessage as MentorMessageType } from '../types';

interface MentorMessageProps {
  message: MentorMessageType;
}

export function MentorMessage({ message }: MentorMessageProps) {
  const isUser = message.role === 'user';

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12,
      paddingHorizontal: 4,
    }}>
      {!isUser && (
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#6366F1',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8,
          flexShrink: 0,
          alignSelf: 'flex-end',
        }}>
          <Text style={{ fontSize: 14 }}>✦</Text>
        </View>
      )}
      <View
        style={{
          maxWidth: '80%',
          backgroundColor: isUser ? '#6366F1' : '#141420',
          borderRadius: isUser ? 18 : 18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          padding: 12,
          borderWidth: isUser ? 0 : 1,
          borderColor: '#1C1C2E',
        }}
      >
        <Text style={{
          color: isUser ? '#FFFFFF' : '#F9FAFB',
          fontSize: 14,
          lineHeight: 20,
        }}>
          {message.content}
        </Text>
        <Text style={{
          color: isUser ? 'rgba(255,255,255,0.5)' : '#6B7280',
          fontSize: 10,
          marginTop: 4,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {new Date(message.created_at).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {isUser && (
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#1C1C2E',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
          flexShrink: 0,
          alignSelf: 'flex-end',
        }}>
          <Text style={{ fontSize: 14 }}>👤</Text>
        </View>
      )}
    </View>
  );
}
