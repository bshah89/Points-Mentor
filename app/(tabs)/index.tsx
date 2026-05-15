import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { useUserCards } from '../../hooks/useUserCards';
import { useBenefits } from '../../hooks/useBenefits';
import { BenefitRow } from '../../components/BenefitRow';
import { BonusProgress } from '../../components/BonusProgress';
import { calculateROI } from '../../data/benefits';
import { estimateValue } from '../../data/loyalty';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { userCards, signUpBonuses, loyaltyBalances, loading, refetch } = useUserCards(user?.id);
  const { benefitStates } = useBenefits(user?.id, userCards);

  const urgentBenefits = useMemo(
    () => benefitStates.filter((bs) => bs.urgency !== 'green' && bs.remainingGbp > 0),
    [benefitStates]
  );

  const activeBonuses = useMemo(
    () => signUpBonuses.filter((b) => !b.claimed),
    [signUpBonuses]
  );

  const totalPortfolioValue = useMemo(() => {
    return loyaltyBalances.reduce((total, lb) => {
      return total + estimateValue(lb.programme, lb.balance);
    }, 0);
  }, [loyaltyBalances]);

  const roiSummary = useMemo(() => {
    let totalFees = 0;
    let totalBenefits = 0;
    for (const uc of userCards) {
      const roi = calculateROI(uc);
      totalFees += roi.annualFee;
      totalBenefits += roi.benefitValue;
    }
    return { totalFees, totalBenefits, netValue: totalBenefits - totalFees };
  }, [userCards]);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor="#6366F1"
          />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>{today}</Text>
          <Text style={{ color: '#F9FAFB', fontSize: 26, fontWeight: '800', marginTop: 4 }}>
            Good {getGreeting()}
          </Text>
        </View>

        {/* Portfolio value banner */}
        <LinearGradient
          colors={['#4F46E5', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>
            PORTFOLIO VALUE
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: 4 }}>
            £{totalPortfolioValue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
            Across {loyaltyBalances.length} loyalty programme{loyaltyBalances.length !== 1 ? 's' : ''}
          </Text>

          {/* Balances row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {loyaltyBalances.map((lb) => (
              <View
                key={lb.id}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                  {lb.balance.toLocaleString()}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                  {lb.programme}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Quick stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: '#141420', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1C1C2E' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 4 }}>Cards</Text>
            <Text style={{ color: '#F9FAFB', fontSize: 22, fontWeight: '800' }}>{userCards.length}</Text>
            <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>in wallet</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#141420', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1C1C2E' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 4 }}>Fee ROI</Text>
            <Text style={{
              color: roiSummary.netValue >= 0 ? '#10B981' : '#EF4444',
              fontSize: 22,
              fontWeight: '800',
            }}>
              {roiSummary.netValue >= 0 ? '+' : ''}£{Math.abs(roiSummary.netValue).toFixed(0)}
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>net annual</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#141420', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: urgentBenefits.length > 0 ? '#EF444430' : '#1C1C2E' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 4 }}>Urgent</Text>
            <Text style={{
              color: urgentBenefits.length > 0 ? '#EF4444' : '#10B981',
              fontSize: 22,
              fontWeight: '800',
            }}>
              {urgentBenefits.length}
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>benefits</Text>
          </View>
        </View>

        {/* Urgent benefits */}
        {urgentBenefits.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#F9FAFB', fontSize: 17, fontWeight: '700' }}>
                ⚡ Action Needed
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
                <Text style={{ color: '#818CF8', fontSize: 13 }}>See all</Text>
              </TouchableOpacity>
            </View>
            {urgentBenefits.slice(0, 3).map((bs) => (
              <BenefitRow key={`${bs.userCardId}-${bs.benefit.id}`} state={bs} />
            ))}
          </View>
        )}

        {/* Active sign-up bonuses */}
        {activeBonuses.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#F9FAFB', fontSize: 17, fontWeight: '700', marginBottom: 12 }}>
              🎯 Sign-up Bonuses
            </Text>
            {activeBonuses.slice(0, 2).map((bonus) => (
              <BonusProgress key={bonus.id} bonus={bonus} />
            ))}
          </View>
        )}

        {/* Quick actions */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: '#F9FAFB', fontSize: 17, fontWeight: '700', marginBottom: 12 }}>
            Quick Actions
          </Text>
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/till')}
              style={{
                backgroundColor: '#141420',
                borderRadius: 14,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#1C1C2E',
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 14 }}>🏪</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F9FAFB', fontSize: 15, fontWeight: '600' }}>At-the-Till Advisor</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Which card should I use right now?</Text>
              </View>
              <Text style={{ color: '#6B7280', fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/mentor')}
              style={{
                backgroundColor: '#141420',
                borderRadius: 14,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#1C1C2E',
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 14 }}>✦</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F9FAFB', fontSize: 15, fontWeight: '600' }}>Ask AI Mentor</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Get personalised points advice</Text>
              </View>
              <Text style={{ color: '#6B7280', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
