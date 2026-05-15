export type PaymentMethod =
  | 'credit_card'
  | 'paypal'
  | 'curve'
  | 'klarna'
  | 'debit_card'
  | 'bank_transfer'
  | 'apple_pay_credit'
  | 'google_pay_credit';

export interface Section75Check {
  protected: boolean;
  reason: string;
  tip?: string;
}

/**
 * Section 75 of the Consumer Credit Act 1974
 * Protects purchases between £100 and £30,000 made DIRECTLY on a UK credit card.
 * Key exclusions: PayPal, Curve, Klarna (third-party payment processors break the link).
 * Apple/Google Pay using an underlying credit card DOES qualify.
 */
export function checkSection75(
  amountGbp: number,
  paymentMethod: PaymentMethod,
  hasSection75Card: boolean
): Section75Check {
  if (!hasSection75Card) {
    return {
      protected: false,
      reason: 'None of your selected cards have Section 75 protection.',
    };
  }

  if (amountGbp < 100) {
    return {
      protected: false,
      reason: `Purchase is under £100 (Section 75 minimum is £100).`,
      tip: 'Consider chargeback rights as an alternative — these apply to any amount on a credit card.',
    };
  }

  if (amountGbp > 30000) {
    return {
      protected: false,
      reason: `Purchase exceeds £30,000 (Section 75 maximum).`,
      tip: 'Split purchases or use a different protection method.',
    };
  }

  const unsupportedMethods: PaymentMethod[] = ['paypal', 'curve', 'klarna', 'debit_card', 'bank_transfer'];
  if (unsupportedMethods.includes(paymentMethod)) {
    const methodNames: Record<string, string> = {
      paypal: 'PayPal',
      curve: 'Curve',
      klarna: 'Klarna',
      debit_card: 'a debit card',
      bank_transfer: 'bank transfer',
    };

    return {
      protected: false,
      reason: `Section 75 does NOT apply when paying via ${methodNames[paymentMethod]}.`,
      tip: 'Pay directly with your credit card to get Section 75 protection on this £${amountGbp.toFixed(0)} purchase.',
    };
  }

  return {
    protected: true,
    reason: `This purchase qualifies for Section 75 protection (£${amountGbp.toFixed(0)} paid directly by credit card).`,
    tip: 'Keep your card statement as proof of purchase.',
  };
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    credit_card: 'Direct Credit Card',
    paypal: 'PayPal',
    curve: 'Curve',
    klarna: 'Klarna',
    debit_card: 'Debit Card',
    bank_transfer: 'Bank Transfer',
    apple_pay_credit: 'Apple Pay (Credit)',
    google_pay_credit: 'Google Pay (Credit)',
  };
  return labels[method];
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  'credit_card',
  'apple_pay_credit',
  'google_pay_credit',
  'paypal',
  'curve',
  'klarna',
  'debit_card',
];
