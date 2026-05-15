import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useUserCards } from '../../hooks/useUserCards';
import { TillCard } from '../../components/TillCard';
import { Badge } from '../../components/ui/Badge';
import { getEarnRate } from '../../data/cards';
import { checkSection75, getPaymentMethodLabel, PAYMENT_METHODS } from '../../lib/section75';
import type { TillContext, TillRecommendation, MerchantCategory } from '../../types';
import type { PaymentMethod } from '../../lib/section75';

const MERCHANT_CATEGORIES: { id: MerchantCategory; label: string; emoji: string }[] = [
  { id: 'default', label: 'General', emoji: '🛒' },
  { id: 'dining', label: 'Dining', emoji: '🍽' },
  { id: 'groceries', label: 'Groceries', emoji: '🥦' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'petrol', label: 'Petrol', emoji: '⛽' },
  { id: 'online', label: 'Online', emoji: '💻' },
  { id: 'sainsburys', label: "Sainsbury's", emoji: '🧡' },
  { id: 'john_lewis', label: 'John Lewis', emoji: '🛍' },
  { id: 'waitrose', label: 'Waitrose', emoji: '🌿' },
  { id: 'ba_spend', label: 'British Airways', emoji: '✈' },
  { id: 'virgin_atlantic', label: 'Virgin Atlantic', emoji: '💫' },
  { id: 'amex_travel', label: 'Amex Travel', emoji: '🗺' },
];

