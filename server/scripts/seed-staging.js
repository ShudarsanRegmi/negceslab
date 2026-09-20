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
const admin = require('firebase-admin');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedBase = require('./seed-base');
const User = require('../models/user');

const STAGING_QA_PASSWORD = process.env.STAGING_QA_PASSWORD || 'Staging@123456';

const STAGING_QA_USERS = [
  {
    email: 'staging.admin@ch.amrita.edu',
    name: 'Staging QA Admin',
    role: 'admin',
    password: STAGING_QA_PASSWORD
  },
  {
    email: 'ch.en.u4cse23001@ch.students.amrita.edu',
    name: 'Staging QA Student',
    role: 'user',
    password: STAGING_QA_PASSWORD
  }
];

async function seedStaging() {
  try {
    console.log('🌐 Starting Staging Environment Database Seeding...');

    // 1. Run Base Seed (Computers & Base Admin)
    await seedBase();

    // 2. Seed Clean Staging QA Accounts with Firebase Auth
    for (const qaUser of STAGING_QA_USERS) {
      let uid = `qa_staging_uid_${Date.now()}`;

      if (admin.apps.length) {
        try {
          let fbUser;
          try {
            fbUser = await admin.auth().getUserByEmail(qaUser.email);
            await admin.auth().updateUser(fbUser.uid, {
              password: qaUser.password,
              displayName: qaUser.name,
              emailVerified: true
            });
            console.log(`  ✓ Updated Firebase Auth User for ${qaUser.email}`);
          } catch (notFound) {
            fbUser = await admin.auth().createUser({
              email: qaUser.email,
              password: qaUser.password,
              displayName: qaUser.name,
              emailVerified: true
            });
            console.log(`  ✓ Created new Firebase Auth User for ${qaUser.email}`);
          }
          uid = fbUser.uid;
        } catch (fbErr) {
          console.warn(`  ⚠️ Could not sync ${qaUser.email} to Firebase Auth:`, fbErr.message);
        }
      }

      const existingUser = await User.findOne({
        $or: [{ email: qaUser.email }, { firebaseUid: uid }]
      });

      if (existingUser) {
        existingUser.email = qaUser.email;
        existingUser.name = qaUser.name;
        existingUser.role = qaUser.role;
        existingUser.firebaseUid = uid;
        await existingUser.save();
      } else {
        await User.create({
          email: qaUser.email,
          name: qaUser.name,
          role: qaUser.role,
          firebaseUid: uid
        });
      }
      console.log(`  ✓ Staging QA Account [${qaUser.email}] ready (UID: ${uid})`);
    }

    console.log('✅ Staging Environment Seeding Completed Successfully.');
    console.log(`🔑 Staging QA Credentials Default Password: ${STAGING_QA_PASSWORD}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Staging Seeding Error:', err);
    process.exit(1);
  }
}

seedStaging();
