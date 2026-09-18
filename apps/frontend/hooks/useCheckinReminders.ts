import { useEffect, useState } from "react";

import { useAppPreferences } from "@/components/contexts/AppPreferencesProvider";
import {
  cancelDailyReminder,
  requestReminderPermission,
  scheduleDailyReminder,
} from "@/lib/checkin-reminders";

// Keeps the OS's scheduled notification in sync with the user's
// reminders preference - call this once, high in the tree (see
// app/_layout.tsx), so it's active app-wide rather than only while the
// preferences screen happens to be mounted.
export function useCheckinReminders() {
  const { remindersEnabled, reminderTime } = useAppPreferences();

  // Surfaced so the preferences screen can show a hint instead of the
  // toggle silently doing nothing when the OS permission is denied.
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    // Defined inline (not as an outer useCallback) so this effect's own
    // async work stays inside this one function - see FinanceProvider's
    // and VehicleProvider's similar effects earlier in this project for
    // why that structure matters here.
    void (async () => {
      if (!remindersEnabled) {
        await cancelDailyReminder();
        setPermissionDenied(false);
        return;
      }

      const granted = await requestReminderPermission();
      setPermissionDenied(!granted);

      if (granted) {
        await scheduleDailyReminder(reminderTime);
      }
    })();
  }, [remindersEnabled, reminderTime]);

  return { permissionDenied };
}