function rankCards(
  tillContext: TillContext,
  userCards: ReturnType<typeof useUserCards>['userCards']
): TillRecommendation[] {
  const recommendations: TillRecommendation[] = [];

  for (const uc of userCards) {
    const card = uc.definition;
    if (!card || !uc.is_active) continue;

    // Filter out Amex if merchant doesn't accept it
    if (!tillContext.acceptsAmex && card.network === 'AMEX') continue;

    const earnRate = getEarnRate(card, tillContext.category);
    const fxWarning = tillContext.isForeignCurrency && card.fx_fee_pct > 0;

    // Section 75 applies if amount > £100 and card has S75
    const section75Applies = tillContext.amountGbp > 100 && tillContext.amountGbp <= 30000 && card.section_75;

    // Voucher progress
    let voucherProgress: number | undefined;
    if (card.voucher) {
      voucherProgress = Math.min(uc.current_year_spend_gbp / card.voucher.spend_threshold_gbp, 1);
    }

    // Scoring algorithm
    let score = 0;

    // Base earn rate (most important)
    score += earnRate * 30;

    // Section 75 bonus
    if (section75Applies) score += 15;

    // Zero FX fee bonus for foreign transactions
    if (tillContext.isForeignCurrency && card.fx_fee_pct === 0) score += 25;

    // FX fee penalty
    if (fxWarning) score -= card.fx_fee_pct * 5;

    // Voucher threshold proximity bonus (encourage spend to hit it)
    if (voucherProgress !== undefined && voucherProgress < 1) {
      const remaining = card.voucher!.spend_threshold_gbp - uc.current_year_spend_gbp;
      if (remaining < 2000) score += 10; // Within £2000 of voucher
    }

    // Wide acceptance bonus (for non-amex)
    if (card.accepted_widely) score += 2;

    // Build reasons
    const secondaryReasons: string[] = [];
    let primaryReason = '';

    if (tillContext.isForeignCurrency && card.fx_fee_pct === 0) {
      primaryReason = `No foreign transaction fee — save ${card.fx_fee_pct > 0 ? `${card.fx_fee_pct}% ` : ''}vs others`;
    } else if (section75Applies) {
      primaryReason = `Section 75 protection on £${tillContext.amountGbp.toFixed(0)} purchase`;
    } else {
      primaryReason = `Best earn rate: ${earnRate}× ${card.earn_currency}`;
    }

    if (earnRate > 1) {
      secondaryReasons.push(`Earns ${earnRate}× ${card.earn_currency} on this category`);
    }
    if (section75Applies && primaryReason !== `Section 75 protection on £${tillContext.amountGbp.toFixed(0)} purchase`) {
      secondaryReasons.push(`Section 75 protection applies`);
    }
    if (voucherProgress !== undefined && voucherProgress < 1 && voucherProgress > 0.7) {
      const remaining = card.voucher!.spend_threshold_gbp - uc.current_year_spend_gbp;
      secondaryReasons.push(`£${remaining.toFixed(0)} away from ${card.voucher!.name}`);
    }
    if (fxWarning) {
      secondaryReasons.push(`Note: ${card.fx_fee_pct}% FX fee applies`);
    }

    recommendations.push({
      userCard: uc,
      card,
      score,
      primaryReason,
      secondaryReasons,
      earnRate,
      section75Applies,
      fxWarning,
      voucherProgress,
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

export default function TillScreen() {
  const { user } = useAuth();
  const { userCards } = useUserCards(user?.id);

  const [acceptsAmex, setAcceptsAmex] = useState(true);
  const [category, setCategory] = useState<MerchantCategory>('default');
  const [amountStr, setAmountStr] = useState('');
  const [isForeignCurrency, setIsForeignCurrency] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const amountGbp = parseFloat(amountStr) || 0;

  const tillContext: TillContext = {
    acceptsAmex,
    category,
    amountGbp,
    isForeignCurrency,
  };

  const recommendations = useMemo(
    () => rankCards(tillContext, userCards),
    [userCards, acceptsAmex, category, amountGbp, isForeignCurrency]
  );

  const section75Check = useMemo(() => {
    if (amountGbp < 100) return null;
    const hasS75Card = recommendations.some((r) => r.card.section_75);
    return checkSection75(amountGbp, paymentMethod, hasS75Card);
  }, [amountGbp, paymentMethod, recommendations]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#F9FAFB', fontSize: 26, fontWeight: '800' }}>At-the-Till Advisor</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 2 }}>Works offline · Real-time card ranking</Text>
        </View>

        {/* Amount input */}
        <View style={{ backgroundColor: '#141420', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1C1C2E' }}>
          <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 }}>
            PURCHASE AMOUNT
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#F9FAFB', fontSize: 28, fontWeight: '700', marginRight: 4 }}>£</Text>
            <TextInput
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="0.00"
              placeholderTextColor="#4B5563"
              keyboardType="decimal-pad"
              style={{
                flex: 1,
                color: '#F9FAFB',
                fontSize: 28,
                fontWeight: '700',
              }}
            />
          </View>
          {amountGbp >= 100 && amountGbp <= 30000 && (
            <Badge label="Section 75 may apply" color="indigo" size="sm" style={{ marginTop: 8 }} />
          )}
        </View>

        {/* Merchant category */}
        <View style={{ backgroundColor: '#141420', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1C1C2E' }}>
          <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 12 }}>
            MERCHANT CATEGORY
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
              {MERCHANT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={{
                    backgroundColor: category === cat.id ? '#6366F1' : '#0A0A0F',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: category === cat.id ? '#6366F1' : '#1C1C2E',
                    minWidth: 70,
                  }}
                >
                  <Text style={{ fontSize: 18, marginBottom: 2 }}>{cat.emoji}</Text>
                  <Text style={{
                    color: category === cat.id ? '#FFFFFF' : '#9CA3AF',
                    fontSize: 10,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Toggles */}
        <View style={{ backgroundColor: '#141420', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1C1C2E', gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F9FAFB', fontSize: 14, fontWeight: '600' }}>Merchant accepts Amex</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>Toggle off for small shops, markets</Text>
            </View>
            <Switch
              value={acceptsAmex}
              onValueChange={setAcceptsAmex}
              trackColor={{ false: '#374151', true: '#6366F1' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={{ height: 1, backgroundColor: '#1C1C2E' }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F9FAFB', fontSize: 14, fontWeight: '600' }}>Foreign currency purchase</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>Overseas or foreign-currency transaction</Text>
            </View>
            <Switch
              value={isForeignCurrency}
              onValueChange={setIsForeignCurrency}
              trackColor={{ false: '#374151', true: '#6366F1' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Payment method selector (for S75 check) */}
        {amountGbp >= 100 && (
          <TouchableOpacity
            onPress={() => setShowPaymentMethods(!showPaymentMethods)}
            style={{ backgroundColor: '#141420', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1C1C2E' }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>
                  PAYMENT METHOD (S.75 CHECK)
                </Text>
                <Text style={{ color: '#F9FAFB', fontSize: 14, fontWeight: '600', marginTop: 4 }}>
                  {getPaymentMethodLabel(paymentMethod)}
                </Text>
              </View>
              <Text style={{ color: '#6B7280', fontSize: 18 }}>{showPaymentMethods ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {showPaymentMethods && amountGbp >= 100 && (
          <View style={{ backgroundColor: '#141420', borderRadius: 16, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#1C1C2E', gap: 8 }}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method}
                onPress={() => { setPaymentMethod(method); setShowPaymentMethods(false); }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 10,
                  backgroundColor: paymentMethod === method ? '#6366F115' : 'transparent',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: paymentMethod === method ? '#6366F140' : 'transparent',
                }}
              >
                <View style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: paymentMethod === method ? '#6366F1' : '#4B5563',
                  marginRight: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {paymentMethod === method && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' }} />
                  )}
                </View>
                <Text style={{ color: paymentMethod === method ? '#F9FAFB' : '#9CA3AF', fontSize: 14 }}>
                  {getPaymentMethodLabel(method)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Section 75 warning */}
        {section75Check && (
          <View style={{
            backgroundColor: section75Check.protected ? '#10B98115' : '#EF444415',
            borderRadius: 14,
            padding: 14,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: section75Check.protected ? '#10B98130' : '#EF444430',
          }}>
            <Text style={{
              color: section75Check.protected ? '#10B981' : '#EF4444',
              fontSize: 13,
              fontWeight: '700',
              marginBottom: 6,
            }}>
              {section75Check.protected ? '✓ Section 75 Protected' : '⚠ Section 75 Does NOT Apply'}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 18 }}>
              {section75Check.reason}
            </Text>
            {section75Check.tip && (
              <Text style={{ color: '#6366F1', fontSize: 12, marginTop: 6, lineHeight: 16 }}>
                💡 {section75Check.tip}
              </Text>
            )}
          </View>
        )}

        {/* Card recommendations */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: '#F9FAFB', fontSize: 17, fontWeight: '700', marginBottom: 12 }}>
            {recommendations.length > 0
              ? `Card Rankings (${recommendations.length})`
              : 'No cards available'}
          </Text>

          {userCards.length === 0 ? (
            <View style={{ backgroundColor: '#141420', borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1C1C2E' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>💳</Text>
              <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>No cards in vault</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center' }}>
                Add cards to your vault to get recommendations here.
              </Text>
            </View>
          ) : recommendations.length === 0 ? (
            <View style={{ backgroundColor: '#EF444415', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#EF444430' }}>
              <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>No cards accepted here</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
                All your cards are Amex but this merchant doesn't accept Amex. Consider adding a Visa or Mastercard.
              </Text>
            </View>
          ) : (
            recommendations.map((rec, i) => (
              <TillCard key={rec.userCard.id} recommendation={rec} rank={i + 1} />
            ))
          )}
        </View>

        {/* Info */}
        <View style={{ backgroundColor: '#141420', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1C1C2E' }}>
          <Text style={{ color: '#9CA3AF', fontSize: 12, lineHeight: 18 }}>
            Rankings are based on earn rate for the selected category, Section 75 protection, FX fees, and voucher threshold progress. Works offline.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
