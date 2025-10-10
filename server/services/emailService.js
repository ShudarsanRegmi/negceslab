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
    subject: 'Lab Computer Booking Confirmation - Your Request Has Been Approved',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lab Computer Booking Approved</title>
      </head>
      <body>
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px 40px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎉 Booking Approved!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your lab computer reservation is confirmed</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Great news! Your lab computer booking request has been <strong style="color: #4CAF50;">approved</strong> and confirmed. 
              We're pleased to reserve the requested computer for your use during the specified time slot.
            </p>
            
            <!-- Booking Details Card -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #4CAF50; padding: 25px; border-radius: 8px; margin: 30px 0;">
              <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px;">📋 Booking Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500; width: 30%;">Computer:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${computerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500;">Date Range:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${startDate} to ${endDate}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500;">Time Slot:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${startTime} - ${endTime}</td>
                </tr>
              </table>
            </div>

            <!-- Important Information -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="margin: 0 0 15px 0; color: #856404;">⚠️ Important Reminders</h4>
              <ul style="margin: 0; padding-left: 20px; color: #856404;">
                <li style="margin-bottom: 8px;">Please arrive at least 5 minutes before your scheduled time slot</li>
                <li style="margin-bottom: 8px;">Bring a valid ID for verification purposes</li>
                <li style="margin-bottom: 8px;">Follow all laboratory safety protocols and guidelines</li>
                <li>Log out and clean up your workspace when finished</li>
              </ul>
            </div>

            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0;">
              If you need to cancel or modify your booking, please contact the lab administrator at least 2 hours in advance. 
              For any questions or technical support, feel free to reach out to our team.
            </p>

            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0;">
              We look forward to supporting your academic and research activities. Have a productive session!
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 25px 40px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
              Best regards,<br>
              <strong style="color: #333;">Laboratory Management Team</strong><br>
              Computer Science Department
            </p>
            <p style="margin: 10px 0 0 0; color: #adb5bd; font-size: 12px;">
              This is an automated message. Please do not reply directly to this email.
              For support, contact the lab administrator.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  bookingRejected: (userName, computerName, startDate, endDate, startTime, endTime, reason) => ({
    subject: 'Lab Computer Booking Update - Request Status Notification',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lab Computer Booking Update</title>
      </head>
      <body>
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px 40px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">📋 Booking Status Update</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Important information about your reservation request</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Thank you for your interest in using our laboratory facilities. After careful review of your booking request, 
              we regret to inform you that we are <strong style="color: #f44336;">unable to approve</strong> your reservation 
              at this time.
            </p>
            
            <!-- Booking Details Card -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #f44336; padding: 25px; border-radius: 8px; margin: 30px 0;">
              <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px;">📋 Requested Booking Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500; width: 30%;">Computer:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${computerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500;">Date Range:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${startDate} to ${endDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500;">Time Slot:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${startTime} - ${endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500;">Status Reason:</td>
                  <td style="padding: 12px 0; color: #d32f2f; font-weight: 600;">${reason}</td>
                </tr>
              </table>
            </div>

            <!-- Alternative Options -->
            <div style="background-color: #e8f5e8; border: 1px solid #c8e6c9; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="margin: 0 0 15px 0; color: #2e7d32;">💡 Alternative Options</h4>
              <ul style="margin: 0; padding-left: 20px; color: #2e7d32;">
                <li style="margin-bottom: 8px;">Check available time slots for the same or different computers</li>
                <li style="margin-bottom: 8px;">Consider booking during off-peak hours for better availability</li>
                <li style="margin-bottom: 8px;">Submit your request earlier to secure preferred time slots</li>
                <li>Contact the lab administrator for assistance with scheduling</li>
              </ul>
            </div>

            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0;">
              We understand this may be disappointing, and we apologize for any inconvenience. We encourage you to 
              submit a new booking request with different parameters or alternative time slots. Our lab resources are 
              in high demand, and we strive to accommodate as many users as possible.
            </p>

            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0;">
              For assistance with finding suitable alternatives or if you have questions about the rejection reason, 
              please don't hesitate to contact our lab administrator. We're here to help you find the best solution 
              for your computing needs.
            </p>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <p style="margin: 0; color: #856404; font-weight: 500;">
                🔄 <strong>Next Steps:</strong> You can submit a new booking request immediately through the lab booking system.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 25px 40px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
              Best regards,<br>
              <strong style="color: #333;">Laboratory Management Team</strong><br>
              Computer Science Department
            </p>
            <p style="margin: 10px 0 0 0; color: #adb5bd; font-size: 12px;">
              This is an automated message. Please do not reply directly to this email.
              For support, contact the lab administrator.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  bookingCancelled: (userName, computerName, startDate, endDate, startTime, endTime) => ({
    subject: 'Lab Computer Booking Cancellation Confirmation - Reservation Updated',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lab Computer Booking Cancellation</title>
      </head>
      <body>
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px 40px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🔄 Booking Cancelled</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your reservation has been successfully cancelled</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              We're writing to confirm that your lab computer booking has been <strong style="color: #ff9800;">successfully cancelled</strong>. 
              The previously reserved time slot has been released and is now available for other users to book.
            </p>
            
            <!-- Booking Details Card -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #ff9800; padding: 25px; border-radius: 8px; margin: 30px 0;">
              <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px;">📋 Cancelled Booking Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500; width: 30%;">Computer:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${computerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500;">Date Range:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${startDate} to ${endDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500;">Time Slot:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${startTime} - ${endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500;">Status:</td>
                  <td style="padding: 12px 0; color: #ff9800; font-weight: 600;">✅ Cancelled Successfully</td>
                </tr>
              </table>
            </div>

            <!-- Information Notice -->
            <div style="background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="margin: 0 0 15px 0; color: #1565c0;">ℹ️ What This Means</h4>
              <ul style="margin: 0; padding-left: 20px; color: #1565c0;">
                <li style="margin-bottom: 8px;">The computer is now available for other users during this time slot</li>
                <li style="margin-bottom: 8px;">No charges or penalties apply for this cancellation</li>
                <li style="margin-bottom: 8px;">Your booking history has been updated to reflect the cancellation</li>
                <li>You can make a new booking request at any time through the system</li>
              </ul>
            </div>

            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0;">
              We understand that plans can change, and we appreciate you cancelling your booking in advance to allow 
              other students and researchers to utilize the lab resources. This helps us maintain an efficient and 
              fair booking system for everyone.
            </p>

            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0;">
              If you need to make a new reservation, you can submit a new booking request through our lab booking 
              system at any time. We're here to support your academic and research activities whenever you need 
              access to our computing facilities.
            </p>

            <!-- Quick Action -->
            <div style="background-color: #e8f5e8; border: 1px solid #c8e6c9; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="margin: 0; color: #2e7d32; font-weight: 500;">
                🚀 <strong>Ready to book again?</strong> Access the lab booking system to submit a new request.
              </p>
            </div>

            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0;">
              If you have any questions about this cancellation or need assistance with future bookings, 
              please don't hesitate to contact our lab administrator team.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 25px 40px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
              Best regards,<br>
              <strong style="color: #333;">Laboratory Management Team</strong><br>
              Computer Science Department
            </p>
            <p style="margin: 10px 0 0 0; color: #adb5bd; font-size: 12px;">
              This is an automated message. Please do not reply directly to this email.
              For support, contact the lab administrator.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  bookingExpired: (userName, computerName, startDate, endDate, startTime, endTime) => ({
    subject: 'Lab Computer Booking Expiry Notification - Session Completed',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lab Computer Booking Expiry</title>
      </head>
      <body>
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%); color: white; padding: 30px 40px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">⏰ Booking Session Completed</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your reserved time slot has concluded</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              We hope you had a productive session! This email confirms that your lab computer booking has 
              <strong style="color: #9e9e9e;">reached its scheduled end time</strong> and has now expired. 
              The computer is now available for the next scheduled user or for new reservations.
            </p>
            
            <!-- Booking Details Card -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #9e9e9e; padding: 25px; border-radius: 8px; margin: 30px 0;">
              <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px;">📋 Completed Session Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500; width: 30%;">Computer:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${computerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500;">Date Range:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${startDate} to ${endDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500;">Time Slot:</td>
                  <td style="padding: 12px 0; color: #333; font-weight: 600;">${startTime} - ${endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6c757d; font-weight: 500;">Status:</td>
                  <td style="padding: 12px 0; color: #9e9e9e; font-weight: 600;">✅ Session Completed</td>
                </tr>
              </table>
            </div>

            <!-- Session Summary -->
            <div style="background-color: #e8f5e8; border: 1px solid #c8e6c9; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="margin: 0 0 15px 0; color: #2e7d32;">🎯 Session Summary</h4>
              <ul style="margin: 0; padding-left: 20px; color: #2e7d32;">
                <li style="margin-bottom: 8px;">Your booking session has been completed successfully</li>
                <li style="margin-bottom: 8px;">We hope you accomplished your academic or research objectives</li>
                <li style="margin-bottom: 8px;">The computer has been logged out and is ready for the next user</li>
                <li>Thank you for following lab protocols and guidelines</li>
              </ul>
            </div>

            <!-- Feedback Request -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="margin: 0 0 15px 0; color: #856404;">💭 Your Feedback Matters</h4>
              <p style="margin: 0; color: #856404;">
                We continuously strive to improve our lab facilities and services. If you experienced any issues 
                during your session or have suggestions for improvement, we'd love to hear from you. 
                Please consider sharing your feedback with the lab administrator.
              </p>
            </div>

            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0;">
              We hope your session was productive and that our computing resources helped advance your academic 
              or research goals. Whether you were working on assignments, conducting research, or developing projects, 
              we're glad we could provide the tools you needed.
            </p>

            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0;">
              If you need to use the lab computers again in the future, you can submit new booking requests through 
              our reservation system at any time. We maintain regular availability throughout the week to accommodate 
              various academic schedules and project requirements.
            </p>

            <!-- Quick Action -->
            <div style="background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="margin: 0; color: #1565c0; font-weight: 500;">
                🔄 <strong>Need more lab time?</strong> Submit a new booking request through the lab reservation system.
              </p>
            </div>

            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0;">
              Thank you for using our laboratory facilities responsibly. If you have any questions or need assistance 
              with future bookings, our lab administrator team is always available to help.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 25px 40px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
              Best regards,<br>
              <strong style="color: #333;">Laboratory Management Team</strong><br>
              Computer Science Department
            </p>
            <p style="margin: 10px 0 0 0; color: #adb5bd; font-size: 12px;">
              This is an automated message. Please do not reply directly to this email.
              For support, contact the lab administrator.
            </p>
          </div>
        </div>
      </body>
      </html>
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