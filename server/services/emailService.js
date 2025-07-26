const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Email templates
const emailTemplates = {
  bookingApproved: (userName, computerName, startDate, endDate, startTime, endTime) => ({
    subject: 'Booking Approved - Lab Computer',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Booking Approved!</h2>
        <p>Dear ${userName},</p>
        <p>Your booking request has been <strong>approved</strong>!</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          <p><strong>Computer:</strong> ${computerName}</p>
          <p><strong>Date:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        </div>
        
        <p>Please arrive on time for your scheduled slot. If you need to cancel or modify your booking, please contact the lab administrator.</p>
        
        <p>Best regards,<br>Lab Management Team</p>
      </div>
    `
  }),

  bookingRejected: (userName, computerName, startDate, endDate, startTime, endTime, reason) => ({
    subject: 'Booking Rejected - Lab Computer',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">Booking Rejected</h2>
        <p>Dear ${userName},</p>
        <p>Unfortunately, your booking request has been <strong>rejected</strong>.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          <p><strong>Computer:</strong> ${computerName}</p>
          <p><strong>Date:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
          <p><strong>Reason for rejection:</strong> ${reason}</p>
        </div>
        
        <p>You may submit a new booking request with different parameters.</p>
        
        <p>Best regards,<br>Lab Management Team</p>
      </div>
    `
  }),

  bookingCancelled: (userName, computerName, startDate, endDate, startTime, endTime) => ({
    subject: 'Booking Cancelled - Lab Computer',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">Booking Cancelled</h2>
        <p>Dear ${userName},</p>
        <p>Your booking has been <strong>cancelled</strong>.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          <p><strong>Computer:</strong> ${computerName}</p>
          <p><strong>Date:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        </div>
        
        <p>You may submit a new booking request if needed.</p>
        
        <p>Best regards,<br>Lab Management Team</p>
      </div>
    `
  }),

  bookingExpired: (userName, computerName, startDate, endDate, startTime, endTime) => ({
    subject: 'Booking Expired - Lab Computer',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9e9e9e;">Booking Expired</h2>
        <p>Dear ${userName},</p>
        <p>Your booking has <strong>expired</strong>.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          <p><strong>Computer:</strong> ${computerName}</p>
          <p><strong>Date:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        </div>
        
        <p>You may submit a new booking request if you need to use the lab computers.</p>
        
        <p>Best regards,<br>Lab Management Team</p>
      </div>
    `
  })
};

// Email sending function
const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](...data);
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Specific email functions
const sendBookingApprovedEmail = async (userEmail, userName, computerName, startDate, endDate, startTime, endTime) => {
  return await sendEmail(userEmail, 'bookingApproved', [userName, computerName, startDate, endDate, startTime, endTime]);
};

const sendBookingRejectedEmail = async (userEmail, userName, computerName, startDate, endDate, startTime, endTime, reason) => {
  return await sendEmail(userEmail, 'bookingRejected', [userName, computerName, startDate, endDate, startTime, endTime, reason]);
};

const sendBookingCancelledEmail = async (userEmail, userName, computerName, startDate, endDate, startTime, endTime) => {
  return await sendEmail(userEmail, 'bookingCancelled', [userName, computerName, startDate, endDate, startTime, endTime]);
};

const sendBookingExpiredEmail = async (userEmail, userName, computerName, startDate, endDate, startTime, endTime) => {
  return await sendEmail(userEmail, 'bookingExpired', [userName, computerName, startDate, endDate, startTime, endTime]);
};

module.exports = {
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  sendBookingCancelledEmail,
  sendBookingExpiredEmail,
  sendEmail
}; 