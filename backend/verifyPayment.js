import crypto from 'crypto';

/**
 * Razorpay Checkout success handler sends order_id, payment_id, signature.
 * Verify HMAC: sha256(order_id + "|" + payment_id) with Key Secret.
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration/#step-3-verify-payment-signature
 */
export function verifyPaymentSignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}
