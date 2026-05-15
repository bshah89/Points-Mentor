import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge } from './ui/Badge';
import { calculateROI } from '../data/benefits';
import type { UserCard } from '../types';

interface CardVaultItemProps {
  userCard: UserCard;
  onRemove?: (id: string) => void;
  onPress?: (userCard: UserCard) => void;
  style?: ViewStyle;
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

function getNetworkBadge(network: string): string {
  const badges: Record<string, string> = {
    AMEX: 'AMEX',
    Visa: 'VISA',
    Mastercard: 'MC',
  };
  return badges[network] ?? network;
}

export function CardVaultItem({ userCard, onRemove, onPress, style }: CardVaultItemProps) {
  const card = userCard.definition;
  if (!card) return null;

  const roi = calculateROI(userCard);
  const gradient = getCardGradient(card.issuer);

  return (
    <TouchableOpacity
      onPress={() => onPress?.(userCard)}
      activeOpacity={0.85}
      style={style}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 20,
          minHeight: 140,
          justifyContent: 'space-between',
        }}
      >
        {/* Top row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>
              {card.issuer}
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 4 }} numberOfLines={2}>
              {card.name}
            </Text>
          </View>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>
              {getNetworkBadge(card.network)}
            </Text>
          </View>
        </View>

        {/* Bottom row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
              Earns {card.earn_currency}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              {card.annual_fee_gbp > 0 && (
                <Badge
                  label={`£${card.annual_fee_gbp}/yr`}
                  color={roi.isWorthKeeping ? 'green' : 'amber'}
                  size="sm"
                />
              )}
              {card.fx_fee_pct === 0 && (
                <Badge label="0% FX" color="green" size="sm" />
              )}
              {card.section_75 && (
                <Badge label="S.75" color="indigo" size="sm" />
              )}
            </View>
          </View>

          {onRemove && (
            <TouchableOpacity
              onPress={() => onRemove(userCard.id)}
              style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' }}>
                Remove
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Spend this year */}
      <View style={{
        backgroundColor: '#1C1C2E',
        borderRadius: 10,
        marginTop: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
          Spend this year
        </Text>
        <Text style={{ color: '#F9FAFB', fontSize: 13, fontWeight: '700' }}>
          £{userCard.current_year_spend_gbp.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
