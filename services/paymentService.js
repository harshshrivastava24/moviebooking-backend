/**
 * Mock Payment Service
 * Provides a clean interface simulating real payment gateways (e.g. Razorpay / Stripe).
 */
export const processMockPayment = async ({ amount, paymentMethod = 'CARD' }) => {
  // Simulate network processing delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!amount || amount <= 0) {
    return {
      success: false,
      error: 'Invalid payment amount',
    };
  }

  // Generate unique transaction ID
  const transactionId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    success: true,
    transactionId,
    amount,
    paymentMethod,
    status: 'COMPLETED',
    paidAt: new Date().toISOString(),
  };
};
