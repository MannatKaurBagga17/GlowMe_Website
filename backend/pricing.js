/**
 * Booking price rules — must match frontend calendar display (script.js updateSum).
 * Server is the source of truth for what Razorpay charges.
 */
export function computeBookingDeposit(serviceName) {
  const priceInr = Math.max(2000, (serviceName || '').length * 180);
  const depositInr = Math.round((priceInr * 0.5) / 100) * 100;
  return {
    priceInr,
    depositInr,
    depositPaise: depositInr * 100,
  };
}
