/**
 * Base Database Seed Script: Lab Computers & Initial Policies
 * Seeds essential lab infrastructure required by both Dev and Staging environments.
 * Usage: node server/scripts/seed-base.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Computer = require('../models/computer');
const User = require('../models/user');
const Policy = require('../models/policy');

const BASE_COMPUTERS = [
  {
    name: 'LAB-PC-01',
    location: 'Lab Room A - Station 1',
    specifications: 'OS: Linux (Ubuntu 22.04)\nCPU: Intel i9-13900K\nRAM: 64GB DDR5\nGPU: NVIDIA RTX 4090 (24GB)',
    status: 'available',
    systemDetails: {
      operatingSystem: 'Linux',
      osVersion: 'Ubuntu 22.04 LTS',
      architecture: 'x86_64',
      processor: 'Intel Core i9-13900K',
      ram: '64 GB',
      storage: '2 TB NVMe SSD',
      gpu: 'NVIDIA RTX 4090 (24GB VRAM)',
      installedSoftware: [
        { name: 'PyTorch', version: '2.1.0', category: 'Development', icon: '🔥' },
        { name: 'TensorFlow', version: '2.14.0', category: 'Development', icon: '🧠' },
        { name: 'CUDA Toolkit', version: '12.2', category: 'Development', icon: '⚡' },
        { name: 'VS Code', version: '1.85.0', category: 'Development', icon: '💻' }
      ],
      additionalNotes: 'Primary workstation for Deep Learning and GPU heavy compute.'
    }
  },
  {
    name: 'LAB-PC-02',
    location: 'Lab Room A - Station 2',
    specifications: 'OS: Windows 11 Enterprise\nCPU: AMD Ryzen 9 7950X\nRAM: 32GB DDR5\nGPU: NVIDIA RTX 3080 Ti',
    status: 'available',
    systemDetails: {
      operatingSystem: 'Windows',
      osVersion: 'Windows 11 Pro 23H2',
      architecture: 'x86_64',
      processor: 'AMD Ryzen 9 7950X',
      ram: '32 GB',
      storage: '1 TB NVMe SSD',
      gpu: 'NVIDIA RTX 3080 Ti (12GB VRAM)',
      installedSoftware: [
        { name: 'SolidWorks', version: '2023', category: 'Design', icon: '📐' },
        { name: 'MATLAB', version: 'R2023b', category: 'Analysis', icon: '📊' },
        { name: 'AutoCAD', version: '2024', category: 'Design', icon: '🎨' }
      ],
      additionalNotes: 'CAD & Engineering Simulation Workstation.'
    }
  },
  {
    name: 'LAB-PC-03',
    location: 'Lab Room B - Station 1',
    specifications: 'OS: Dual Boot (Ubuntu / Win 11)\nCPU: Intel i7-13700K\nRAM: 32GB DDR4\nGPU: NVIDIA RTX 3070',
    status: 'available',
    systemDetails: {
      operatingSystem: 'Dual Boot',
      osVersion: 'Ubuntu 22.04 / Win 11',
      architecture: 'x86_64',
      processor: 'Intel Core i7-13700K',
      ram: '32 GB',
      storage: '1 TB SSD',
      gpu: 'NVIDIA RTX 3070',
      installedSoftware: [
        { name: 'Docker Desktop', version: '4.25', category: 'Development', icon: '🐳' },
        { name: 'Python', version: '3.11', category: 'Development', icon: '🐍' }
      ],
      additionalNotes: 'General purpose development node.'
    }
  }
];

const BASE_ADMIN = {
  firebaseUid: 'sys_admin_uid_staging_001',
  email: 'admin@ch.amrita.edu',
  name: 'System Administrator',
  role: 'admin'
};

async function seedBase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/negcesdb';
    console.log('🌱 Connecting to MongoDB for Base Seeding:', mongoUri);
    await mongoose.connect(mongoUri);

    // 1. Seed Computers
    for (const compData of BASE_COMPUTERS) {
      await Computer.findOneAndUpdate(
        { name: compData.name },
        compData,
        { upsert: true, new: true }
      );
      console.log(`  ✓ Computer [${compData.name}] ensured`);
    }

    // 2. Seed Base System Administrator
    const existingAdmin = await User.findOne({
      $or: [{ email: BASE_ADMIN.email }, { firebaseUid: BASE_ADMIN.firebaseUid }]
    });

    if (existingAdmin) {
      existingAdmin.email = BASE_ADMIN.email;
      existingAdmin.name = BASE_ADMIN.name;
      existingAdmin.role = BASE_ADMIN.role;
      existingAdmin.firebaseUid = BASE_ADMIN.firebaseUid;
      await existingAdmin.save();
    } else {
      await User.create(BASE_ADMIN);
    }
    console.log(`  ✓ Base Admin User [${BASE_ADMIN.email}] ensured`);

    console.log('✅ Base Database Seeding Completed Successfully.');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Base Seeding Error:', err);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
}

if (require.main === module) {
  seedBase();
}

module.exports = seedBase;
