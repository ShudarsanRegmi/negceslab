require('dotenv').config();
const mongoose = require('mongoose');
const Computer = require('./models/slot'); // slot.js is the Computer model

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Sample computers data
const sampleComputers = [
  {
    name: 'Computer 1',
    config: 'Intel i7, 16GB RAM, Windows 11',
    isAvailable: true,
    location: 'Lab A - Station 1'
  },
  {
    name: 'Computer 2', 
    config: 'Intel i5, 8GB RAM, Windows 11',
    isAvailable: true,
    location: 'Lab A - Station 2'
  },
  {
    name: 'Computer 3',
    config: 'Intel i7, 16GB RAM, Ubuntu 22.04',
    isAvailable: true,
    location: 'Lab A - Station 3'
  },
  {
    name: 'Computer 4',
    config: 'Intel i5, 8GB RAM, Windows 11',
    isAvailable: true,
    location: 'Lab A - Station 4'
  },
  {
    name: 'Computer 5',
    config: 'Intel i7, 32GB RAM, Windows 11',
    isAvailable: true,
    location: 'Lab B - Station 1'
  },
  {
    name: 'Computer 6',
    config: 'Intel i5, 16GB RAM, macOS',
    isAvailable: true,
    location: 'Lab B - Station 2'
  }
];

async function addSampleComputers() {
  try {
    console.log('Adding sample computers...');
    
    // Clear existing computers (optional)
    await Computer.deleteMany({});
    console.log('Cleared existing computers');
    
    // Add new computers
    const computers = await Computer.insertMany(sampleComputers);
    console.log(`Successfully added ${computers.length} computers:`);
    
    computers.forEach(computer => {
      console.log(`- ${computer.name} (${computer.location})`);
    });
    
    console.log('\nSample computers added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding computers:', error);
    process.exit(1);
  }
}

addSampleComputers(); 