import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Badge } from './ui/Badge';
import type { BenefitState } from '../types';

interface BenefitRowProps {
  state: BenefitState;
  onMarkUsed?: (state: BenefitState) => void;
}

export function BenefitRow({ state, onMarkUsed }: BenefitRowProps) {
  const { benefit, cardName, usedGbp, remainingGbp, daysUntilReset, urgency } = state;
  const totalValue = benefit.value_gbp;
  const pctUsed = totalValue > 0 ? (usedGbp / totalValue) * 100 : 0;

  const urgencyColors = {
    green: { track: '#10B98130', fill: '#10B981', text: '#10B981' },
    amber: { track: '#F59E0B30', fill: '#F59E0B', text: '#F59E0B' },
    red: { track: '#EF444430', fill: '#EF4444', text: '#EF4444' },
  };
  const colors = urgencyColors[urgency];

  const resetLabel =
    benefit.reset_type === 'monthly'
      ? `Resets in ${daysUntilReset}d`
      : benefit.reset_type === 'half_yearly'
      ? `H${state.periodKey.endsWith('H1') ? '1' : '2'} · ${daysUntilReset}d left`
      : benefit.reset_type === 'annual'
      ? `Annual · ${daysUntilReset}d left`
      : 'Permanent';

  return (
    <View style={{
      backgroundColor: '#141420',
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: urgency === 'red' ? '#EF444430' : urgency === 'amber' ? '#F59E0B30' : '#1C1C2E',
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F9FAFB', fontSize: 14, fontWeight: '600' }}>
            {benefit.name}
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
            {cardName}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '700' }}>
            £{remainingGbp.toFixed(0)}
            <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '400' }}>
              {' '}/ £{totalValue}
            </Text>
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ marginTop: 10, marginBottom: 8 }}>
        <View style={{ height: 4, backgroundColor: colors.track, borderRadius: 2 }}>
          <View
            style={{
              height: 4,
              width: `${Math.min(pctUsed, 100)}%`,
              backgroundColor: colors.fill,
              borderRadius: 2,
            }}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '500' }}>
          {resetLabel}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {urgency !== 'green' && (
            <Badge
              label={urgency === 'red' ? 'Urgent' : 'Soon'}
              color={urgency}
              size="sm"
            />
          )}
          {onMarkUsed && remainingGbp > 0 && (
            <TouchableOpacity
              onPress={() => onMarkUsed(state)}
              style={{
                backgroundColor: '#6366F120',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: '#6366F140',
              }}
            >
              <Text style={{ color: '#818CF8', fontSize: 12, fontWeight: '600' }}>
                Mark used
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
