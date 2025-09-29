const express = require('express');
const seatRoutes = require('./routes/seats');

const app = express();
const PORT = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Main route for the seat booking system
app.use('/seats', seatRoutes);

// Root endpoint for basic server check
app.get('/', (req, res) => {
  res.send('Welcome to the Concurrent Ticket Booking System API. Use the /seats endpoint.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});