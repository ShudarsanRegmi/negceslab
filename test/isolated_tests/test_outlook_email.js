const path = require('path');
const dotenv = require(path.join(__dirname, '../../server/node_modules/dotenv'));
const nodemailer = require(path.join(__dirname, '../../server/node_modules/nodemailer'));

// Load environment variables from server/.env file
const envPath = path.join(__dirname, '../../server/.env');
dotenv.config({ path: envPath });

const outlookMail = process.env.OUTLOOK_MAIL;
const outlookPass = process.env.OUTLOOK_APP_PASS;

console.log('--------------------------------------------------');
console.log('  NEGCES Lab - Outlook SMTP Isolated Test Script  ');
console.log('--------------------------------------------------');
console.log(`Config File: ${envPath}`);
console.log(`OUTLOOK_MAIL: ${outlookMail || 'NOT SET'}`);
console.log(`OUTLOOK_APP_PASS: ${outlookPass ? '***** (Set)' : 'NOT SET'}`);

if (!outlookMail || !outlookPass) {
  console.error('\n[ERROR] OUTLOOK_MAIL and OUTLOOK_APP_PASS must be set in server/.env');
  process.exit(1);
}

const recipientEmail = 'ch.sc.u4cys23055@ch.students.amrita.edu';

// Create Outlook / Office365 Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // STARTTLS
  requireTLS: true,
  auth: {
    user: outlookMail,
    pass: outlookPass
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

async function runTest() {
  console.log(`\nAttempting to send test email to ${recipientEmail}...`);

  try {
    // 1. Verify SMTP connection & auth credentials
    console.log('Verifying SMTP connection to smtp.office365.com:587...');
    await transporter.verify();
    console.log('[SUCCESS] SMTP Connection and Auth credentials verified successfully!');

    // 2. Send Test Email
    const mailOptions = {
      from: `NEGCES Lab Notification System <${outlookMail}>`,
      to: recipientEmail,
      subject: 'NEGCES Lab - Outlook SMTP Test Email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Outlook SMTP Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h2 style="color: #0284c7; margin-top: 0;">Outlook SMTP Integration Successful</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">
              This is a test notification sent from the NEGCES Lab system using Outlook Office365 SMTP authentication.
            </p>
            <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #475569; margin: 20px 0;">
              <strong>Sender:</strong> ${outlookMail}<br>
              <strong>Recipient:</strong> ${recipientEmail}<br>
              <strong>Timestamp:</strong> ${new Date().toLocaleString()}
            </div>
            <p style="color: #64748b; font-size: 12px;">If you received this message, Outlook SMTP integration is working correctly.</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('\n================================================--');
    console.log(' [SUCCESS] Email sent successfully!');
    console.log(` Message ID: ${info.messageId}`);
    console.log(` Response:   ${info.response}`);
    console.log('================================================--');
  } catch (error) {
    console.error('\n================================================--');
    console.error(' [FAILED] Error sending email via Outlook SMTP:');
    console.error(` Error Name:    ${error.name}`);
    console.error(` Error Message: ${error.message}`);
    if (error.code) console.error(` Error Code:    ${error.code}`);
    if (error.command) console.error(` Command:       ${error.command}`);
    console.error('================================================--');
    process.exit(1);
  }
}

runTest();
