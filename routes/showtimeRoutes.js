import express from 'express';
import { getShowtimesList, getShowtime, getSeats } from '../controllers/showtimeController.js';

const router = express.Router();

router.get('/', getShowtimesList);
router.get('/:id', getShowtime);
router.get('/:id/seats', getSeats);

export default router;
