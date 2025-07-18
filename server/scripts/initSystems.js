require('dotenv').config();
const mongoose = require('mongoose');
const System = require('../models/system');

const INITIAL_SYSTEMS = [
  {
    systemNo: 1,
    specs: {
      processor: 'Intel Core i5',
      ram: '16GB',
      storage: '512GB SSD',
      monitor: '24" Monitor',
      os: 'Windows 10'
    }
  },
  {
    systemNo: 2,
    specs: {
      processor: 'Intel Core i5',
      ram: '16GB',
      storage: '512GB SSD',
      monitor: '24" Monitor',
      os: 'Windows 10'
    }
  },
  {
    systemNo: 3,
    specs: {
      processor: 'Intel Core i5',
      ram: '16GB',
      storage: '512GB SSD',
      monitor: '24" Monitor',
      os: 'Windows 10'
    }
  },
  {
    systemNo: 4,
    specs: {
      processor: 'Intel Core i5',
      ram: '16GB',
      storage: '512GB SSD',
      monitor: '24" Monitor',
      os: 'Windows 10'
    }
  },
  {
    systemNo: 5,
    specs: {
      processor: 'Intel Core i5',
      ram: '16GB',
      storage: '512GB SSD',
      monitor: '24" Monitor',
      os: 'Windows 10'
    }
  },
  {
    systemNo: 6,
    specs: {
      processor: 'Intel Core i5',
      ram: '16GB',
      storage: '512GB SSD',
      monitor: '24" Monitor',
      os: 'Windows 10'
    }
  },
  {
    systemNo: 7,
    specs: {
      processor: 'Intel Core i5',
      ram: '16GB',
      storage: '512GB SSD',
      monitor: '24" Monitor',
      os: 'Windows 10'
    }
  },
  {
    systemNo: 8,
    specs: {
      processor: 'Intel Core i5',
      ram: '16GB',
      storage: '512GB SSD',
      monitor: '24" Monitor',
      os: 'Windows 10'
    }
  }
];

async function initializeSystems() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing systems
    await System.deleteMany({});
    console.log('Cleared existing systems');

    // Create new systems
    for (const sysConfig of INITIAL_SYSTEMS) {
      const system = new System(sysConfig);
      await system.save();
      console.log(`Created system ${sysConfig.systemNo}`);
    }

    console.log('Successfully initialized all systems');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  initializeSystems();
}

module.exports = initializeSystems; 
initializeSystems(); 