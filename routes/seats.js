const express = require('express');
const router = express.Router();

// --- In-Memory Data Store ---
// Each seat object has an id, status ('available', 'locked', 'booked'),
// a user ID for who locked it, and a timestamp for lock expiration.
const seats = [];
const TOTAL_SEATS = 20;
const LOCK_TIMEOUT_MS = 60 * 1000; // 1 minute lock timeout

// Initialize the seats
for (let i = 1; i <= TOTAL_SEATS; i++) {
  seats.push({
    id: i,
    status: 'available', // available, locked, booked
    lockedBy: null,
    lockExpiresAt: null,
  });
}

// --- API Routes ---

/**
 * GET /seats
 * Responds with the current status of all seats.
 */
router.get('/', (req, res) => {
  res.status(200).json(seats);
});

/**
 * POST /seats/:id/lock
 * Attempts to place a temporary lock on a seat for a user.
 */
router.post('/:id/lock', (req, res) => {
  const { userId } = req.body;
  const seatId = parseInt(req.params.id, 10);
  const seat = seats.find(s => s.id === seatId);

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  if (!seat) {
    return res.status(404).json({ message: 'Seat not found.' });
  }

  const now = Date.now();

  // Check if the seat is available or if an existing lock has expired
  if (seat.status === 'available' || (seat.status === 'locked' && now > seat.lockExpiresAt)) {
    seat.status = 'locked';
    seat.lockedBy = userId;
    seat.lockExpiresAt = now + LOCK_TIMEOUT_MS;
    return res.status(200).json({ message: `Seat ${seatId} locked successfully by user ${userId}.`, seat });
  }

  // Handle other cases
  if (seat.status === 'booked') {
    return res.status(409).json({ message: `Seat ${seatId} is already booked.` });
  }

  if (seat.status === 'locked') {
    return res.status(409).json({ message: `Seat ${seatId} is currently locked by another user.` });
  }
});

/**
 * POST /seats/:id/confirm
 * Confirms the booking for a seat that is currently locked by the user.
 */
router.post('/:id/confirm', (req, res) => {
  const { userId } = req.body;
  const seatId = parseInt(req.params.id, 10);
  const seat = seats.find(s => s.id === seatId);

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  if (!seat) {
    return res.status(404).json({ message: 'Seat not found.' });
  }

  // Validation checks
  if (seat.status !== 'locked') {
    return res.status(409).json({ message: 'Seat must be locked before confirming. This seat is currently booked or available.' });
  }

  if (seat.lockedBy !== userId) {
    return res.status(403).json({ message: 'This seat is locked by another user.' });
  }
  
  if (Date.now() > seat.lockExpiresAt) {
    // The lock has expired, so we revert the seat to 'available'
    seat.status = 'available';
    seat.lockedBy = null;
    seat.lockExpiresAt = null;
    return res.status(409).json({ message: 'Your lock on the seat has expired. Please lock it again.' });
  }

  // Confirm the booking
  seat.status = 'booked';
  seat.lockedBy = null; // Clear lock info
  seat.lockExpiresAt = null;

  res.status(200).json({ message: `Booking for seat ${seatId} confirmed successfully for user ${userId}.`, seat });
});

module.exports = router;