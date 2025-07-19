const Computer = require('../models/computer');
const Booking = require('../models/booking');
const Notification = require('../models/notification');
const User = require('../models/user');

class BookingExpirationService {
  constructor() {
    this.checkInterval = null;
    this.initializeService();
  }

  initializeService() {
    // Check for expired bookings every minute
    this.checkInterval = setInterval(() => {
      this.checkExpiredBookings();
    }, 60000); // 60 seconds

    console.log('Booking expiration service initialized');
  }

  async checkExpiredBookings() {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0];

      // Find all approved bookings that have ended
      const expiredBookings = await Booking.find({
        status: 'approved',
        $or: [
          // Past dates
          { date: { $lt: currentDate } },
          // Today but end time has passed
          {
            date: currentDate,
            endTime: { $lt: currentTime }
          }
        ]
      }).populate('computerId');

      for (const booking of expiredBookings) {
        await this.handleExpiredBooking(booking);
      }

      if (expiredBookings.length > 0) {
        console.log(`Processed ${expiredBookings.length} expired bookings`);
      }
    } catch (error) {
      console.error('Error checking expired bookings:', error);
    }
  }

  async handleExpiredBooking(booking) {
    try {
      // Update booking status to completed
      booking.status = 'completed';
      await booking.save();

      // Update computer status to available
      const computer = booking.computerId;
      if (computer && computer.status === 'booked') {
        computer.status = 'available';
        await computer.save();
      }

      // Send notifications
      await this.sendExpirationNotifications(booking);

      console.log(`Booking ${booking._id} expired and processed`);
    } catch (error) {
      console.error('Error handling expired booking:', error);
    }
  }

  async sendExpirationNotifications(booking) {
    try {
      // Notification for user
      const userNotification = new Notification({
        userId: booking.userId,
        title: 'Booking Session Ended',
        message: `Your booking for ${booking.computerId.name} has ended. The computer is now available for other users.`,
        type: 'info',
        metadata: {
          bookingId: booking._id,
          computerId: booking.computerId._id,
          computerName: booking.computerId.name
        }
      });
      await userNotification.save();

      // Notification for all admins
      const adminUsers = await User.find({ role: 'admin' });
      for (const admin of adminUsers) {
        const adminNotification = new Notification({
          userId: admin._id,
          title: 'Computer Available',
          message: `Computer ${booking.computerId.name} is now available after booking session ended.`,
          type: 'success',
          metadata: {
            bookingId: booking._id,
            computerId: booking.computerId._id,
            computerName: booking.computerId.name,
            userId: booking.userId
          }
        });
        await adminNotification.save();
      }

      console.log(`Notifications sent for expired booking ${booking._id}`);
    } catch (error) {
      console.error('Error sending expiration notifications:', error);
    }
  }

  // Manual method to check and process expired bookings (for testing)
  async processExpiredBookings() {
    await this.checkExpiredBookings();
  }

  // Cleanup method
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

module.exports = BookingExpirationService; 