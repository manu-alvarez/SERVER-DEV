/**
 * Haptic feedback utility — uses the Vibration API when available.
 * @param {number} duration - Duration in milliseconds
 */
export function vibrate(duration = 50) {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
}