/**
 * Dev Environment Seed Script
 * Executed in development mode (`NODE_ENV=development`).
 * Seeds base infrastructure + rich mock users, 2D booking conflicts, and telemetry test data.
 * Usage: node server/scripts/seed-dev.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedBase = require('./seed-base');
const User = require('../models/user');
const Computer = require('../models/computer');
const Booking = require('../models/booking');

const DEV_USERS = [
  {
    firebaseUid: 'dev_student_uid_001',
    email: 'student1@ch.students.amrita.edu',
    name: 'Dev Student One',
    role: 'user'
  },
  {
    firebaseUid: 'dev_student_uid_002',
    email: 'student2@ch.students.amrita.edu',
    name: 'Dev Student Two',
    role: 'user'
  },
  {
    firebaseUid: 'dev_faculty_uid_001',
    email: 'faculty@ch.amrita.edu',
    name: 'Dr. Dev Faculty',
    role: 'user'
  }
];

async function seedDev() {
  try {
    console.log('🚀 Starting Development Environment Database Seeding...');
    
    // 1. Run Base Seed
    await seedBase();

    // 2. Seed Dev Mock Users
    for (const u of DEV_USERS) {
      await User.findOneAndUpdate(
        { email: u.email },
        u,
        { upsert: true, new: true }
      );
      console.log(`  ✓ Dev User [${u.email}] seeded`);
    }

    // 3. Seed Sample Dev Bookings for LAB-PC-01
    const comp = await Computer.findOne({ name: 'LAB-PC-01' });
    const student1 = await User.findOne({ email: DEV_USERS[0].email });
    const student2 = await User.findOne({ email: DEV_USERS[1].email });

    if (comp && student1 && student2) {
      await Booking.deleteMany({ computerId: comp._id, status: 'pending' });

      const today = new Date();
      const d1 = new Date(today);
      d1.setDate(d1.getDate() + 1);
      const d2 = new Date(d1);
      d2.setDate(d2.getDate() + 2);

      const d1Str = d1.toISOString().split('T')[0];
      const d2Str = d2.toISOString().split('T')[0];

      await Booking.create([
        {
          userId: student1.firebaseUid,
          user: student1._id,
          computerId: comp._id,
          startDate: d1Str,
          endDate: d2Str,
          startTime: '09:00',
          endTime: '17:00',
          purpose: 'Deep Learning Model Fine-Tuning (Dev Scenario)',
          status: 'pending'
        },
        {
          userId: student2.firebaseUid,
          user: student2._id,
          computerId: comp._id,
          startDate: d1Str,
          endDate: d1Str,
          startTime: '11:00',
          endTime: '14:00',
          purpose: 'Conflict Verification Request',
          status: 'pending'
        }
      ]);
      console.log('  ✓ Dev booking conflict scenarios created for testing.');
    }

    console.log('✅ Development Environment Seeding Finished.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Dev Seeding Error:', err);
    process.exit(1);
  }
}

seedDev();
