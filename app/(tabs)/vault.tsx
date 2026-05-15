import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { useUserCards } from '../../hooks/useUserCards';
import { CardVaultItem } from '../../components/CardVaultItem';
import { Button } from '../../components/ui/Button';
import { CARD_DATABASE } from '../../data/cards';
import { calculateROI } from '../../data/benefits';
import type { UserCard } from '../../types';

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

export default function VaultScreen() {
  const { user } = useAuth();
  const { userCards, loading, refetch, addCard, removeCard, updateSpend } = useUserCards(user?.id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [spendInput, setSpendInput] = useState('');
  const [addingCard, setAddingCard] = useState(false);

  const ownedCardIds = useMemo(() => new Set(userCards.map((uc) => uc.card_id)), [userCards]);

  async function handleRemove(id: string) {
    Alert.alert(
      'Remove card',
      'Remove this card from your vault? This will also remove tracked benefits.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCard(id);
            } catch {
              Alert.alert('Error', 'Failed to remove card. Please try again.');
            }
          },
        },
      ]
    );
  }

  async function handleAdd(cardId: string) {
    setAddingCard(true);
    try {
      await addCard(cardId);
      setShowAddModal(false);
    } catch {
      Alert.alert('Error', 'Failed to add card. Please try again.');
    } finally {
      setAddingCard(false);
    }
  }

  async function handleUpdateSpend() {
    if (!selectedCard) return;
    const spend = parseFloat(spendInput);
    if (isNaN(spend) || spend < 0) {
      Alert.alert('Invalid amount', 'Please enter a valid spend amount.');
      return;
    }
    try {
      await updateSpend(selectedCard.id, spend);
      setShowDetailModal(false);
      setSelectedCard(null);
    } catch {
      Alert.alert('Error', 'Failed to update spend.');
    }
  }

  function openDetail(uc: UserCard) {
    setSelectedCard(uc);
    setSpendInput(String(uc.current_year_spend_gbp));
    setShowDetailModal(true);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 }}>
        <View>
          <Text style={{ color: '#F9FAFB', fontSize: 26, fontWeight: '800' }}>Card Vault</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 2 }}>
            {userCards.length} card{userCards.length !== 1 ? 's' : ''} · Tap to view details
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={{
            backgroundColor: '#6366F1',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 22 }}>+</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#6366F1" />
        }
      >
        {userCards.length === 0 && !loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💳</Text>
            <Text style={{ color: '#F9FAFB', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>No cards yet</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
              Add your UK credit cards to start getting personalised advice.
            </Text>
            <Button title="Add a card" onPress={() => setShowAddModal(true)} />
          </View>
        ) : (
          <>
            {userCards.map((uc) => (
              <CardVaultItem
                key={uc.id}
                userCard={uc}
                onRemove={handleRemove}
                onPress={openDetail}
                style={{ marginBottom: 16 }}
              />
            ))}

            {/* ROI Summary */}
            <View style={{ backgroundColor: '#141420', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1C1C2E', marginTop: 8 }}>
              <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '700', marginBottom: 14 }}>
                Annual Fee ROI Summary
              </Text>
              {userCards.map((uc) => {
                const card = uc.definition;
                if (!card || card.annual_fee_gbp === 0) return null;
                const roi = calculateROI(uc);
                return (
                  <View key={uc.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1C1C2E' }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 13, flex: 1 }} numberOfLines={1}>
                      {card.name}
                    </Text>
                    <Text style={{ color: roi.isWorthKeeping ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: '700' }}>
                      {roi.netValue >= 0 ? '+' : ''}£{roi.netValue.toFixed(0)}
                    </Text>
                  </View>
                );
              })}
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 12, lineHeight: 18 }}>
                Net values based on listed benefits. Actual value depends on whether you use all benefits.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Card Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: '#F9FAFB', fontSize: 20, fontWeight: '800' }}>Add a Card</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={{ color: '#9CA3AF', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {CARD_DATABASE.map((card) => {
              const owned = ownedCardIds.has(card.id);
              const gradient = getCardGradient(card.issuer);
              return (
                <TouchableOpacity
                  key={card.id}
                  onPress={() => !owned && handleAdd(card.id)}
                  disabled={owned || addingCard}
                  activeOpacity={0.8}
                  style={{ marginBottom: 10, opacity: owned ? 0.5 : 1 }}
                >
                  <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center' }}
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
                    {owned ? (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Added</Text>
                      </View>
                    ) : (
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', lineHeight: 26 }}>+</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Card Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
        {selectedCard && selectedCard.definition && (
          <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
              <Text style={{ color: '#F9FAFB', fontSize: 20, fontWeight: '800' }}>Card Details</Text>
              <TouchableOpacity onPress={() => { setShowDetailModal(false); setSelectedCard(null); }}>
                <Text style={{ color: '#9CA3AF', fontSize: 16 }}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {/* Card visual */}
              <LinearGradient
                colors={getCardGradient(selectedCard.definition.issuer)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 24, marginBottom: 20 }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
                  {selectedCard.definition.issuer.toUpperCase()}
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 6 }}>
                  {selectedCard.definition.name}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Network</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>{selectedCard.definition.network}</Text>
                  </View>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Earns</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>{selectedCard.definition.earn_currency}</Text>
                  </View>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Annual fee</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                      {selectedCard.definition.annual_fee_gbp === 0 ? 'Free' : `£${selectedCard.definition.annual_fee_gbp}`}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Earn rates */}
              <View style={{ backgroundColor: '#141420', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1C1C2E' }}>
                <Text style={{ color: '#F9FAFB', fontSize: 15, fontWeight: '700', marginBottom: 12 }}>Earn Rates</Text>
                {selectedCard.definition.earn_rates.map((rate) => (
                  <View key={rate.category} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 13, textTransform: 'capitalize' }}>
                      {rate.category.replace(/_/g, ' ')}
                    </Text>
                    <Text style={{ color: '#F9FAFB', fontSize: 13, fontWeight: '700' }}>
                      {rate.rate}× {selectedCard.definition!.earn_currency}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Update spend */}
              <View style={{ backgroundColor: '#141420', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1C1C2E' }}>
                <Text style={{ color: '#F9FAFB', fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
                  Year-to-date spend
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 16 }}>£</Text>
                  <TextInput
                    value={spendInput}
                    onChangeText={setSpendInput}
                    keyboardType="decimal-pad"
                    style={{
                      flex: 1,
                      backgroundColor: '#0A0A0F',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: '#F9FAFB',
                      fontSize: 18,
                      fontWeight: '700',
                      borderWidth: 1,
                      borderColor: '#1C1C2E',
                    }}
                  />
                  <Button title="Update" onPress={handleUpdateSpend} size="sm" />
                </View>
                {selectedCard.definition.voucher && (
                  <View style={{ marginTop: 12, backgroundColor: '#6366F115', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#6366F130' }}>
                    <Text style={{ color: '#818CF8', fontSize: 13, fontWeight: '600' }}>
                      {selectedCard.definition.voucher.name}
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
                      Spend £{selectedCard.definition.voucher.spend_threshold_gbp.toLocaleString()} to earn.
                      Progress: {Math.min(Math.round((selectedCard.current_year_spend_gbp / selectedCard.definition.voucher.spend_threshold_gbp) * 100), 100)}%
                    </Text>
                    <View style={{ height: 4, backgroundColor: '#1C1C2E', borderRadius: 2, marginTop: 8 }}>
                      <View style={{
                        height: 4,
                        width: `${Math.min((selectedCard.current_year_spend_gbp / selectedCard.definition.voucher.spend_threshold_gbp) * 100, 100)}%`,
                        backgroundColor: '#6366F1',
                        borderRadius: 2,
                      }} />
                    </View>
                  </View>
                )}
              </View>

              {/* ROI */}
              {(() => {
                const roi = calculateROI(selectedCard);
                if (roi.annualFee === 0) return null;
                return (
                  <View style={{ backgroundColor: '#141420', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1C1C2E' }}>
                    <Text style={{ color: '#F9FAFB', fontSize: 15, fontWeight: '700', marginBottom: 12 }}>Annual ROI</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Annual fee</Text>
                      <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>-£{roi.annualFee}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Benefits value</Text>
                      <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '600' }}>+£{roi.benefitValue.toFixed(0)}</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: '#1C1C2E', marginVertical: 8 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#F9FAFB', fontSize: 14, fontWeight: '700' }}>Net value</Text>
                      <Text style={{
                        color: roi.isWorthKeeping ? '#10B981' : '#EF4444',
                        fontSize: 14,
                        fontWeight: '800',
                      }}>
                        {roi.netValue >= 0 ? '+' : ''}£{roi.netValue.toFixed(0)}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}
