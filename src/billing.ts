export const STRIPE_LIFETIME_URL = 'https://buy.stripe.com/test_4gMdRac4baKk7pC2qwgMw00';

export const LICENSE_KEY_HELP = 'After purchase you will receive a license key. Paste it into CallTrack Pro to unlock Pro.';

export function openUpgrade(): void {
  window.open(STRIPE_LIFETIME_URL, '_blank', 'noopener,noreferrer');
}
