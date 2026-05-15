import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useUserCards } from '../../hooks/useUserCards';
import { useBenefits } from '../../hooks/useBenefits';
import { BenefitRow } from '../../components/BenefitRow';
import { BonusProgress } from '../../components/BonusProgress';
import { Button } from '../../components/ui/Button';
import type { BenefitState } from '../../types';

type FilterTab = 'all' | 'urgent' | 'monthly' | 'half_yearly' | 'annual';

export default function CalendarScreen() {
  const { user } = useAuth();
  const { userCards, signUpBonuses, loading, refetch } = useUserCards(user?.id);
  const { benefitStates, markBenefitUsed, loading: benefitsLoading } = useBenefits(user?.id, userCards);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [markModalVisible, setMarkModalVisible] = useState(false);
  const [selectedBenefitState, setSelectedBenefitState] = useState<BenefitState | null>(null);
  const [usedAmountInput, setUsedAmountInput] = useState('');

  const filteredBenefits = useMemo(() => {
    let filtered = [...benefitStates];

    if (filterTab === 'urgent') {
      filtered = filtered.filter((bs) => bs.urgency !== 'green' && bs.remainingGbp > 0);
    } else if (filterTab !== 'all') {
      filtered = filtered.filter((bs) => bs.benefit.reset_type === filterTab);
    }

    // Sort: red > amber > green, then by days remaining asc
    return filtered.sort((a, b) => {
      const urgencyOrder = { red: 0, amber: 1, green: 2 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return a.daysUntilReset - b.daysUntilReset;
    });
  }, [benefitStates, filterTab]);

  const urgentCount = useMemo(
    () => benefitStates.filter((bs) => bs.urgency !== 'green' && bs.remainingGbp > 0).length,
    [benefitStates]
  );

  const activeBonuses = useMemo(
    () => signUpBonuses.filter((b) => !b.claimed),
    [signUpBonuses]
  );

  function openMarkModal(state: BenefitState) {
    setSelectedBenefitState(state);
    setUsedAmountInput(String(state.usedGbp));
    setMarkModalVisible(true);
  }

  async function handleMarkUsed() {
    if (!selectedBenefitState) return;
    const amount = parseFloat(usedAmountInput);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount in GBP.');
      return;
    }
    try {
      await markBenefitUsed(
        selectedBenefitState.userCardId,
        selectedBenefitState.benefit.id,
        amount,
        selectedBenefitState.benefit.reset_type
      );
      setMarkModalVisible(false);
      setSelectedBenefitState(null);
    } catch {
      Alert.alert('Error', 'Failed to update benefit. Please try again.');
    }
  }

  const tabs: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: benefitStates.length },
    { id: 'urgent', label: '⚡ Urgent', count: urgentCount },
    { id: 'monthly', label: 'Monthly' },
    { id: 'half_yearly', label: 'Half-yearly' },
    { id: 'annual', label: 'Annual' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={{ color: '#F9FAFB', fontSize: 26, fontWeight: '800' }}>Benefits Calendar</Text>
        <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 2 }}>
          Track and use your credits before they reset
        </Text>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 8, gap: 8 }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setFilterTab(tab.id)}
            style={{
              backgroundColor: filterTab === tab.id ? '#6366F1' : '#141420',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: filterTab === tab.id ? '#6366F1' : '#1C1C2E',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{
              color: filterTab === tab.id ? '#FFFFFF' : '#9CA3AF',
              fontSize: 13,
              fontWeight: filterTab === tab.id ? '700' : '400',
            }}>
              {tab.label}
            </Text>
            {tab.count !== undefined && tab.count > 0 && (
              <View style={{
                backgroundColor: filterTab === tab.id ? 'rgba(255,255,255,0.25)' : '#1C1C2E',
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}>
                <Text style={{
                  color: filterTab === tab.id ? '#FFFFFF' : '#9CA3AF',
                  fontSize: 11,
                  fontWeight: '700',
                }}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={loading || benefitsLoading}
            onRefresh={refetch}
            tintColor="#6366F1"
          />
        }
      >
        {filteredBenefits.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
            <Text style={{ color: '#F9FAFB', fontSize: 17, fontWeight: '700', marginBottom: 6 }}>
              {filterTab === 'urgent' ? 'No urgent benefits' : 'No benefits to show'}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center' }}>
              {filterTab === 'urgent'
                ? 'All your benefits are well within their reset window.'
                : 'Add cards with benefits to see them here.'}
            </Text>
          </View>
        ) : (
          filteredBenefits.map((bs) => (
            <BenefitRow
              key={`${bs.userCardId}-${bs.benefit.id}`}
              state={bs}
              onMarkUsed={openMarkModal}
            />
          ))
        )}

        {/* Sign-up bonuses section */}
        {activeBonuses.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: '#F9FAFB', fontSize: 17, fontWeight: '700', marginBottom: 12 }}>
              🎯 Sign-up Bonus Progress
            </Text>
            {activeBonuses.map((bonus) => (
              <BonusProgress key={bonus.id} bonus={bonus} />
            ))}
          </View>
        )}

        {/* Info box */}
        <View style={{ backgroundColor: '#141420', borderRadius: 14, padding: 16, marginTop: 24, borderWidth: 1, borderColor: '#1C1C2E' }}>
          <Text style={{ color: '#F9FAFB', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>
            Reset schedule
          </Text>
          <View style={{ gap: 6 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
              🔴 Monthly credits (e.g. Deliveroo) reset on the 1st of each month
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
              🟡 Half-yearly credits reset on 30 June and 31 December
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
              🟢 Annual credits reset on 31 December
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Mark Used Modal */}
      <Modal visible={markModalVisible} animationType="slide" presentationStyle="formSheet">
        {selectedBenefitState && (
          <View style={{ flex: 1, backgroundColor: '#0A0A0F', padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: '#F9FAFB', fontSize: 20, fontWeight: '800' }}>Update Usage</Text>
              <TouchableOpacity onPress={() => setMarkModalVisible(false)}>
                <Text style={{ color: '#9CA3AF', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#F9FAFB', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
              {selectedBenefitState.benefit.name}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 24 }}>
              {selectedBenefitState.cardName} · Period: {selectedBenefitState.periodKey}
            </Text>

            <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 8 }}>
              How much have you used? (out of £{selectedBenefitState.benefit.value_gbp})
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 18 }}>£</Text>
              <TextInput
                value={usedAmountInput}
                onChangeText={setUsedAmountInput}
                keyboardType="decimal-pad"
                style={{
                  flex: 1,
                  backgroundColor: '#141420',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: '#F9FAFB',
                  fontSize: 22,
                  fontWeight: '700',
                  borderWidth: 1,
                  borderColor: '#1C1C2E',
                }}
                autoFocus
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {[0, selectedBenefitState.benefit.value_gbp / 2, selectedBenefitState.benefit.value_gbp].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setUsedAmountInput(String(val))}
                  style={{
                    flex: 1,
                    backgroundColor: '#141420',
                    borderRadius: 10,
                    padding: 10,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#1C1C2E',
                  }}
                >
                  <Text style={{ color: '#818CF8', fontSize: 14, fontWeight: '600' }}>£{val}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Save" onPress={handleMarkUsed} size="lg" />
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}
