import Anthropic from '@anthropic-ai/sdk';
import type { MentorContext, MentorMessage } from '../types';

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

export const anthropic = new Anthropic({
  apiKey,
  // Required for web builds — in production the native app calls the API directly
  dangerouslyAllowBrowser: true,
});

export const isAnthropicConfigured = apiKey.startsWith('sk-ant-');

const SYSTEM_PROMPT = `You are CardMentor, an expert UK credit card adviser. You help users maximise rewards, track benefits, and make smart decisions at the point of sale.

Your expertise covers:
- UK credit card rewards programmes (Avios, Membership Rewards, Virgin Points, cashback)
- Section 75 consumer protection (applies to credit card purchases £100–£30,000)
- Benefit utilisation strategies (travel credits, dining credits, lounge access)
- Sign-up bonus optimisation
- Annual fee ROI analysis
- Transfer bonus windows between loyalty programmes
- FX fees and overseas usage

Key rules:
- Always recommend users pay in full each month (unless they've indicated otherwise)
- Section 75 protection ONLY applies to direct credit card payments, NOT PayPal, Curve, or Klarna
- Amex has lower merchant acceptance than Visa/Mastercard — always note this
- Half-yearly benefits reset 30 June and 31 December
- Monthly benefits (e.g. Deliveroo) reset on the 1st of each month

Be concise, practical, and UK-focused. Use £ not $. Format responses clearly with bullet points where helpful.`;

export function buildMentorContext(ctx: MentorContext): string {
  const cards = ctx.user_cards.map((uc) => ({
    card: uc.definition?.name ?? uc.card_id,
    issuer: uc.definition?.issuer,
    network: uc.definition?.network,
    annual_fee: uc.definition?.annual_fee_gbp,
    earn_currency: uc.definition?.earn_currency,
    current_year_spend: `£${uc.current_year_spend_gbp.toFixed(2)}`,
    section_75: uc.definition?.section_75,
    fx_fee: uc.definition?.fx_fee_pct ? `${uc.definition.fx_fee_pct}%` : 'none',
  }));

  const urgentBenefits = ctx.benefit_states
    .filter((bs) => bs.urgency !== 'green' && bs.remainingGbp > 0)
    .map((bs) => ({
      benefit: bs.benefit.name,
      card: bs.cardName,
      remaining: `£${bs.remainingGbp.toFixed(2)}`,
      days_until_reset: bs.daysUntilReset,
      urgency: bs.urgency,
    }));

  const activeBonuses = ctx.active_bonuses
    .filter((b) => !b.claimed)
    .map((b) => {
      const daysLeft = Math.ceil(
        (new Date(b.deadline_date).getTime() - Date.now()) / 86400000
      );
      return {
        card: b.card?.definition?.name ?? b.user_card_id,
        bonus: `${b.bonus_points.toLocaleString()} ${b.bonus_currency}`,
        spend_progress: `£${b.current_spend_gbp.toFixed(0)} / £${b.spend_target_gbp.toFixed(0)}`,
        days_left: daysLeft,
        pct_complete: Math.round((b.current_spend_gbp / b.spend_target_gbp) * 100),
      };
    });

  const contextObj = {
    todays_date: ctx.todays_date,
    user_preferences: ctx.preferences,
    cards_in_wallet: cards,
    loyalty_balances: ctx.loyalty_balances.map((lb) => ({
      programme: lb.programme,
      balance: lb.balance.toLocaleString(),
    })),
    urgent_benefits: urgentBenefits,
    active_sign_up_bonuses: activeBonuses,
    active_transfer_bonuses: ctx.transfer_bonuses.map((tb) => ({
      from: tb.from_programme,
      to: tb.to_programme,
      bonus_pct: `+${tb.bonus_pct}%`,
      ends: tb.end_date,
    })),
  };

  return JSON.stringify(contextObj, null, 2);
}

export async function streamMentorResponse(
  messages: MentorMessage[],
  ctx: MentorContext,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  if (!isAnthropicConfigured) {
    // Demo mode — simulate streaming
    const demoResponse =
      "I'm CardMentor, your AI credit card adviser. To get personalised advice, please add your Anthropic API key to the environment configuration. In the meantime, I can see you're exploring the app — try the **At-the-Till Advisor** tab to get card recommendations without needing an API key!";
    let i = 0;
    const interval = setInterval(() => {
      if (i < demoResponse.length) {
        onChunk(demoResponse[i]);
        i++;
      } else {
        clearInterval(interval);
        onDone();
      }
    }, 20);
    return;
  }

  try {
    const contextStr = buildMentorContext(ctx);
    const systemWithContext = `${SYSTEM_PROMPT}\n\n<user_context>\n${contextStr}\n</user_context>`;

    const apiMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemWithContext,
      messages: apiMessages,
    });

    stream.on('text', (text) => {
      onChunk(text);
    });

    stream.on('finalMessage', () => {
      onDone();
    });

    stream.on('error', (err) => {
      onError(err instanceof Error ? err : new Error(String(err)));
    });
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
