import { body } from 'express-validator';

export const registerRules = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const lockSeatsRules = [
  body('showtimeId').isMongoId().withMessage('Valid showtimeId is required'),
  body('seats')
    .isArray({ min: 1, max: 8 })
    .withMessage('Seats must be an array between 1 and 8 seats'),
];

export const bookingRules = [
  body('showtimeId').isMongoId().withMessage('Valid showtimeId is required'),
  body('seats')
    .isArray({ min: 1, max: 8 })
    .withMessage('Seats must be an array between 1 and 8 seats'),
];
