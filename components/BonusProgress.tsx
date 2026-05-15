import React from 'react';
import { View, Text } from 'react-native';
import type { SignUpBonus } from '../types';

interface BonusProgressProps {
  bonus: SignUpBonus;
}

export function BonusProgress({ bonus }: BonusProgressProps) {
  const pct = Math.min((bonus.current_spend_gbp / bonus.spend_target_gbp) * 100, 100);
  const remaining = bonus.spend_target_gbp - bonus.current_spend_gbp;
  const daysLeft = Math.ceil((new Date(bonus.deadline_date).getTime() - Date.now()) / 86400000);
  const isUrgent = daysLeft <= 14;
  const isVeryUrgent = daysLeft <= 7;
  const isComplete = pct >= 100;

  const cardName = bonus.card?.definition?.name ?? 'Card';

  const barColor = isComplete
    ? '#10B981'
    : isVeryUrgent
    ? '#EF4444'
    : isUrgent
    ? '#F59E0B'
    : '#6366F1';

  return (
    <View style={{
      backgroundColor: '#141420',
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isVeryUrgent ? '#EF444430' : isUrgent ? '#F59E0B30' : '#1C1C2E',
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F9FAFB', fontSize: 14, fontWeight: '700' }}>
            {bonus.bonus_points.toLocaleString()} {bonus.bonus_currency}
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
            {cardName}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: isUrgent ? (isVeryUrgent ? '#EF4444' : '#F59E0B') : '#9CA3AF', fontSize: 13, fontWeight: '700' }}>
            {isComplete ? '✓ Done!' : `${daysLeft}d left`}
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>
            by {new Date(bonus.deadline_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ height: 8, backgroundColor: '#1C1C2E', borderRadius: 4, marginBottom: 8 }}>
        <View style={{
          height: 8,
          width: `${pct}%`,
          backgroundColor: barColor,
          borderRadius: 4,
        }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
          £{bonus.current_spend_gbp.toFixed(0)} spent
        </Text>
        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
          {isComplete ? 'Target reached!' : `£${remaining.toFixed(0)} to go · ${Math.round(pct)}%`}
        </Text>
      </View>

      {!isComplete && isUrgent && (
        <View style={{
          backgroundColor: isVeryUrgent ? '#EF444415' : '#F59E0B15',
          borderRadius: 8,
          padding: 8,
          marginTop: 10,
        }}>
          <Text style={{ color: isVeryUrgent ? '#EF4444' : '#F59E0B', fontSize: 12, fontWeight: '600' }}>
            {isVeryUrgent
              ? `⚠ Only ${daysLeft} days left — spend £${remaining.toFixed(0)} to claim your bonus!`
              : `Spend £${remaining.toFixed(0)} in the next ${daysLeft} days to earn the bonus.`}
          </Text>
        </View>
      )}
    </View>
  );
}
