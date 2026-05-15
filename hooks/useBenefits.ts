import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { computeBenefitStates, getPeriodKey } from '../data/benefits';
import type { BenefitUtilisation, BenefitState, UserCard } from '../types';

// Demo utilisations
const DEMO_UTILISATIONS: BenefitUtilisation[] = [
  {
    id: 'util-1',
    user_id: 'demo',
    user_card_id: 'demo-1',
    benefit_id: 'plat-dining-h1',
    period_key: '2026-H1',
    used_gbp: 65,
    used_at: '2026-04-10T12:00:00Z',
    created_at: '2026-04-10T12:00:00Z',
  },
  {
    id: 'util-2',
    user_id: 'demo',
    user_card_id: 'demo-1',
    benefit_id: 'plat-deliveroo',
    period_key: '2026-05',
    used_gbp: 5,
    used_at: '2026-05-02T18:00:00Z',
    created_at: '2026-05-02T18:00:00Z',
  },
  {
    id: 'util-3',
    user_id: 'demo',
    user_card_id: 'demo-1',
    benefit_id: 'plat-travel-credit',
    period_key: '2026',
    used_gbp: 120,
    used_at: '2026-03-15T10:00:00Z',
    created_at: '2026-03-15T10:00:00Z',
  },
];

export function useBenefits(userId: string | null | undefined, userCards: UserCard[]) {
  const [utilisations, setUtilisations] = useState<BenefitUtilisation[]>([]);
  const [benefitStates, setBenefitStates] = useState<BenefitState[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUtilisations = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      setUtilisations(DEMO_UTILISATIONS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('benefit_utilisations')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setUtilisations(data ?? []);
    } catch (err) {
      console.warn('Failed to fetch utilisations:', err);
      setUtilisations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUtilisations();
  }, [fetchUtilisations]);

  useEffect(() => {
    const states = computeBenefitStates(userCards, utilisations);
    setBenefitStates(states);
  }, [userCards, utilisations]);

  const markBenefitUsed = useCallback(
    async (userCardId: string, benefitId: string, amountGbp: number, resetType: string): Promise<void> => {
      const periodKey = getPeriodKey(resetType);

      if (!isSupabaseConfigured || !userId) {
        setUtilisations((prev) => {
          const existing = prev.find(
            (u) => u.user_card_id === userCardId && u.benefit_id === benefitId && u.period_key === periodKey
          );
          if (existing) {
            return prev.map((u) =>
              u.id === existing.id ? { ...u, used_gbp: amountGbp } : u
            );
          }
          return [
            ...prev,
            {
              id: `util-${Date.now()}`,
              user_id: 'demo',
              user_card_id: userCardId,
              benefit_id: benefitId,
              period_key: periodKey,
              used_gbp: amountGbp,
              used_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
          ];
        });
        return;
      }

      const { error } = await supabase
        .from('benefit_utilisations')
        .upsert({
          user_id: userId,
          user_card_id: userCardId,
          benefit_id: benefitId,
          period_key: periodKey,
          used_gbp: amountGbp,
          used_at: new Date().toISOString(),
        });

      if (error) throw error;
      await fetchUtilisations();
    },
    [userId, fetchUtilisations]
  );

  return {
    utilisations,
    benefitStates,
    loading,
    refetch: fetchUtilisations,
    markBenefitUsed,
  };
}
