// ─── Card Database Types ────────────────────────────────────────────────────

export type Network = 'AMEX' | 'Visa' | 'Mastercard';

export type ResetType = 'annual' | 'half_yearly' | 'monthly' | 'none';

export interface EarnRate {
  category: string;
  rate: number;
}

export interface Voucher {
  id: string;
  name: string;
  spend_threshold_gbp: number;
  validity_months: number;
}

export interface Benefit {
  id: string;
  name: string;
  value_gbp: number;
  reset_type: ResetType;
  reset_dates?: string[];
  description?: string;
  notes?: string;
  is_perk?: boolean;
  is_voucher?: boolean;
  requires_enroll?: boolean;
  spend_threshold?: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  issuer: string;
  network: Network;
  annual_fee_gbp: number;
  annual_fee_from_year_two?: number;
  earn_currency: string;
  earn_rates: EarnRate[];
  accepted_widely: boolean;
  fx_fee_pct: number;
  eea_zero_fx?: boolean;
  section_75: boolean;
  voucher?: Voucher;
  benefits: Benefit[];
}

// ─── Supabase / DB Types ─────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_balance_payer: boolean;
  preferred_currency: string;
  created_at: string;
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  added_at: string;
  annual_fee_start_date: string | null;
  is_active: boolean;
  current_year_spend_gbp: number;
  notes: string | null;
  created_at: string;
  // Joined
  definition?: CardDefinition;
}

export interface BenefitUtilisation {
  id: string;
  user_id: string;
  user_card_id: string;
  benefit_id: string;
  period_key: string;
  used_gbp: number;
  used_at: string | null;
  created_at: string;
}

export interface LoyaltyBalance {
  id: string;
  user_id: string;
  programme: string;
  balance: number;
  updated_at: string;
}

export interface SignUpBonus {
  id: string;
  user_id: string;
  user_card_id: string;
  bonus_points: number;
  bonus_currency: string;
  spend_target_gbp: number;
  current_spend_gbp: number;
  start_date: string;
  deadline_date: string;
  claimed: boolean;
  created_at: string;
  // Joined
  card?: UserCard;
}

export interface TransferBonusWindow {
  id: string;
  from_programme: string;
  to_programme: string;
  bonus_pct: number;
  start_date: string;
  end_date: string;
  source_url: string | null;
  created_at: string;
}

export interface MentorMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ─── App State Types ──────────────────────────────────────────────────────────

export interface BenefitState {
  benefit: Benefit;
  userCardId: string;
  cardName: string;
  periodKey: string;
  usedGbp: number;
  remainingGbp: number;
  daysUntilReset: number;
  urgency: 'green' | 'amber' | 'red';
  resetDate: Date;
}

export interface TillRecommendation {
  userCard: UserCard;
  card: CardDefinition;
  score: number;
  primaryReason: string;
  secondaryReasons: string[];
  earnRate: number;
  section75Applies: boolean;
  fxWarning: boolean;
  voucherProgress?: number;
}

export interface TillContext {
  acceptsAmex: boolean;
  category: MerchantCategory;
  amountGbp: number;
  isForeignCurrency: boolean;
  merchantName?: string;
}

export type MerchantCategory =
  | 'default'
  | 'travel'
  | 'dining'
  | 'groceries'
  | 'petrol'
  | 'online'
  | 'ba_spend'
  | 'virgin_atlantic'
  | 'amex_travel'
  | 'sainsburys'
  | 'john_lewis'
  | 'waitrose'
  | 'non_sterling';

export interface MentorContext {
  user_cards: UserCard[];
  loyalty_balances: LoyaltyBalance[];
  active_bonuses: SignUpBonus[];
  benefit_states: BenefitState[];
  transfer_bonuses: TransferBonusWindow[];
  todays_date: string;
  preferences: {
    full_balance_payer: boolean;
    preferred_currency: string;
  };
}

export interface UserPreferences {
  full_balance_payer: boolean;
  preferred_currency: string;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export interface OnboardingState {
  step: number;
  selectedCardIds: string[];
  preferences: UserPreferences;
}
