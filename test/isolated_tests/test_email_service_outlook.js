const path = require('path');
const dotenv = require(path.join(__dirname, '../../server/node_modules/dotenv'));

// Load environment variables from server/.env file
const envPath = path.join(__dirname, '../../server/.env');
dotenv.config({ path: envPath });

const emailService = require(path.join(__dirname, '../../server/services/emailService.js'));

async function testEmailService() {
  console.log('Testing emailService.js with Outlook SMTP configuration...');
  const testRecipient = 'ch.sc.u4cys23055@ch.students.amrita.edu';
  
  const result = await emailService.sendBookingApprovedEmail(
    testRecipient,
    'Test Student',
    'Lab PC 01',
    '2026-09-15',
    '2026-09-15',
    '10:00 AM',
    '01:00 PM'
  );

  console.log('Email Service Send Result:', result);
}

testEmailService();
