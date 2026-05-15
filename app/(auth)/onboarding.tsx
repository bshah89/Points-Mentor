import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { CARD_DATABASE } from '../../data/cards';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const STEPS = ['Welcome', 'Pick Cards', 'Preferences', 'Done'];

function getCardGradient(issuer: string): [string, string] {
  const gradients: Record<string, [string, string]> = {
    'American Express': ['#004A9F', '#006FCF'],
    'Barclays': ['#005E7D', '#00AEEF'],
    'HSBC': ['#8B0000', '#DB0011'],
    'Virgin Money': ['#8B0000', '#E10014'],
    'Chase': ['#0A4A7A', '#117ACA'],
    'default': ['#1C1C2E', '#2D2D44'],
  };
  return gradients[issuer] ?? gradients.default;
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [fullBalancePayer, setFullBalancePayer] = useState(true);
  const [preferredCurrency, setPreferredCurrency] = useState('Avios');
  const [saving, setSaving] = useState(false);

  const currencies = ['Avios', 'MR', 'Virgin Points', 'HSBC Points', 'Cashback'];

  function toggleCard(cardId: string) {
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  }

  async function finish() {
    if (selectedCardIds.length === 0) {
      Alert.alert('No cards selected', 'Please select at least one card to continue.');
      return;
    }

    setSaving(true);
    try {
      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Update profile
          await supabase.from('profiles').upsert({
            id: user.id,
            full_balance_payer: fullBalancePayer,
            preferred_currency: preferredCurrency,
          });

          // Add selected cards
          const today = new Date().toISOString().split('T')[0];
          for (const cardId of selectedCardIds) {
            await supabase.from('user_cards').insert({
              user_id: user.id,
              card_id: cardId,
              added_at: today,
            });
          }
        }
      }
      router.replace('/(tabs)/');
    } catch (err) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      {/* Progress bar */}
      <View style={{ flexDirection: 'row', padding: 20, gap: 6 }}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={{
              flex: 1,
              height: 3,
              backgroundColor: i <= step ? '#6366F1' : '#1C1C2E',
              borderRadius: 2,
            }}
          />
        ))}
      </View>

      {step === 0 && (
        <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
          <LinearGradient
            colors={['#6366F1', '#818CF8']}
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              marginTop: 20,
            }}
          >
            <Text style={{ fontSize: 36 }}>✦</Text>
          </LinearGradient>
          <Text style={{ color: '#F9FAFB', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 16 }}>
            Welcome to CardMentor
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
            Your AI-powered UK credit card adviser. Get the most from your cards — every time you spend.
          </Text>

          {[
            { icon: '💳', title: 'Card Vault', desc: 'Track all your UK credit cards in one place' },
            { icon: '📅', title: 'Benefits Calendar', desc: 'Never miss a credit reset or expiry date' },
            { icon: '🏪', title: 'At-the-Till Advisor', desc: 'Know exactly which card to use, instantly' },
            { icon: '🎯', title: 'Sign-up Bonus Tracker', desc: 'Hit spend targets to claim your welcome bonuses' },
            { icon: '✦', title: 'AI Mentor', desc: 'Ask Claude anything about maximising your points' },
          ].map((feature) => (
            <View
              key={feature.title}
              style={{
                flexDirection: 'row',
                backgroundColor: '#141420',
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 14 }}>{feature.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F9FAFB', fontSize: 14, fontWeight: '600' }}>{feature.title}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 2 }}>{feature.desc}</Text>
              </View>
            </View>
          ))}

          <Button
            title="Get Started"
            onPress={() => setStep(1)}
            size="lg"
            style={{ width: '100%', marginTop: 24 }}
          />
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ color: '#F9FAFB', fontSize: 22, fontWeight: '800', marginBottom: 6 }}>
            Which cards do you have?
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 20 }}>
            Select all the UK credit cards in your wallet.
          </Text>

          {CARD_DATABASE.map((card) => {
            const isSelected = selectedCardIds.includes(card.id);
            const gradient = getCardGradient(card.issuer);

            return (
              <TouchableOpacity
                key={card.id}
                onPress={() => toggleCard(card.id)}
                activeOpacity={0.8}
                style={{ marginBottom: 10 }}
              >
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 14,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: '#6366F1',
                    opacity: isSelected ? 1 : 0.75,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 0.8 }}>
                      {card.issuer.toUpperCase()}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginTop: 2 }}>
                      {card.name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
                      {card.earn_currency} · {card.network}
                      {card.annual_fee_gbp > 0 ? ` · £${card.annual_fee_gbp}/yr` : ' · Free'}
                    </Text>
                  </View>
                  <View style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: 2,
                    borderColor: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                    backgroundColor: isSelected ? '#6366F1' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isSelected && <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>✓</Text>}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 20 }}>
            <Button title="Back" onPress={() => setStep(0)} variant="ghost" style={{ flex: 1 }} />
            <Button
              title={`Next (${selectedCardIds.length} selected)`}
              onPress={() => {
                if (selectedCardIds.length === 0) {
                  Alert.alert('No cards', 'Please select at least one card.');
                  return;
                }
                setStep(2);
              }}
              style={{ flex: 2 }}
            />
          </View>
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text style={{ color: '#F9FAFB', fontSize: 22, fontWeight: '800', marginBottom: 6 }}>
            Your preferences
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 28 }}>
            These help CardMentor give you better advice.
          </Text>

          {/* Full balance payer */}
          <View style={{
            backgroundColor: '#141420',
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#1C1C2E',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ color: '#F9FAFB', fontSize: 15, fontWeight: '600' }}>
                  Full balance payer
                </Text>
                <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>
                  I pay my credit card balance in full each month. This is strongly recommended.
                </Text>
              </View>
              <Switch
                value={fullBalancePayer}
                onValueChange={setFullBalancePayer}
                trackColor={{ false: '#374151', true: '#6366F1' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {!fullBalancePayer && (
              <View style={{ backgroundColor: '#F59E0B15', borderRadius: 8, padding: 10, marginTop: 10 }}>
                <Text style={{ color: '#F59E0B', fontSize: 13 }}>
                  ⚠ Carrying a balance means interest charges will outweigh any rewards earned.
                </Text>
              </View>
            )}
          </View>

          {/* Preferred currency */}
          <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 10, letterSpacing: 0.5 }}>
            PREFERRED POINTS CURRENCY
          </Text>
          <View style={{ gap: 8, marginBottom: 32 }}>
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency}
                onPress={() => setPreferredCurrency(currency)}
                style={{
                  backgroundColor: preferredCurrency === currency ? '#6366F120' : '#141420',
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: preferredCurrency === currency ? '#6366F1' : '#1C1C2E',
                }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: preferredCurrency === currency ? '#6366F1' : '#4B5563',
                  backgroundColor: preferredCurrency === currency ? '#6366F1' : 'transparent',
                  marginRight: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {preferredCurrency === currency && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
                  )}
                </View>
                <Text style={{
                  color: preferredCurrency === currency ? '#F9FAFB' : '#9CA3AF',
                  fontSize: 15,
                  fontWeight: preferredCurrency === currency ? '600' : '400',
                }}>
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Back" onPress={() => setStep(1)} variant="ghost" style={{ flex: 1 }} />
            <Button title="Finish Setup" onPress={() => setStep(3)} style={{ flex: 2 }} />
          </View>
        </ScrollView>
      )}

      {step === 3 && (
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 64, marginBottom: 24 }}>🎉</Text>
          <Text style={{ color: '#F9FAFB', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>
            You're all set!
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 12 }}>
            {selectedCardIds.length} card{selectedCardIds.length !== 1 ? 's' : ''} added to your vault.
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 40 }}>
            CardMentor will help you maximise every pound you spend and every benefit you have.
          </Text>
          <Button
            title="Enter CardMentor"
            onPress={finish}
            loading={saving}
            size="lg"
            style={{ width: '100%' }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
