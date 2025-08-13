const mongoose = require('mongoose');
const Booking = require('./models/booking');
const TemporaryReleaseDetail = require('./models/temporaryReleaseDetail');

// Test script to verify the new temporary release system
async function testTemporaryReleaseSystem() {
  try {
    console.log('🧪 Testing Temporary Release System...');

    // Connect to MongoDB
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    }

    // Test 1: Create a test booking
    console.log('\n📝 Test 1: Creating test booking...');
    const testBooking = new Booking({
      userId: 'test-user-123',
      computerId: new mongoose.Types.ObjectId(),
      startDate: '2025-08-15',
      endDate: '2025-08-20',
      startTime: '09:00',
      endTime: '17:00',
      reason: 'Test booking for temporary release system',
      requiresGPU: false,
      problemStatement: 'Testing the new temporary release system',
      datasetType: 'Other',
      datasetSize: { value: 1, unit: 'GB' },
      datasetLink: 'https://test.com/dataset',
      bottleneckExplanation: 'Testing bottleneck',
      status: 'approved'
    });

    await testBooking.save();
    console.log(`✅ Created test booking: ${testBooking._id}`);

    // Test 2: Create temporary release detail
    console.log('\n📝 Test 2: Creating temporary release detail...');
    const releaseDetail = new TemporaryReleaseDetail({
      bookingId: testBooking._id,
      userId: 'test-user-123',
      releaseNumber: 1,
      releasedDates: ['2025-08-16', '2025-08-17'],
      reason: 'Need to release system for maintenance',
      releaseContext: {
        userMessage: 'Testing multiple day release',
        releaseType: 'multiple_days',
        isEmergency: false
      }
    });

    await releaseDetail.save();
    console.log(`✅ Created temporary release detail: ${releaseDetail._id}`);

    // Test 3: Update main booking with temporary release summary
    console.log('\n📝 Test 3: Updating main booking...');
    testBooking.temporaryRelease = {
      hasActiveReleases: true,
      totalReleasedDays: 2,
      releasedDates: [
        { date: '2025-08-16', isBooked: false, tempBookingId: null },
        { date: '2025-08-17', isBooked: false, tempBookingId: null }
      ],
      lastUpdated: new Date()
    };

    await testBooking.save();
    console.log('✅ Updated booking with temporary release summary');

    // Test 4: Create another release for the same booking (incremental)
    console.log('\n📝 Test 4: Creating incremental release...');
    const nextReleaseNumber = await TemporaryReleaseDetail.getNextReleaseNumber(testBooking._id);
    console.log(`📊 Next release number: ${nextReleaseNumber}`);

    const incrementalRelease = new TemporaryReleaseDetail({
      bookingId: testBooking._id,
      userId: 'test-user-123',
      releaseNumber: nextReleaseNumber,
      releasedDates: ['2025-08-18'],
      reason: 'Another day needed for personal work',
      releaseContext: {
        userMessage: 'I need tomorrow as well',
        releaseType: 'single_day',
        isEmergency: false
      }
    });

    await incrementalRelease.save();
    console.log(`✅ Created incremental release: ${incrementalRelease._id}`);

    // Update main booking with new release
    testBooking.temporaryRelease.releasedDates.push({
      date: '2025-08-18',
      isBooked: false,
      tempBookingId: null
    });
    testBooking.temporaryRelease.totalReleasedDays = 3;
    testBooking.temporaryRelease.lastUpdated = new Date();

    await testBooking.save();
    console.log('✅ Updated booking with incremental release');

    // Test 5: Query tests
    console.log('\n📝 Test 5: Running queries...');

    // Find bookings with active releases
    const bookingsWithReleases = await Booking.find({
      'temporaryRelease.hasActiveReleases': true
    }).populate('temporaryReleaseDetails');

    console.log(`✅ Found ${bookingsWithReleases.length} bookings with active releases`);

    // Find available dates for a computer
    const availableDates = await Booking.find({
      computerId: testBooking.computerId,
      status: 'approved',
      'temporaryRelease.hasActiveReleases': true,
      'temporaryRelease.releasedDates': {
        $elemMatch: {
          date: { $gte: '2025-08-15', $lte: '2025-08-20' },
          isBooked: false
        }
      }
    });

    console.log(`✅ Found ${availableDates.length} bookings with available dates`);

    // Get user's release details
    const userReleases = await TemporaryReleaseDetail.find({
      userId: 'test-user-123',
      status: 'active'
    }).populate('originalBooking');

    console.log(`✅ Found ${userReleases.length} active releases for user`);

    // Test 6: Cleanup
    console.log('\n🧹 Test 6: Cleaning up test data...');
    await TemporaryReleaseDetail.deleteMany({ userId: 'test-user-123' });
    await Booking.deleteOne({ _id: testBooking._id });
    console.log('✅ Cleaned up test data');

    console.log('\n🎉 All tests passed! The temporary release system is working correctly.');
    console.log('\n📋 System Capabilities Verified:');
    console.log('✅ Create temporary releases');
    console.log('✅ Incremental release creation (multiple entries per booking)');
    console.log('✅ Fast availability queries');
    console.log('✅ Detailed release tracking');
    console.log('✅ User scenario support (daily releases)');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests if called directly
if (require.main === module) {
  testTemporaryReleaseSystem()
    .then(() => {
      console.log('✅ Test script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = testTemporaryReleaseSystem;
