import QRCode from 'qrcode';

export const generateBookingQRCode = async (bookingInfo) => {
  try {
    const payload = JSON.stringify({
      bookingId: bookingInfo._id,
      transactionId: bookingInfo.transactionId,
      movie: bookingInfo.movie?.title || bookingInfo.movie,
      seats: bookingInfo.seats.map((s) => s.seatId).join(', '),
      totalAmount: bookingInfo.totalAmount,
      timestamp: bookingInfo.createdAt,
    });

    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });

    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR Code:', error);
    return '';
  }
};
