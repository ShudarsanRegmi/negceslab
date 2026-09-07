/**
 * Seed Script: Creates 2D Overlapping Booking Conflict Scenarios
 * Usage: node server/scripts/seedConflictScenario.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Booking = require('../models/booking');
const Computer = require('../models/computer');
const User = require('../models/user');

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/negceslab';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    // 1. Ensure target test users exist
    let student1 = await User.findOne({ email: 'student1@ch.students.amrita.edu' });
    if (!student1) {
      student1 = await User.create({
        firebaseUid: `dev_uid_student1_${Date.now()}`,
        email: 'student1@ch.students.amrita.edu',
        name: 'Student One',
        role: 'user'
      });
    }

    let student2 = await User.findOne({ email: 'student2@ch.students.amrita.edu' });
    if (!student2) {
      student2 = await User.create({
        firebaseUid: `dev_uid_student2_${Date.now()}`,
        email: 'student2@ch.students.amrita.edu',
        name: 'Student Two',
        role: 'user'
      });
    }

    let admin = await User.findOne({ email: 'admin@ch.amrita.edu' });
    if (!admin) {
      admin = await User.create({
        firebaseUid: `dev_uid_admin_${Date.now()}`,
        email: 'admin@ch.amrita.edu',
        name: 'Admin User',
        role: 'admin'
      });
    }

    // 2. Get target lab computer
    let comp = await Computer.findOne();
    if (!comp) {
      comp = await Computer.create({
        name: 'LAB-PC-01',
        location: 'Lab Room A',
        specifications: 'OS: Linux\nRAM: 32GB\nGPU: RTX 4090',
        status: 'available'
      });
    }

    console.log(`Seeding conflict scenario for Computer: ${comp.name} (${comp._id})`);

    // 3. Clear existing pending bookings for this computer
    await Booking.deleteMany({ computerId: comp._id, status: 'pending' });

    // 4. Create Overlapping Pending Bookings
    const today = new Date();
    const targetStartDate = new Date(today);
    targetStartDate.setDate(targetStartDate.getDate() + 2); // 2 days in future

    const d1Str = targetStartDate.toISOString().split('T')[0];
    const d2Obj = new Date(targetStartDate);
    d2Obj.setDate(d2Obj.getDate() + 2);
    const d2Str = d2Obj.toISOString().split('T')[0];

    const bookings = await Booking.create([
      {
        userId: student1.firebaseUid,
        user: student1._id,
        computerId: comp._id,
        startDate: d1Str,
        endDate: d2Str,
        startTime: '09:00',
        endTime: '17:00',
        purpose: 'Deep Learning Model Training (Multi-day)',
        status: 'pending'
      },
      {
        userId: student2.firebaseUid,
        user: student2._id,
        computerId: comp._id,
        startDate: d1Str,
        endDate: d1Str,
        startTime: '11:00',
        endTime: '15:00',
        purpose: 'CAD Simulation Work (Intra-day overlap)',
        status: 'pending'
      }
    ]);

    console.log('✅ Successfully seeded 2 conflicting booking requests!');
    console.log(`- Request 1 (Student 1): ${d1Str} to ${d2Str} (09:00 - 17:00)`);
    console.log(`- Request 2 (Student 2): ${d1Str} to ${d1Str} (11:00 - 15:00) [OVERLAP!]`);
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
