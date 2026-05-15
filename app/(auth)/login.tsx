import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { signInWithEmail } from '../../hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSendMagicLink() {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmail(email.trim().toLowerCase());
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Hero */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <LinearGradient
              colors={['#6366F1', '#818CF8']}
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 36 }}>✦</Text>
            </LinearGradient>
            <Text style={{
              color: '#F9FAFB',
              fontSize: 32,
              fontWeight: '800',
              letterSpacing: -0.5,
            }}>
              CardMentor
            </Text>
            <Text style={{
              color: '#9CA3AF',
              fontSize: 16,
              marginTop: 8,
              textAlign: 'center',
            }}>
              Your AI-powered UK credit card adviser
            </Text>
          </View>

          {!sent ? (
            <View>
              <Text style={{ color: '#F9FAFB', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
                Sign in
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 24 }}>
                We'll send a magic link to your email — no password needed.
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#4B5563"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={{
                  backgroundColor: '#141420',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: '#F9FAFB',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#1C1C2E',
                  marginBottom: 16,
                }}
              />

              <Button
                title="Send Magic Link"
                onPress={handleSendMagicLink}
                loading={loading}
                size="lg"
              />

              <View style={{ marginTop: 24, padding: 16, backgroundColor: '#141420', borderRadius: 12, borderWidth: 1, borderColor: '#1C1C2E' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>
                  Don't have an account? Just enter your email and we'll create one automatically.
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 20 }}>📨</Text>
              <Text style={{ color: '#F9FAFB', fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
                Check your inbox
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 15, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
                We sent a magic link to{'\n'}
                <Text style={{ color: '#818CF8', fontWeight: '600' }}>{email}</Text>
                {'\n\n'}Tap the link in the email to sign in.
              </Text>
              <Button
                title="Use different email"
                onPress={() => { setSent(false); setEmail(''); }}
                variant="ghost"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
