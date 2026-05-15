export interface LoyaltyProgramme {
  id: string;
  name: string;
  type: 'airline' | 'hotel' | 'cashback' | 'flexible' | 'retail';
  valuePencePer1000: number; // estimated value in pence per 1000 points
  transferPartners?: string[];
  color: string;
}

export const LOYALTY_PROGRAMMES: LoyaltyProgramme[] = [
  {
    id: 'MR',
    name: 'Amex Membership Rewards',
    type: 'flexible',
    valuePencePer1000: 1000, // ~1p per point
    transferPartners: ['Avios', 'Virgin Points', 'Marriott Bonvoy', 'Hilton Honors'],
    color: '#006FCF',
  },
  {
    id: 'Avios',
    name: 'Avios (British Airways)',
    type: 'airline',
    valuePencePer1000: 1100, // ~1.1p per Avios
    transferPartners: ['Iberia Plus', 'Aer Lingus', 'Qatar Airways'],
    color: '#075AAA',
  },
  {
    id: 'Virgin Points',
    name: 'Virgin Atlantic Flying Club',
    type: 'airline',
    valuePencePer1000: 1000,
    transferPartners: ['Delta SkyMiles', 'Hilton Honors', 'Marriott Bonvoy'],
    color: '#E10014',
  },
  {
    id: 'HSBC Points',
    name: 'HSBC Rewards',
    type: 'flexible',
    valuePencePer1000: 500,
    transferPartners: ['Avios', 'Virgin Points', 'Asia Miles'],
    color: '#DB0011',
  },
  {
    id: 'Nectar',
    name: 'Nectar Points',
    type: 'retail',
    valuePencePer1000: 500, // 0.5p per point
    transferPartners: ['Avios'],
    color: '#FF7300',
  },
  {
    id: 'Cashback',
    name: 'Cashback',
    type: 'cashback',
    valuePencePer1000: 1000, // 1p = 1p
    color: '#10B981',
  },
  {
    id: 'JL Vouchers',
    name: 'John Lewis Vouchers',
    type: 'retail',
    valuePencePer1000: 1000,
    color: '#3B3B3B',
  },
  {
    id: 'Marriott Bonvoy',
    name: 'Marriott Bonvoy',
    type: 'hotel',
    valuePencePer1000: 700,
    color: '#8B2131',
  },
  {
    id: 'Hilton Honors',
    name: 'Hilton Honors',
    type: 'hotel',
    valuePencePer1000: 400,
    color: '#003580',
  },
];

export interface TransferBonus {
  id: string;
  from: string;
  to: string;
  bonusPct: number;
  startDate: string;
  endDate: string;
  sourceUrl?: string;
}

export function getProgrammeById(id: string): LoyaltyProgramme | undefined {
  return LOYALTY_PROGRAMMES.find((p) => p.id === id);
}

export function estimateValue(programme: string, points: number): number {
  const prog = getProgrammeById(programme);
  if (!prog) return 0;
  return (points * prog.valuePencePer1000) / 100000; // in GBP
}

/**
 * Mock transfer bonuses — in production these come from the DB.
 */
export const DEMO_TRANSFER_BONUSES: TransferBonus[] = [
  {
    id: 'demo-1',
    from: 'MR',
    to: 'Avios',
    bonusPct: 30,
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    sourceUrl: 'https://www.americanexpress.com/uk',
  },
];
