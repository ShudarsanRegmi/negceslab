const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const TemporaryReleaseDetail = require('../models/temporaryReleaseDetail');
const Notification = require('../models/notification');
const User = require('../models/user');
const { verifyToken } = require('../middleware/auth');

// Create a temporary release - now with hybrid approach
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { bookingId, releaseDates, reason, userMessage, releaseType = 'single_day', isEmergency = false } = req.body;

    // Validate required fields
    if (!bookingId || !releaseDates || !Array.isArray(releaseDates) || releaseDates.length === 0 || !reason?.trim()) {
      return res.status(400).json({ 
        message: 'Booking ID, release dates array, and reason are required' 
      });
    }

    // Find the original booking
    const originalBooking = await Booking.findById(bookingId).populate('computerId');
    if (!originalBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (originalBooking.userId.toString() !== req.user.firebaseUid) {
      return res.status(403).json({ message: 'You can only create temporary releases for your own bookings' });
    }

    // Check if booking is approved
    if (originalBooking.status !== 'approved') {
      return res.status(400).json({ message: 'Can only create temporary releases for approved bookings' });
    }

    // Validate that all release dates are within the booking period
    const bookingStart = new Date(originalBooking.startDate);
    const bookingEnd = new Date(originalBooking.endDate);
    
    const invalidDates = releaseDates.filter(dateStr => {
      const releaseDate = new Date(dateStr);
      return releaseDate < bookingStart || releaseDate > bookingEnd;
    });

    if (invalidDates.length > 0) {
      return res.status(400).json({ 
        message: 'All release dates must be within your booking period',
        invalidDates 
      });
    }

    // Check for existing temporary releases on these dates
    const existingReleasedDates = originalBooking.temporaryRelease?.releasedDates?.map(rd => rd.date) || [];
    const duplicateDates = releaseDates.filter(date => existingReleasedDates.includes(date));

    if (duplicateDates.length > 0) {
      return res.status(400).json({ 
        message: 'Some of these dates already have active temporary releases',
        duplicateDates 
      });
    }

    // Get next release number for this booking
    const releaseNumber = await TemporaryReleaseDetail.getNextReleaseNumber(bookingId);

    // Create the temporary release detail record
    const temporaryReleaseDetail = new TemporaryReleaseDetail({
      bookingId,
      userId: req.user.firebaseUid,
      releaseNumber,
      releasedDates: releaseDates, // Fix: use releaseDates from request body
      reason: reason.trim(),
      releaseContext: {
        userMessage: userMessage || `Release #${releaseNumber} for ${releaseDates.length} day(s)`,
        releaseType,
        isEmergency
      }
    });

    await temporaryReleaseDetail.save();

    // Update the main booking's temporary release summary
    const newReleasedDates = releaseDates.map(date => ({
      date,
      isBooked: false,
      tempBookingId: null
    }));

    if (!originalBooking.temporaryRelease) {
      originalBooking.temporaryRelease = {
        hasActiveReleases: true,
        totalReleasedDays: releaseDates.length,
        releasedDates: newReleasedDates,
        lastUpdated: new Date()
      };
    } else {
      originalBooking.temporaryRelease.releasedDates.push(...newReleasedDates);
      originalBooking.temporaryRelease.totalReleasedDays = originalBooking.temporaryRelease.releasedDates.length;
      originalBooking.temporaryRelease.hasActiveReleases = true;
      originalBooking.temporaryRelease.lastUpdated = new Date();
    }

    await originalBooking.save();

    // Populate the response
    await temporaryReleaseDetail.populate([
      { path: 'originalBooking', select: 'startDate endDate startTime endTime', populate: { path: 'computerId', select: 'name location' } }
    ]);

    // Create notification for admin
    try {
      await Notification.create({
        type: 'temp_release_created',
        message: `User has created temporary release #${releaseNumber} for ${originalBooking.computerId.name} on ${releaseDates.length} day(s)`,
        userId: req.user.firebaseUid,
        metadata: {
          bookingId: originalBooking._id,
          computerId: originalBooking.computerId._id,
          releaseNumber,
          releaseDates
        }
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    res.status(201).json({
      message: 'Temporary release created successfully',
      releaseDetail: temporaryReleaseDetail,
      releaseNumber
    });

  } catch (error) {
    console.error('Error creating temporary release:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all temporary releases for a user
router.get('/user', verifyToken, async (req, res) => {
  try {
    const userReleases = await TemporaryReleaseDetail.find({
      userId: req.user.firebaseUid,
      status: { $in: ['active', 'partially_booked'] }
    })
    .populate({
      path: 'originalBooking',
      select: 'startDate endDate startTime endTime computerId',
      populate: {
        path: 'computerId',
        select: 'name location specifications'
      }
    })
    .sort({ createdAt: -1 });

    // Also get bookings with temporary releases for summary
    const bookingsWithReleases = await Booking.find({
      userId: req.user.firebaseUid,
      'temporaryRelease.hasActiveReleases': true
    })
    .populate('computerId', 'name location specifications')
    .select('computerId startDate endDate temporaryRelease')
    .sort({ createdAt: -1 });

    res.json({ 
      releaseDetails: userReleases,
      bookingSummaries: bookingsWithReleases
    });
  } catch (error) {
    console.error('Error fetching user temporary releases:', error);
    res.status(500).json({ message: 'Error fetching temporary releases', error: error.message });
  }
});

// Get all temporary releases (admin only)
router.get('/all', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const allReleases = await TemporaryReleaseDetail.find({
      status: { $in: ['active', 'partially_booked', 'cancelled'] }
    })
    .populate({
      path: 'bookingId',
      select: 'startDate endDate startTime endTime computerId userId reason',
      populate: {
        path: 'computerId',
        select: 'name location specifications'
      }
    })
    .sort({ createdAt: -1 });

    // Get user information for each release
    const User = require('../models/user');
    const releasesWithUserInfo = await Promise.all(
      allReleases.map(async (release) => {
        let userInfo = null;
        try {
          // Use firebaseUid to find user since userId in release is Firebase UID
          userInfo = await User.findOne({ firebaseUid: release.userId });
        } catch (err) {
          console.warn(`Could not fetch user info for ${release.userId}:`, err.message);
        }

        return {
          _id: release._id,
          bookingId: release.bookingId?._id,
          userId: release.userId,
          releasedDates: release.releasedDates,
          reason: release.reason,
          status: release.status,
          createdAt: release.createdAt,
          originalBooking: release.bookingId,
          userInfo: userInfo ? {
            uid: userInfo._id,
            email: userInfo.email,
            displayName: userInfo.name // Changed from userInfo.displayName to userInfo.name
          } : null
        };
      })
    );

    res.json(releasesWithUserInfo);
  } catch (error) {
    console.error('Error fetching all temporary releases:', error);
    res.status(500).json({ message: 'Error fetching temporary releases', error: error.message });
  }
});

// Cancel a temporary release
router.patch('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const releaseDetail = await TemporaryReleaseDetail.findById(req.params.id)
      .populate({
        path: 'originalBooking',
        populate: { path: 'computerId', select: 'name location' }
      });

    if (!releaseDetail) {
      return res.status(404).json({ message: 'Temporary release not found' });
    }

    // Check if user owns this temporary release or is admin
    const isOwner = releaseDetail.userId === req.user.firebaseUid;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only cancel your own temporary releases' });
    }

    // Check if temporary release is already cancelled
    if (releaseDetail.status === 'cancelled') {
      return res.status(400).json({ message: 'Temporary release is already cancelled' });
    }

    // Check if there are any bookings on these dates
    const hasBookings = releaseDetail.bookingDetails.some(bd => bd.isBooked);
    if (hasBookings) {
      return res.status(400).json({
        message: 'Cannot cancel temporary release as there are existing bookings during this period'
      });
    }

    // Cancel the temporary release detail
    releaseDetail.status = 'cancelled';
    await releaseDetail.save();

    // Update the main booking's temporary release summary
    const originalBooking = await Booking.findById(releaseDetail.bookingId);
    if (originalBooking && originalBooking.temporaryRelease) {
      // Remove cancelled dates from the main booking summary
      const cancelledDates = releaseDetail.releasedDates;
      originalBooking.temporaryRelease.releasedDates = originalBooking.temporaryRelease.releasedDates.filter(
        rd => !cancelledDates.includes(rd.date)
      );
      originalBooking.temporaryRelease.totalReleasedDays = originalBooking.temporaryRelease.releasedDates.length;
      originalBooking.temporaryRelease.hasActiveReleases = originalBooking.temporaryRelease.totalReleasedDays > 0;
      originalBooking.temporaryRelease.lastUpdated = new Date();

      await originalBooking.save();
    }

    // Notify admins about the cancellation
    const userBookingId = originalBooking._id.toString().slice(-6).toUpperCase();
    try {
      await Notification.create({
        type: 'temp_release_cancelled',
        message: `Temporary release #${releaseDetail.releaseNumber} for ${releaseDetail.originalBooking.computerId.name} has been cancelled`,
        userId: req.user.firebaseUid,
        metadata: {
          bookingId: userBookingId,
          bookingDbId: originalBooking._id.toString(),
          computerId: releaseDetail.originalBooking.computerId._id,
          computerName: releaseDetail.originalBooking.computerId.name,
          releaseNumber: releaseDetail.releaseNumber
        }
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    res.json({
      message: 'Temporary release cancelled successfully',
      releaseDetail
    });

  } catch (error) {
    console.error('Error cancelling temporary release:', error);
    res.status(500).json({ message: 'Error cancelling temporary release', error: error.message });
  }
});

// Get available temporary release slots for a computer
router.get('/available/:computerId', async (req, res) => {
  try {
    const { computerId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('=== TEMPORARY RELEASE API DEBUG ===');
    console.log('Computer ID:', computerId);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'startDate and endDate query parameters are required'
      });
    }

    // Find bookings with active temporary releases for this computer
    const bookingsWithReleases = await Booking.find({
      computerId,
      status: 'approved',
      'temporaryRelease.hasActiveReleases': true,
      'temporaryRelease.releasedDates': {
        $elemMatch: {
          date: {
            $gte: startDate,
            $lte: endDate
          },
          isBooked: false
        }
      }
    })
    .populate('computerId', 'name location')
    .sort({ createdAt: 1 });

    console.log('Bookings with active temporary releases found:', bookingsWithReleases.length);

    // Format the response to include individual available dates
    const formattedSlots = [];
    bookingsWithReleases.forEach(booking => {
      console.log('Processing booking:', booking._id);
      
      booking.temporaryRelease.releasedDates.forEach(releasedDate => {
        const dateStr = releasedDate.date;
        console.log('Checking date:', dateStr, 'against range:', startDate, '-', endDate);
        
        if (dateStr >= startDate && dateStr <= endDate && !releasedDate.isBooked) {
          console.log('Date is in range and available, adding to slots');
          formattedSlots.push({
            date: dateStr,
            startTime: booking.startTime,
            endTime: booking.endTime,
            originalBookingId: booking._id,
            computerName: booking.computerId.name,
            location: booking.computerId.location
          });
        }
      });
    });

    console.log('Final formatted slots:', formattedSlots);
    console.log('=== END TEMPORARY RELEASE API DEBUG ===');

    res.json({ data: formattedSlots.sort((a, b) => a.date.localeCompare(b.date)) });
  } catch (error) {
    console.error('Error fetching available temporary slots:', error);
    res.status(500).json({ message: 'Error fetching available slots', error: error.message });
  }
});

// Book a temporary slot
router.post('/book', verifyToken, async (req, res) => {
  try {
    const { originalBookingId, date, reason } = req.body;

    if (!originalBookingId || !date || !reason?.trim()) {
      return res.status(400).json({ 
        message: 'Original booking ID, date, and reason are required' 
      });
    }

    // Find the original booking with temporary release
    const originalBooking = await Booking.findById(originalBookingId).populate('computerId');
    if (!originalBooking) {
      return res.status(404).json({ message: 'Original booking not found' });
    }

    // Check if temporary release is active
    if (!originalBooking.temporaryRelease?.hasActiveReleases) {
      return res.status(400).json({ message: 'No active temporary release found for this booking' });
    }

    // Find the specific released date
    const releasedDateIndex = originalBooking.temporaryRelease.releasedDates.findIndex(
      rd => rd.date === date && !rd.isBooked
    );

    if (releasedDateIndex === -1) {
      return res.status(400).json({ message: 'Date is not available for temporary booking' });
    }

    // Create the temporary booking
    const tempBooking = new Booking({
      userId: req.user.firebaseUid,
      computerId: originalBooking.computerId._id,
      startDate: date,
      endDate: date,
      startTime: originalBooking.startTime,
      endTime: originalBooking.endTime,
      reason: reason.trim(),
      requiresGPU: false,
      problemStatement: 'Temporary booking - system requirements same as original booking',
      datasetType: 'Other',
      datasetSize: { value: 0, unit: 'MB' },
      datasetLink: 'N/A - Temporary booking',
      bottleneckExplanation: 'N/A - Temporary booking',
      status: 'approved', // Auto-approve temporary bookings
      isTemporaryBooking: true,
      originalBookingId: originalBooking._id
    });

    await tempBooking.save();

    // Update the original booking's released date
    originalBooking.temporaryRelease.releasedDates[releasedDateIndex].isBooked = true;
    originalBooking.temporaryRelease.releasedDates[releasedDateIndex].tempBookingId = tempBooking._id;
    originalBooking.temporaryRelease.lastUpdated = new Date();

    await originalBooking.save();

    // Update the temporary release detail with booking information
    await TemporaryReleaseDetail.updateOne(
      { 
        bookingId: originalBooking._id,
        status: 'active',
        'bookingDetails.date': date
      },
      {
        $set: {
          'bookingDetails.$.isBooked': true,
          'bookingDetails.$.tempBookingId': tempBooking._id,
          'bookingDetails.$.bookedBy': req.user.firebaseUid,
          'bookingDetails.$.bookedAt': new Date()
        }
      }
    );

    res.status(201).json({
      message: 'Temporary booking created successfully',
      booking: tempBooking
    });

  } catch (error) {
    console.error('Error creating temporary booking:', error);
    res.status(500).json({ message: 'Error creating temporary booking', error: error.message });
  }
});

module.exports = router;
