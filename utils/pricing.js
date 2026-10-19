/**
 * Server-authoritative price calculation
 */
export const calculateBookingPrices = (seats, basePricing) => {
  if (!seats || !Array.isArray(seats) || seats.length === 0) {
    throw new Error('No seats provided for pricing calculation');
  }

  if (seats.length > 8) {
    throw new Error('Maximum 8 seats allowed per booking');
  }

  let subtotal = 0;
  const processedSeats = seats.map((seat) => {
    const tier = seat.tier ? seat.tier.toUpperCase() : 'NORMAL';
    const price = basePricing[tier] || basePricing.NORMAL || 200;
    subtotal += price;

    return {
      seatId: seat.seatId,
      row: seat.row,
      column: Number(seat.column),
      tier,
      price,
    };
  });

  // Flat ₹35 convenience fee per ticket
  const convenienceFee = seats.length * 35;
  // 18% GST on convenience fee
  const gst = Math.round(convenienceFee * 0.18);
  const totalAmount = subtotal + convenienceFee + gst;

  return {
    seats: processedSeats,
    subtotal,
    convenienceFee,
    gst,
    totalAmount,
  };
};
