import express from 'express';
import {
  lockSeatsController,
  releaseSeatsController,
  createBookingController,
  getUserBookingsController,
  getBookingByIdController,
} from '../controllers/bookingController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { lockSeatsRules, bookingRules } from '../validators/index.js';

const router = express.Router();

// All booking endpoints require authentication
router.use(protect);

router.post('/lock-seats', lockSeatsRules, validate, lockSeatsController);
router.post('/release-seats', releaseSeatsController);
router.post('/', bookingRules, validate, createBookingController);
router.get('/', getUserBookingsController);
router.get('/:id', getBookingByIdController);

export default router;
