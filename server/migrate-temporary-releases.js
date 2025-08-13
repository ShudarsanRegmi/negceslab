const mongoose = require('mongoose');
const Booking = require('./models/booking');
const TemporaryRelease = require('./models/temporaryRelease');
const TemporaryReleaseDetail = require('./models/temporaryReleaseDetail');

// Migration script to move data from old TemporaryRelease collection to new hybrid system
async function migrateTemporaryReleases() {
  try {
    console.log('🚀 Starting temporary release migration...');

    // Connect to MongoDB
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    }

    // Get all active temporary releases from old system
    const oldTemporaryReleases = await TemporaryRelease.find({ status: 'active' })
      .populate('originalBookingId');

    console.log(`📊 Found ${oldTemporaryReleases.length} temporary releases to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const tempRelease of oldTemporaryReleases) {
      try {
        // Find the original booking
        const originalBooking = await Booking.findById(tempRelease.originalBookingId);
        
        if (!originalBooking) {
          console.log(`⚠️  Skipping temp release ${tempRelease._id} - original booking not found`);
          skippedCount++;
          continue;
        }

        console.log(`🔄 Processing temporary release ${tempRelease._id} for booking ${originalBooking._id}`);

        // Convert dates to string format (YYYY-MM-DD)
        const releasedDates = tempRelease.releaseDates.map(date => 
          date.toISOString().split('T')[0]
        );

        // Create new TemporaryReleaseDetail record
        const releaseDetail = new TemporaryReleaseDetail({
          bookingId: originalBooking._id,
          userId: tempRelease.userId,
          releaseNumber: 1, // Default to 1 for migrated releases
          releasedDates,
          reason: tempRelease.reason,
          status: 'active',
          releaseContext: {
            userMessage: 'Migrated from old system',
            releaseType: 'multiple_days',
            isEmergency: false
          },
          createdAt: tempRelease.createdAt,
          updatedAt: tempRelease.updatedAt
        });

        await releaseDetail.save();
        console.log(`✅ Created TemporaryReleaseDetail ${releaseDetail._id}`);

        // Update the main booking's temporary release summary
        const releasedDatesArray = releasedDates.map(date => ({
          date,
          isBooked: false,
          tempBookingId: null
        }));

        // Handle any existing temporary bookings
        if (tempRelease.tempBookings && tempRelease.tempBookings.length > 0) {
          console.log(`🔗 Processing ${tempRelease.tempBookings.length} temporary bookings`);
          
          for (const tempBookingId of tempRelease.tempBookings) {
            const tempBooking = await Booking.findById(tempBookingId);
            if (tempBooking) {
              // Mark this booking as a temporary booking
              tempBooking.isTemporaryBooking = true;
              tempBooking.originalBookingId = originalBooking._id;
              await tempBooking.save();

              // Mark the corresponding date as booked
              const bookingDate = tempBooking.startDate;
              const releasedDateIndex = releasedDatesArray.findIndex(rd => rd.date === bookingDate);
              if (releasedDateIndex !== -1) {
                releasedDatesArray[releasedDateIndex].isBooked = true;
                releasedDatesArray[releasedDateIndex].tempBookingId = tempBooking._id;

                // Update the release detail booking details
                const bookingDetailIndex = releaseDetail.bookingDetails.findIndex(bd => bd.date === bookingDate);
                if (bookingDetailIndex !== -1) {
                  releaseDetail.bookingDetails[bookingDetailIndex].isBooked = true;
                  releaseDetail.bookingDetails[bookingDetailIndex].tempBookingId = tempBooking._id;
                  releaseDetail.bookingDetails[bookingDetailIndex].bookedBy = tempBooking.userId;
                  releaseDetail.bookingDetails[bookingDetailIndex].bookedAt = tempBooking.createdAt;
                }
              }
            }
          }

          await releaseDetail.save();
        }

        // Update the original booking with temporary release summary
        if (!originalBooking.temporaryRelease) {
          originalBooking.temporaryRelease = {
            hasActiveReleases: true,
            totalReleasedDays: releasedDates.length,
            releasedDates: releasedDatesArray,
            lastUpdated: tempRelease.updatedAt || tempRelease.createdAt
          };
        } else {
          // Merge with existing data (in case of partial migration)
          originalBooking.temporaryRelease.releasedDates.push(...releasedDatesArray);
          originalBooking.temporaryRelease.totalReleasedDays = originalBooking.temporaryRelease.releasedDates.length;
          originalBooking.temporaryRelease.hasActiveReleases = true;
          originalBooking.temporaryRelease.lastUpdated = new Date();
        }

        await originalBooking.save();
        console.log(`✅ Updated booking ${originalBooking._id} with temporary release summary`);

        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrating temporary release ${tempRelease._id}:`, error);
        skippedCount++;
      }
    }

    console.log('\n📋 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} temporary releases`);
    console.log(`⚠️  Skipped: ${skippedCount} temporary releases`);
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Test the new system thoroughly');
    console.log('2. Verify all temporary releases are working correctly');
    console.log('3. Once confirmed, you can safely drop the old TemporaryRelease collection:');
    console.log('   db.temporaryreleases.drop()');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Rollback function to restore from new system to old system (if needed)
async function rollbackMigration() {
  try {
    console.log('🔄 Starting migration rollback...');
    
    // Get all temporary release details
    const releaseDetails = await TemporaryReleaseDetail.find({ status: 'active' })
      .populate('originalBooking');

    for (const detail of releaseDetails) {
      // Create old-style temporary release
      const oldRelease = new TemporaryRelease({
        originalBookingId: detail.bookingId,
        userId: detail.userId,
        computerId: detail.originalBooking.computerId,
        releaseDates: detail.releasedDates.map(dateStr => new Date(dateStr)),
        reason: detail.reason,
        status: 'active',
        tempBookings: detail.bookingDetails
          .filter(bd => bd.isBooked && bd.tempBookingId)
          .map(bd => bd.tempBookingId),
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt
      });

      await oldRelease.save();
      console.log(`✅ Restored old temporary release ${oldRelease._id}`);
    }

    // Clear temporary release data from bookings
    await Booking.updateMany(
      { 'temporaryRelease.hasActiveReleases': true },
      { $unset: { temporaryRelease: "" } }
    );

    console.log('🎉 Rollback completed successfully!');
    console.log('📝 You can now remove the new TemporaryReleaseDetail collection if needed');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'rollback') {
    rollbackMigration()
      .then(() => {
        console.log('✅ Rollback script completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Rollback script failed:', error);
        process.exit(1);
      });
  } else {
    migrateTemporaryReleases()
      .then(() => {
        console.log('✅ Migration script completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Migration script failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { migrateTemporaryReleases, rollbackMigration };
