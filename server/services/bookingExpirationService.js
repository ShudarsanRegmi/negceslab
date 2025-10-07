const Booking = require('../models/booking');
const User = require('../models/user');
const { sendBookingExpiredEmail } = require('./emailService');

// Function to check and handle expired bookings
const checkExpiredBookings = async () => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit'
    });

    // Find approved bookings that have expired
    // A booking is expired only when:
    // 1. endDate < currentDate (past bookings)
    // 2. endDate === currentDate AND endTime < currentTime (today's ended bookings)
    const expiredBookings = await Booking.find({
      status: 'approved',
      $or: [
        // Bookings that ended on previous dates
        {
          endDate: { $lt: currentDate }
        },
        // Bookings that end today but have passed their end time
        {
          endDate: currentDate,
          endTime: { $lt: currentTime }
        }
      ]
    }).populate('computerId');

    console.log(`Found ${expiredBookings.length} expired bookings`);

    // Process each expired booking
    for (const booking of expiredBookings) {
      try {
        // Update booking status to completed (booking naturally ended)
        booking.status = 'completed'; 
        await booking.save();

        // Send email notification
        console.log('Looking for user with firebaseUid:', booking.userId);
        const user = await User.findOne({ firebaseUid: booking.userId });
        console.log('Found user for expiration:', user ? { name: user.name, email: user.email } : 'Not found');
        
        if (user && user.email) {
          const userName = user.name || 'User';
          const computerName = booking.computerId.name;
          const startDate = new Date(booking.startDate).toLocaleDateString();
          const endDate = new Date(booking.endDate).toLocaleDateString();
          
          console.log('Sending expiration email to:', user.email);
          
          await sendBookingExpiredEmail(
            user.email,
            userName,
            computerName,
            startDate,
            endDate,
            booking.startTime,
            booking.endTime
          );
          
          console.log(`Expired booking email sent to ${user.email}`);
        } else {
          console.log('User not found or no email for expiration, firebaseUid:', booking.userId);
        }
      } catch (error) {
        console.error(`Error processing expired booking ${booking._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error checking expired bookings:', error);
  }
};

// Function to start the expiration service
const startExpirationService = () => {
  // Check for expired bookings every hour
  setInterval(checkExpiredBookings, 60 * 60 * 1000);
  
  // Also check immediately when service starts
  checkExpiredBookings();
  
  console.log('Booking expiration service started');
};

module.exports = {
  checkExpiredBookings,
  startExpirationService
};
