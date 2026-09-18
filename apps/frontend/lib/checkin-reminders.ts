// Plain functions rather than a hook, so the scheduling logic is
// reusable and testable independent of React - hooks/useCheckinReminders.ts
// is the thin React wrapper that calls these from an effect.

// The reminder time is stored/passed around as "HH:mm" (24-hour,
// zero-padded) everywhere in the app - simpler to persist, validate, and
// display than a Date object, since there's no date component to it.
export const DEFAULT_REMINDER_TIME = "18:00";

const REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Single source of truth for what counts as a valid "HH:mm" string -
// reused by AppPreferencesProvider's persisted-state validator so the
// format is only defined once.
export function isValidReminderTime(value: unknown): value is string {
  return typeof value === "string" && REMINDER_TIME_PATTERN.test(value);
}

function parseReminderTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

// A fixed identifier for the one reminder ThinkTwice ever schedules, so
// re-scheduling (a new time, or toggling off then on) can find and
// replace the previous one instead of stacking up duplicates.
const REMINDER_NOTIFICATION_ID = "thinktwice.checkin-reminder";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: Promise<NotificationsModule | null> | null = null;

// expo-notifications must be imported lazily, not at this file's top
// level: merely importing it runs the package's own module-level native
// setup, which throws immediately in Expo Go on Android (push/remote
// notification support was removed there in SDK 53 - see
// https://docs.expo.dev/develop/development-builds/introduction/). A
// static top-level import crashed the entire app before any screen
// could render, since this file is imported from
// AppPreferencesProvider, which every screen depends on. Loading it on
// first use, and catching the failure, means reminders simply don't
// work in that environment instead of taking the whole app down with
// them - the same feature runs fine in a real dev/production build.
function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (!notificationsModule) {
    notificationsModule = import("expo-notifications")
      .then((module) => {
        // Show the notification banner even while the app is open -
        // otherwise a reminder that fires while ThinkTwice happens to
        // be in the foreground would be silently dropped instead of shown.
        module.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });

        return module;
      })
      .catch(() => null);
  }

  return notificationsModule;
}

// Asks the OS for notification permission. Returns whether it was
// granted, so callers can show an in-app hint instead of silently
// failing to schedule anything. Also returns false (rather than
// throwing) when expo-notifications itself isn't usable in the current
// environment - see loadNotificationsModule's comment.
export async function requestReminderPermission(): Promise<boolean> {
  const notifications = await loadNotificationsModule();

  if (!notifications) {
    return false;
  }

  const existing = await notifications.getPermissionsAsync();

  if (existing.granted) {
    return true;
  }

  const requested = await notifications.requestPermissionsAsync();
  return requested.granted;
}

// Schedules (or reschedules) the one daily check-in reminder. Cancels
// any previous reminder first since expo-notifications would otherwise
// happily schedule a second, duplicate notification rather than
// replacing the first when the time changes. A no-op if
// expo-notifications isn't usable in the current environment.
export async function scheduleDailyReminder(time: string): Promise<void> {
  const notifications = await loadNotificationsModule();

  if (!notifications) {
    return;
  }

  await cancelDailyReminder();

  const { hour, minute } = parseReminderTime(time);

  await notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: "Check-in time",
      body: "Log today's fuel, spending, or miles to keep your forecast accurate.",
    },
    trigger: {
      type: notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// Cancels the scheduled reminder - used both when the user turns the
// toggle off, and internally before every reschedule above. A no-op if
// expo-notifications isn't usable in the current environment.
export async function cancelDailyReminder(): Promise<void> {
  const notifications = await loadNotificationsModule();

  if (!notifications) {
    return;
  }

  await notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
}
