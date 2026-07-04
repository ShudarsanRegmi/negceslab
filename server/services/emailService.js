const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER || 'your-email@gmail.com';
const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || 'your-app-password';

// Email configuration
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    })
  : nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass
      },
      requireTLS: true
    });

// Email templates
const emailTemplates = {
  bookingApproved: (userName, computerName, startDate, endDate, startTime, endTime) => ({
    subject: 'Lab Computer Booking Confirmation - Approved',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lab Computer Booking Approved</title>
      </head>
      <body>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Bar -->
          <div style="background-color: #059669; padding: 35px 40px; text-align: left; border-bottom: 3px solid #047857;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #a7f3d0;">Reservation Confirmed</span>
            <h1 style="margin: 5px 0 0 0; font-size: 26px; font-weight: 700; color: #ffffff;">Booking Approved</h1>
          </div>

          <!-- Main Content Body -->
          <div style="padding: 40px; background-color: #ffffff;">
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Your lab computer booking request has been reviewed and approved. The requested time slot is now reserved for your academic and research activities.
            </p>
            
            <!-- Booking Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #059669; padding: 25px; border-radius: 8px; margin: 0 0 30px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569;">Reservation Specs</span>
                <span style="font-size: 12px; font-weight: 700; padding: 4px 10px; background-color: #d1fae5; color: #065f46; border-radius: 9999px;">Approved</span>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500; width: 35%;">System Name</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${computerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Duration Dates</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${startDate} to ${endDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Reserved Time</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${startTime} - ${endTime}</td>
                </tr>
              </table>
            </div>

            <!-- Warning/Alert Box -->
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #d97706; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
              <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 15px; font-weight: 700;">Important Guidelines</h4>
              <ul style="margin: 0; padding-left: 20px; color: #b45309; font-size: 14px; line-height: 1.6;">
                <li style="margin-bottom: 6px;">Arrive at least 5 minutes prior to your scheduled reservation time.</li>
                <li style="margin-bottom: 6px;">Ensure you bring a valid student/staff identification card.</li>
                <li style="margin-bottom: 6px;">Adhere to standard laboratory security and hardware protocols.</li>
                <li>Make sure to log out of all active sessions and clean your desk when finished.</li>
              </ul>
            </div>

            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
              To cancel or modify your reservation, please update your dashboard status or contact the administrator at least 2 hours in advance.
            </p>

            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
              Have a productive computing session.
            </p>
          </div>

          <!-- Footer Area -->
          <div style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0; text-align: left;">
            <p style="margin: 0 0 8px 0; color: #334155; font-size: 14px; font-weight: 700;">
              Laboratory Management Team
            </p>
            <p style="margin: 0 0 15px 0; color: #64748b; font-size: 13px; line-height: 1.4;">
              Computer Science Department<br>
              Negces Lab Tracking System
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 11px;">
              This is an automated operational system message. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  bookingRejected: (userName, computerName, startDate, endDate, startTime, endTime, reason) => ({
    subject: 'Lab Computer Booking Update - Request Declined',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lab Computer Booking Update</title>
      </head>
      <body>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Bar -->
          <div style="background-color: #dc2626; padding: 35px 40px; text-align: left; border-bottom: 3px solid #b91c1c;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #fca5a5;">Status Update</span>
            <h1 style="margin: 5px 0 0 0; font-size: 26px; font-weight: 700; color: #ffffff;">Booking Request Declined</h1>
          </div>

          <!-- Main Content Body -->
          <div style="padding: 40px; background-color: #ffffff;">
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              We have reviewed your booking request for the laboratory computing resources. Regrettably, we are unable to approve your reservation request at this time.
            </p>
            
            <!-- Booking Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #dc2626; padding: 25px; border-radius: 8px; margin: 0 0 30px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569;">Requested Specs</span>
                <span style="font-size: 12px; font-weight: 700; padding: 4px 10px; background-color: #fee2e2; color: #991b1b; border-radius: 9999px;">Declined</span>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500; width: 35%;">System Name</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${computerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Duration Dates</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${startDate} to ${endDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Reserved Time</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${startTime} - ${endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Declined Reason</td>
                  <td style="padding: 10px 0; color: #b91c1c; font-size: 15px; font-weight: 700; line-height: 1.4;">${reason}</td>
                </tr>
              </table>
            </div>

            <!-- Info Box -->
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
              <h4 style="margin: 0 0 10px 0; color: #166534; font-size: 15px; font-weight: 700;">Alternative Solutions</h4>
              <ul style="margin: 0; padding-left: 20px; color: #15803d; font-size: 14px; line-height: 1.6;">
                <li style="margin-bottom: 6px;">Query other available systems or time slots in the dashboard.</li>
                <li style="margin-bottom: 6px;">Try scheduling sessions during off-peak times (early mornings or late afternoons).</li>
                <li style="margin-bottom: 6px;">Submit booking requests well in advance to secure allocation.</li>
                <li>Contact the supervisor or administrator desk directly for scheduling overrides.</li>
              </ul>
            </div>

            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
              You can submit a new booking request immediately using the reservation system dashboard.
            </p>

            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
              For further queries or overrides, contact the system administrator desk.
            </p>
          </div>

          <!-- Footer Area -->
          <div style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0; text-align: left;">
            <p style="margin: 0 0 8px 0; color: #334155; font-size: 14px; font-weight: 700;">
              Laboratory Management Team
            </p>
            <p style="margin: 0 0 15px 0; color: #64748b; font-size: 13px; line-height: 1.4;">
              Computer Science Department<br>
              Negces Lab Tracking System
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 11px;">
              This is an automated operational system message. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  bookingCancelled: (userName, computerName, startDate, endDate, startTime, endTime) => ({
    subject: 'Lab Computer Booking Cancellation Confirmation',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lab Computer Booking Cancellation</title>
      </head>
      <body>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Bar -->
          <div style="background-color: #ea580c; padding: 35px 40px; text-align: left; border-bottom: 3px solid #c2410c;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #ffedd5;">Status Update</span>
            <h1 style="margin: 5px 0 0 0; font-size: 26px; font-weight: 700; color: #ffffff;">Booking Cancelled</h1>
          </div>

          <!-- Main Content Body -->
          <div style="padding: 40px; background-color: #ffffff;">
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              This email confirms that your lab computer booking has been cancelled. The allocated time slot has been released back into the pool and is now available for other users to reserve.
            </p>
            
            <!-- Booking Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ea580c; padding: 25px; border-radius: 8px; margin: 0 0 30px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569;">Released Reservation</span>
                <span style="font-size: 12px; font-weight: 700; padding: 4px 10px; background-color: #ffedd5; color: #9a3412; border-radius: 9999px;">Cancelled</span>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500; width: 35%;">System Name</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${computerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Date Range</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${startDate} to ${endDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Reserved Time</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${startTime} - ${endTime}</td>
                </tr>
              </table>
            </div>

            <!-- Info Box -->
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
              <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 15px; font-weight: 700;">Release Impact</h4>
              <ul style="margin: 0; padding-left: 20px; color: #1d4ed8; font-size: 14px; line-height: 1.6;">
                <li style="margin-bottom: 6px;">The resource status is now marked as available.</li>
                <li style="margin-bottom: 6px;">No penalties or logs have been recorded for this cancellation.</li>
                <li>You can make new bookings immediately at any time.</li>
              </ul>
            </div>

            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for cancelling in advance so that other researchers can utilize the lab systems.
            </p>

            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
              Need a new session? You can schedule another one from the dashboard at any time.
            </p>
          </div>

          <!-- Footer Area -->
          <div style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0; text-align: left;">
            <p style="margin: 0 0 8px 0; color: #334155; font-size: 14px; font-weight: 700;">
              Laboratory Management Team
            </p>
            <p style="margin: 0 0 15px 0; color: #64748b; font-size: 13px; line-height: 1.4;">
              Computer Science Department<br>
              Negces Lab Tracking System
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 11px;">
              This is an automated operational system message. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  bookingExpired: (userName, computerName, startDate, endDate, startTime, endTime) => ({
    subject: 'Lab Computer Booking Expiry Notification',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lab Computer Booking Expiry</title>
      </head>
      <body>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Bar -->
          <div style="background-color: #4b5563; padding: 35px 40px; text-align: left; border-bottom: 3px solid #374151;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #e2e8f0;">Session Status</span>
            <h1 style="margin: 5px 0 0 0; font-size: 26px; font-weight: 700; color: #ffffff;">Session Completed</h1>
          </div>

          <!-- Main Content Body -->
          <div style="padding: 40px; background-color: #ffffff;">
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear <strong>${userName}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              This email confirms that your lab computer booking session has reached its scheduled end time and is now expired. The computer is now available for the next scheduled user.
            </p>
            
            <!-- Booking Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #4b5563; padding: 25px; border-radius: 8px; margin: 0 0 30px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569;">Completed Slot</span>
                <span style="font-size: 12px; font-weight: 700; padding: 4px 10px; background-color: #f1f5f9; color: #334155; border-radius: 9999px;">Completed</span>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500; width: 35%;">System Name</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${computerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Date Range</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${startDate} to ${endDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Reserved Time</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${startTime} - ${endTime}</td>
                </tr>
              </table>
            </div>

            <!-- Feedback Notice Box -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-left: 4px solid #d97706; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
              <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 15px; font-weight: 700;">Feedback and Issues</h4>
              <p style="margin: 0; color: #b45309; font-size: 14px; line-height: 1.6;">
                We strive to maintain high system reliability. If you faced hardware issues, missing packages, or general problems, please report them to the lab administrator team.
              </p>
            </div>

            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for using the laboratory computing environment responsibly.
            </p>

            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
              Need more computing time? Submit a new booking request in the dashboard at any time.
            </p>
          </div>

          <!-- Footer Area -->
          <div style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0; text-align: left;">
            <p style="margin: 0 0 8px 0; color: #334155; font-size: 14px; font-weight: 700;">
              Laboratory Management Team
            </p>
            <p style="margin: 0 0 15px 0; color: #64748b; font-size: 13px; line-height: 1.4;">
              Computer Science Department<br>
              Negces Lab Tracking System
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 11px;">
              This is an automated operational system message. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  adminNewBookingRequest: (adminName, userName, userEmail, computerName, startDate, endDate, startTime, endTime, reason, bookingId) => ({
    subject: `New Lab Booking Request [ID: ${bookingId}] - Action Required`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Booking Request</title>
      </head>
      <body>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Bar -->
          <div style="background-color: #1e3a8a; padding: 35px 40px; text-align: left; border-bottom: 3px solid #172554;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #bfdbfe;">Administrative Alert</span>
            <h1 style="margin: 5px 0 0 0; font-size: 26px; font-weight: 700; color: #ffffff;">New Booking Request</h1>
          </div>

          <!-- Main Content Body -->
          <div style="padding: 40px; background-color: #ffffff;">
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear <strong>${adminName}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              A new computer booking request has been submitted and is pending review. Please verify the booking parameters below and update its status.
            </p>
            
            <!-- Booking Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; padding: 25px; border-radius: 8px; margin: 0 0 30px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569;">Request Details</span>
                <span style="font-size: 12px; font-weight: 700; padding: 4px 10px; background-color: #dbeafe; color: #1e40af; border-radius: 9999px;">Pending Review</span>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500; width: 35%;">Booking ID</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${bookingId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Requester</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${userName} (${userEmail})</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Computer</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${computerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Date Range</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${startDate} to ${endDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Time Slot</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${startTime} - ${endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 500;">Reason</td>
                  <td style="padding: 10px 0; color: #0f172a; font-size: 15px; font-weight: 700; line-height: 1.4;">${reason}</td>
                </tr>
              </table>
            </div>

            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
              Please access the Negces Lab Tracking System admin portal to approve or reject this booking request.
            </p>
          </div>

          <!-- Footer Area -->
          <div style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0; text-align: left;">
            <p style="margin: 0 0 8px 0; color: #334155; font-size: 14px; font-weight: 700;">
              Laboratory Management System
            </p>
            <p style="margin: 0; color: #64748b; font-size: 13px;">
              Computer Science Department
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
      from: emailUser,
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

const sendAdminNewBookingRequestEmail = async (adminEmail, adminName, userName, userEmail, computerName, startDate, endDate, startTime, endTime, reason, bookingId) => {
  return await sendEmail(adminEmail, 'adminNewBookingRequest', [adminName, userName, userEmail, computerName, startDate, endDate, startTime, endTime, reason, bookingId]);
};

const sendSuperadminOtpEmail = async (userEmail, otp, validMinutes) => {
  try {
    const mailOptions = {
      from: emailUser,
      to: userEmail,
      subject: 'NEGCES Lab Superadmin OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Superadmin OTP</title>
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="margin-top: 0; color: #1f2937;">NEGCES Lab superadmin login</h2>
            <p style="color: #374151; font-size: 15px;">Use this OTP to complete your superadmin login.</p>
            <div style="font-size: 32px; letter-spacing: 8px; font-weight: 700; padding: 18px 20px; margin: 20px 0; background: #f3f4f6; border-radius: 8px; text-align: center; color: #111827;">
              ${otp}
            </div>
            <p style="color: #4b5563; font-size: 14px;">This OTP is valid for ${validMinutes} minutes. The verified session lasts 15 minutes.</p>
            <p style="color: #6b7280; font-size: 12px;">If you did not request this, ignore this email.</p>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Superadmin OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending superadmin OTP email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  sendBookingCancelledEmail,
  sendBookingExpiredEmail,
  sendAdminNewBookingRequestEmail,
  sendSuperadminOtpEmail,
  sendEmail
}; 
