import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge } from './ui/Badge';
import type { TillRecommendation } from '../types';

interface TillCardProps {
  recommendation: TillRecommendation;
  rank: number;
}

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

export function TillCard({ recommendation, rank }: TillCardProps) {
  const { card, primaryReason, secondaryReasons, earnRate, section75Applies, fxWarning, voucherProgress } = recommendation;
  const gradient = getCardGradient(card.issuer);
  const isTop = rank === 1;

  return (
    <View style={{
      marginBottom: 12,
      opacity: rank > 3 ? 0.6 : 1,
    }}>
      {isTop && (
        <View style={{
          backgroundColor: '#6366F1',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 4,
          alignSelf: 'flex-start',
          marginBottom: 6,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
            TOP PICK
          </Text>
        </View>
      )}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 18,
          borderWidth: isTop ? 2 : 0,
          borderColor: '#6366F1',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>
              {card.issuer} · {card.network}
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 3 }} numberOfLines={2}>
              {card.name}
            </Text>
          </View>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.25)',
            borderRadius: 10,
            padding: 8,
            alignItems: 'center',
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
              {earnRate}×
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>
              {card.earn_currency}
            </Text>
          </View>
        </View>

        {/* Primary reason */}
        <View style={{
          backgroundColor: 'rgba(0,0,0,0.25)',
          borderRadius: 10,
          padding: 10,
          marginTop: 12,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
            {primaryReason}
          </Text>
        </View>

        {/* Tags */}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {section75Applies && (
            <Badge label="Section 75" color="indigo" size="sm" />
          )}
          {fxWarning && (
            <Badge label="FX Fee" color="amber" size="sm" />
          )}
          {voucherProgress !== undefined && voucherProgress < 1 && (
            <Badge label={`Voucher ${Math.round(voucherProgress * 100)}%`} color="green" size="sm" />
          )}
          {card.fx_fee_pct === 0 && !fxWarning && (
            <Badge label="0% FX" color="green" size="sm" />
          )}
        </View>

        {/* Secondary reasons */}
        {secondaryReasons.length > 0 && (
          <View style={{ marginTop: 10 }}>
            {secondaryReasons.slice(0, 2).map((reason, i) => (
              <Text key={i} style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 3 }}>
                · {reason}
              </Text>
            ))}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
