const express = require('express');
const router = express.Router();
const Computer = require('../models/computer');
const Booking = require('../models/booking');
const { verifyToken } = require('../middleware/auth');

// Get all computers
router.get('/', verifyToken, async (req, res) => {
  try {
    const computers = await Computer.find().sort({ name: 1 });
    res.json(computers);
  } catch (error) {
    console.error('Error fetching computers:', error);
    res.status(500).json({ message: 'Error fetching computers' });
  }
});

// Get computers with their current and upcoming bookings
router.get('/with-bookings', verifyToken, async (req, res) => {
  try {
    // Get all computers first
    const computers = await Computer.find().sort({ name: 1 });
    
    // Get current date and time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit'
    });

    console.log('Fetching bookings for:', { today, currentTime });

    // Get all current and future approved bookings
    const bookings = await Booking.find({
      status: 'approved',
      $or: [
        // Today's bookings that haven't ended
        {
          startDate: today,
          endDate: today,
          endTime: { $gt: currentTime }
        },
        // Future bookings
        {
          startDate: { $gt: today }
        },
        // Multi-day bookings that include today
        {
          startDate: { $lte: today },
          endDate: { $gte: today }
        }
      ]
    });

    console.log(`Found ${bookings.length} current/future bookings`);

    // Add booking information to each computer
    const computersWithBookings = computers.map(computer => {
      const computerObj = computer.toObject();
      
      // Find all bookings for this computer
      const computerBookings = bookings.filter(booking => 
        booking.computerId.toString() === computer._id.toString()
      );

      if (computerBookings.length > 0) {
        // Sort bookings by date and time
        computerBookings.sort((a, b) => {
          if (a.startDate !== b.startDate) {
            return a.startDate.localeCompare(b.startDate);
          }
          return a.startTime.localeCompare(b.startTime);
        });

        // Get the latest booking
        const latestBooking = computerBookings[computerBookings.length - 1];
        computerObj.nextAvailable = latestBooking.endTime;
        computerObj.nextAvailableDate = latestBooking.endDate;
        computerObj.currentBookings = computerBookings;

        // Check if computer is currently booked
        const isCurrentlyBooked = computerBookings.some(booking => {
          if (booking.startDate === today && booking.endDate === today) {
            // Single day booking - check time
            return booking.endTime > currentTime;
          } else if (booking.startDate <= today && booking.endDate >= today) {
            // Multi-day booking that includes today
            return true;
          }
          return false;
        });

        if (isCurrentlyBooked && computer.status !== 'maintenance') {
          computerObj.status = 'booked';
        }
      }

      return computerObj;
    });

    res.json(computersWithBookings);
  } catch (error) {
    console.error('Error fetching computers with bookings:', error);
    res.status(500).json({ 
      message: 'Error fetching computers with bookings',
      error: error.message 
    });
  }
});

// Create a new computer
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, location, specifications, status } = req.body;
    
    // Basic validation
    if (!name || !location) {
      return res.status(400).json({ message: 'Name and location are required' });
    }

    const computer = new Computer({
      name,
      location,
      specifications,
      status: status || 'available'
    });

    await computer.save();
    res.status(201).json(computer);
  } catch (error) {
    console.error('Error creating computer:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'A computer with this name already exists' });
    } else {
      res.status(500).json({ 
        message: 'Error creating computer',
        error: error.message 
      });
    }
  }
});

// Delete a computer
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if computer has any active bookings
    const activeBookings = await Booking.findOne({
      computerId: req.params.id,
      status: 'approved',
      endDate: { $gte: new Date().toISOString().split('T')[0] }
    });

    if (activeBookings) {
      return res.status(400).json({ 
        message: 'Cannot delete computer with active bookings' 
      });
    }

    const computer = await Computer.findByIdAndDelete(req.params.id);
    if (!computer) {
      return res.status(404).json({ message: 'Computer not found' });
    }

    res.json({ message: 'Computer deleted successfully' });
  } catch (error) {
    console.error('Error deleting computer:', error);
    res.status(500).json({ 
      message: 'Error deleting computer',
      error: error.message 
    });
  }
});

module.exports = router;
