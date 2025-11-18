import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false; // Notifications not supported on web
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function scheduleSessionReminder(
  title: string,
  body: string,
  seconds: number
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: { seconds },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

// Schedule a notification for when session ends
export async function scheduleSessionEndNotification(
  durationSeconds: number,
  mode: string
): Promise<string | null> {
  return scheduleSessionReminder(
    '🎯 Session Complete!',
    `Your ${mode} session has ended. Great work!`,
    durationSeconds
  );
}

// Schedule a notification to remind user to take a break
export async function scheduleBreakReminder(
  minutesFromNow: number
): Promise<string | null> {
  return scheduleSessionReminder(
    '☕ Time for a Break',
    'You\'ve been focused for a while. Consider taking a short break!',
    minutesFromNow * 60
  );
}

// Schedule daily focus session reminder
export async function scheduleDailyFocusReminder(
  hour: number = 9,
  minute: number = 0
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧠 Ready to Focus?',
        body: 'Start your daily focus session and stay productive!',
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return null;
  }
}
