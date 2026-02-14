import * as Haptics from 'expo-haptics';

/** Light tap — list items, toggles, minor interactions */
export async function lightImpact() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silently fail on web/simulator
  }
}

/** Medium tap — button presses, navigation actions */
export async function mediumImpact() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Silently fail on web/simulator
  }
}

/** Success buzz — clock in/out, form submit, completion */
export async function successNotification() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silently fail on web/simulator
  }
}

/** Error buzz — validation failures, errors */
export async function errorNotification() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Silently fail on web/simulator
  }
}
