import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCardById } from '../data/cards';
import type { UserCard, SignUpBonus, LoyaltyBalance } from '../types';

// Lazy SQLite sync — only runs on native (iOS/Android), not web
function syncOffline(cards: UserCard[]) {
  if (Platform.OS === 'web') return;
  import('../lib/sqlite').then(({ syncUserCardsToOffline }) =>
    syncUserCardsToOffline(cards).catch(console.warn)
  );
}

// Demo data for when Supabase is not configured
const DEMO_USER_CARDS: UserCard[] = [
  {
    id: 'demo-1',
    user_id: 'demo',
    card_id: 'amex-platinum',
    added_at: '2025-01-15',
    annual_fee_start_date: '2025-01-15',
    is_active: true,
    current_year_spend_gbp: 8500,
    notes: null,
    created_at: '2025-01-15T00:00:00Z',
  },
  {
    id: 'demo-2',
    user_id: 'demo',
    card_id: 'ba-amex-premium-plus',
    added_at: '2024-06-01',
    annual_fee_start_date: '2024-06-01',
    is_active: true,
    current_year_spend_gbp: 12000,
    notes: null,
    created_at: '2024-06-01T00:00:00Z',
  },
  {
    id: 'demo-3',
    user_id: 'demo',
    card_id: 'chase-uk',
    added_at: '2023-09-10',
    annual_fee_start_date: null,
    is_active: true,
    current_year_spend_gbp: 3200,
    notes: 'Use for FX',
    created_at: '2023-09-10T00:00:00Z',
  },
];

const DEMO_BONUSES: SignUpBonus[] = [
  {
    id: 'bonus-demo-1',
    user_id: 'demo',
    user_card_id: 'demo-1',
    bonus_points: 60000,
    bonus_currency: 'MR',
    spend_target_gbp: 6000,
    current_spend_gbp: 4200,
    start_date: '2025-01-15',
    deadline_date: '2025-07-15',
    claimed: false,
    created_at: '2025-01-15T00:00:00Z',
  },
];

const DEMO_BALANCES: LoyaltyBalance[] = [
  { id: 'bal-1', user_id: 'demo', programme: 'MR', balance: 125000, updated_at: new Date().toISOString() },
  { id: 'bal-2', user_id: 'demo', programme: 'Avios', balance: 88500, updated_at: new Date().toISOString() },
  { id: 'bal-3', user_id: 'demo', programme: 'Cashback', balance: 8700, updated_at: new Date().toISOString() },
];

export function useUserCards(userId?: string | null) {
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [signUpBonuses, setSignUpBonuses] = useState<SignUpBonus[]>([]);
  const [loyaltyBalances, setLoyaltyBalances] = useState<LoyaltyBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const joinDefinitions = useCallback((cards: UserCard[]): UserCard[] => {
    return cards.map((uc) => ({
      ...uc,
      definition: getCardById(uc.card_id),
    }));
  }, []);

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      const demoCards = joinDefinitions(DEMO_USER_CARDS);
      setUserCards(demoCards);
      setSignUpBonuses(DEMO_BONUSES.map((b) => ({
        ...b,
        card: demoCards.find((c) => c.id === b.user_card_id),
      })));
      setLoyaltyBalances(DEMO_BALANCES);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [cardsRes, bonusesRes, balancesRes] = await Promise.all([
        supabase
          .from('user_cards')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('sign_up_bonuses')
          .select('*')
          .eq('user_id', userId)
          .eq('claimed', false),
        supabase
          .from('loyalty_balances')
          .select('*')
          .eq('user_id', userId),
      ]);

      if (cardsRes.error) throw cardsRes.error;
      if (bonusesRes.error) throw bonusesRes.error;
      if (balancesRes.error) throw balancesRes.error;

      const cards = joinDefinitions(cardsRes.data ?? []);
      const bonuses = (bonusesRes.data ?? []).map((b: SignUpBonus) => ({
        ...b,
        card: cards.find((c) => c.id === b.user_card_id),
      }));

      setUserCards(cards);
      setSignUpBonuses(bonuses);
      setLoyaltyBalances(balancesRes.data ?? []);

      // Sync to offline SQLite (native only)
      syncOffline(cards);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [userId, joinDefinitions]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addCard = useCallback(
    async (cardId: string, feeStartDate?: string): Promise<void> => {
      if (!isSupabaseConfigured || !userId) {
        // Demo mode: add locally
        const newCard: UserCard = {
          id: `demo-${Date.now()}`,
          user_id: 'demo',
          card_id: cardId,
          added_at: new Date().toISOString().split('T')[0],
          annual_fee_start_date: feeStartDate ?? null,
          is_active: true,
          current_year_spend_gbp: 0,
          notes: null,
          created_at: new Date().toISOString(),
          definition: getCardById(cardId),
        };
        setUserCards((prev) => [newCard, ...prev]);
        return;
      }

      const { error } = await supabase.from('user_cards').insert({
        user_id: userId,
        card_id: cardId,
        added_at: new Date().toISOString().split('T')[0],
        annual_fee_start_date: feeStartDate ?? null,
      });

      if (error) throw error;
      await fetchAll();
    },
    [userId, fetchAll]
  );

  const removeCard = useCallback(
    async (userCardId: string): Promise<void> => {
      if (!isSupabaseConfigured || !userId) {
        setUserCards((prev) => prev.filter((c) => c.id !== userCardId));
        return;
      }

      const { error } = await supabase
        .from('user_cards')
        .update({ is_active: false })
        .eq('id', userCardId)
        .eq('user_id', userId);

      if (error) throw error;
      setUserCards((prev) => prev.filter((c) => c.id !== userCardId));
    },
    [userId]
  );

  const updateSpend = useCallback(
    async (userCardId: string, spendGbp: number): Promise<void> => {
      if (!isSupabaseConfigured || !userId) {
        setUserCards((prev) =>
          prev.map((c) =>
            c.id === userCardId ? { ...c, current_year_spend_gbp: spendGbp } : c
          )
        );
        return;
      }

      const { error } = await supabase
        .from('user_cards')
        .update({ current_year_spend_gbp: spendGbp })
        .eq('id', userCardId)
        .eq('user_id', userId);

      if (error) throw error;
      setUserCards((prev) =>
        prev.map((c) =>
          c.id === userCardId ? { ...c, current_year_spend_gbp: spendGbp } : c
        )
      );
    },
    [userId]
  );

  const updateBalance = useCallback(
    async (programme: string, balance: number): Promise<void> => {
      if (!isSupabaseConfigured || !userId) {
        setLoyaltyBalances((prev) => {
          const existing = prev.find((b) => b.programme === programme);
          if (existing) {
            return prev.map((b) => b.programme === programme ? { ...b, balance } : b);
          }
          return [...prev, { id: `bal-${Date.now()}`, user_id: 'demo', programme, balance, updated_at: new Date().toISOString() }];
        });
        return;
      }

      const { error } = await supabase
        .from('loyalty_balances')
        .upsert({ user_id: userId, programme, balance, updated_at: new Date().toISOString() });

      if (error) throw error;
      await fetchAll();
    },
    [userId, fetchAll]
  );

  return {
    userCards,
    signUpBonuses,
    loyaltyBalances,
    loading,
    error,
    refetch: fetchAll,
    addCard,
    removeCard,
    updateSpend,
    updateBalance,
  };
}
