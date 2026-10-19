/**
 * Helper to get local date string YYYY-MM-DD
 */
export const getTodayDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Checks if a showtime date + start time has already passed
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} startTimeStr - Time string e.g. "10:30 AM", "06:00 PM", "14:30"
 * @returns {boolean} True if the showtime date + time is in the past
 */
export const isShowtimePast = (dateStr, startTimeStr) => {
  if (!dateStr || !startTimeStr) return false;

  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return false;
  const [year, month, day] = parts;

  let hours = 0;
  let minutes = 0;

  const trimmed = startTimeStr.trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (match12) {
    hours = parseInt(match12[1], 10);
    minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  } else {
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      hours = parseInt(match24[1], 10);
      minutes = parseInt(match24[2], 10);
    }
  }

  const showtimeDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const now = new Date();

  return showtimeDate.getTime() <= now.getTime();
};
