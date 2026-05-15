import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { BenefitState } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleBenefitExpiryNotifications(
  benefitStates: BenefitState[]
): Promise<void> {
  // Cancel existing benefit notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'benefit_expiry') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  const urgent = benefitStates.filter(
    (bs) => bs.urgency !== 'green' && bs.remainingGbp > 0 && bs.daysUntilReset > 0
  );

  for (const bs of urgent) {
    const triggerDate = new Date();
    triggerDate.setHours(9, 0, 0, 0); // 9am today

    if (triggerDate < new Date()) {
      // Schedule for tomorrow 9am
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${bs.benefit.name} expiring soon`,
        body: `£${bs.remainingGbp.toFixed(0)} remaining on your ${bs.cardName}. Resets in ${bs.daysUntilReset} day${bs.daysUntilReset === 1 ? '' : 's'}.`,
        data: { type: 'benefit_expiry', benefitId: bs.benefit.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  }
}

export async function scheduleSignUpBonusReminder(
  cardName: string,
  bonusCurrency: string,
  bonusPoints: number,
  deadlineDate: string,
  currentSpend: number,
  targetSpend: number
): Promise<void> {
  const deadline = new Date(deadlineDate);
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86400000);

  if (daysLeft <= 14 && daysLeft > 0) {
    const triggerDate = new Date();
    triggerDate.setHours(10, 0, 0, 0);
    if (triggerDate < new Date()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Sign-up bonus deadline: ${cardName}`,
        body: `${daysLeft} days left to earn ${bonusPoints.toLocaleString()} ${bonusCurrency}. Spend £${(targetSpend - currentSpend).toFixed(0)} more.`,
        data: { type: 'sign_up_bonus' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  }
}
