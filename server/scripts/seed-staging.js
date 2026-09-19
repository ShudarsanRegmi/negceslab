/**
 * Staging Environment Seed Script
 * Executed for Staging deployment.
 * Seeds base infrastructure + designated QA test accounts with real auth structure.
 * DOES NOT inject random synthetic noise or overlapping conflict junk.
 * Usage: node server/scripts/seed-staging.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedBase = require('./seed-base');
const User = require('../models/user');

const STAGING_QA_USERS = [
  {
    firebaseUid: 'qa_staging_admin_uid_001',
    email: 'staging.admin@ch.amrita.edu',
    name: 'Staging QA Admin',
    role: 'admin'
  },
  {
    firebaseUid: 'qa_staging_student_uid_001',
    email: 'ch.en.u4cse23001@ch.students.amrita.edu',
    name: 'Staging QA Student',
    role: 'user'
  }
];

async function seedStaging() {
  try {
    console.log('🌐 Starting Staging Environment Database Seeding...');

    // 1. Run Base Seed (Computers & Policies)
    await seedBase();

    // 2. Seed Clean Staging QA Accounts
    for (const qaUser of STAGING_QA_USERS) {
      const existingUser = await User.findOne({
        $or: [{ email: qaUser.email }, { firebaseUid: qaUser.firebaseUid }]
      });

      if (existingUser) {
        existingUser.email = qaUser.email;
        existingUser.name = qaUser.name;
        existingUser.role = qaUser.role;
        existingUser.firebaseUid = qaUser.firebaseUid;
        await existingUser.save();
      } else {
        await User.create(qaUser);
      }
      console.log(`  ✓ Staging QA Account [${qaUser.email}] ready`);
    }

    console.log('✅ Staging Environment Seeding Completed Successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Staging Seeding Error:', err);
    process.exit(1);
  }
}

seedStaging();
