import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useUserCards } from '../../hooks/useUserCards';
import { useBenefits } from '../../hooks/useBenefits';
import { MentorMessage } from '../../components/MentorMessage';
import { streamMentorResponse, isAnthropicConfigured } from '../../lib/anthropic';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { DEMO_TRANSFER_BONUSES } from '../../data/loyalty';
import { computeBenefitStates } from '../../data/benefits';
import type { MentorMessage as MentorMessageType, MentorContext } from '../../types';

const SUGGESTED_PROMPTS = [
  'Which card should I use for everyday spending?',
  'Am I getting value from my annual fees?',
  'How close am I to earning my companion voucher?',
  'Should I transfer my Amex MR points to Avios now?',
  'What benefits am I not using that I should be?',
  'Which card is best for my next holiday abroad?',
];

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function MentorScreen() {
  const { user } = useAuth();
  const { userCards, loyaltyBalances, signUpBonuses } = useUserCards(user?.id);
  const { benefitStates } = useBenefits(user?.id, userCards);

  const [messages, setMessages] = useState<MentorMessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const streamBufferRef = useRef<string>('');

  const mentorContext: MentorContext = useMemo(() => ({
    user_cards: userCards,
    loyalty_balances: loyaltyBalances,
    active_bonuses: signUpBonuses.filter((b) => !b.claimed),
    benefit_states: benefitStates,
    transfer_bonuses: DEMO_TRANSFER_BONUSES.map((tb) => ({
      id: tb.id,
      from_programme: tb.from,
      to_programme: tb.to,
      bonus_pct: tb.bonusPct,
      start_date: tb.startDate,
      end_date: tb.endDate,
      source_url: tb.sourceUrl ?? null,
      created_at: new Date().toISOString(),
    })),
    todays_date: new Date().toISOString().split('T')[0],
    preferences: {
      full_balance_payer: true,
      preferred_currency: 'Avios',
    },
  }), [userCards, loyaltyBalances, signUpBonuses, benefitStates]);

  useEffect(() => {
    loadChatHistory();
  }, [user?.id]);

  async function loadChatHistory() {
    if (!isSupabaseConfigured || !user?.id) {
      // Add welcome message in demo mode
      const welcome: MentorMessageType = {
        id: generateId(),
        user_id: 'demo',
        role: 'assistant',
        content: `Welcome to CardMentor! I'm your AI credit card adviser, powered by Claude.\n\nI can see your wallet with ${userCards.length > 0 ? `${userCards.length} card${userCards.length !== 1 ? 's' : ''}` : 'no cards yet'}. Ask me anything about maximising your points, choosing the right card, or understanding your benefits.\n\nWhat would you like to know?`,
        created_at: new Date().toISOString(),
      };
      setMessages([welcome]);
      setLoadingHistory(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mentor_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        const welcome: MentorMessageType = {
          id: generateId(),
          user_id: user.id,
          role: 'assistant',
          content: `Welcome to CardMentor! I'm your AI credit card adviser.\n\nI can see your wallet and all your loyalty balances. Ask me anything about maximising your rewards!`,
          created_at: new Date().toISOString(),
        };
        setMessages([welcome]);
      } else {
        setMessages(data);
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function saveMessage(message: MentorMessageType) {
    if (!isSupabaseConfigured || !user?.id) return;
    try {
      await supabase.from('mentor_messages').insert({
        user_id: user.id,
        role: message.role,
        content: message.content,
      });
    } catch (err) {
      console.warn('Failed to save message:', err);
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;

    const userMessage: MentorMessageType = {
      id: generateId(),
      user_id: user?.id ?? 'demo',
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsStreaming(true);
    setStreamingContent('');
    streamBufferRef.current = '';

    await saveMessage(userMessage);

    const allMessages = [...messages, userMessage];

    streamMentorResponse(
      allMessages,
      mentorContext,
      (chunk) => {
        streamBufferRef.current += chunk;
        setStreamingContent(streamBufferRef.current);
      },
      async () => {
        const finalContent = streamBufferRef.current;
        setIsStreaming(false);

        const assistantMessage: MentorMessageType = {
          id: generateId(),
          user_id: user?.id ?? 'demo',
          role: 'assistant',
          content: finalContent,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent('');
        streamBufferRef.current = '';
        await saveMessage(assistantMessage);
      },
      (err) => {
        setIsStreaming(false);
        setStreamingContent('');
        Alert.alert('Error', `Failed to get response: ${err.message}`);
      }
    );
  }

  useEffect(() => {
    if (messages.length > 0 || streamingContent) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, streamingContent]);

  function clearHistory() {
    Alert.alert(
      'Clear conversation',
      'Start a fresh conversation with CardMentor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            if (isSupabaseConfigured && user?.id) {
              await supabase.from('mentor_messages').delete().eq('user_id', user.id);
            }
            setMessages([]);
            setStreamingContent('');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 20,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#1C1C2E',
        }}>
          <View>
            <Text style={{ color: '#F9FAFB', fontSize: 20, fontWeight: '800' }}>AI Mentor</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
              {isAnthropicConfigured ? 'Claude-powered · Live' : 'Demo mode · Add API key for live AI'}
            </Text>
          </View>
          <TouchableOpacity onPress={clearHistory}>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {loadingHistory ? (
            <ActivityIndicator color="#6366F1" style={{ marginTop: 40 }} />
          ) : (
            <>
              {messages.map((msg) => (
                <MentorMessage key={msg.id} message={msg} />
              ))}

              {/* Streaming response */}
              {isStreaming && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12, paddingHorizontal: 4 }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#6366F1',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    alignSelf: 'flex-end',
                  }}>
                    <Text style={{ fontSize: 14 }}>✦</Text>
                  </View>
                  <View style={{
                    maxWidth: '80%',
                    backgroundColor: '#141420',
                    borderRadius: 18,
                    borderBottomLeftRadius: 4,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#1C1C2E',
                  }}>
                    {streamingContent ? (
                      <Text style={{ color: '#F9FAFB', fontSize: 14, lineHeight: 20 }}>
                        {streamingContent}
                      </Text>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 4 }}>
                        <ActivityIndicator size="small" color="#6366F1" />
                        <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Thinking...</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Suggested prompts (only show when no conversation) */}
              {messages.length <= 1 && !isStreaming && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600', marginBottom: 10, letterSpacing: 0.5 }}>
                    SUGGESTED QUESTIONS
                  </Text>
                  <View style={{ gap: 8 }}>
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <TouchableOpacity
                        key={prompt}
                        onPress={() => sendMessage(prompt)}
                        style={{
                          backgroundColor: '#141420',
                          borderRadius: 12,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: '#1C1C2E',
                        }}
                      >
                        <Text style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 18 }}>
                          {prompt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={{
          flexDirection: 'row',
          padding: 12,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: '#1C1C2E',
          backgroundColor: '#0D0D1A',
          gap: 10,
          alignItems: 'flex-end',
        }}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask CardMentor anything..."
            placeholderTextColor="#4B5563"
            multiline
            maxLength={500}
            style={{
              flex: 1,
              backgroundColor: '#141420',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: '#F9FAFB',
              fontSize: 15,
              maxHeight: 100,
              borderWidth: 1,
              borderColor: '#1C1C2E',
            }}
            onSubmitEditing={() => sendMessage(inputText)}
            editable={!isStreaming}
          />
          <TouchableOpacity
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isStreaming}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: inputText.trim() && !isStreaming ? '#6366F1' : '#1C1C2E',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isStreaming ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
