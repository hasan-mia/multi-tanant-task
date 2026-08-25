require('dotenv').config();

const logoUrl =
  process.env.LOGO_URL ||
  'https://res.cloudinary.com/dkulytwjq/image/upload/v1765451416/fhgyy6s7e94foa932gcb.png';

const frontendUrl =
  process.env.FRONTEND_URL || 'https://beyondtaxconsultants.com/';

const sendVerificationLinkTemplate = (data) => {
  const { user, verifyLink } = data;
  const companyName = 'Beyond Tax Consultants';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Email Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f7fa;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .header {
          text-align: center;
          padding: 24px;
          border-bottom: 1px solid #eee;
        }
        
        /* Logo Container */
        .logo-container {
          display: inline-block;
          text-align: left;
        }
        
        /* Logo Badge */
        .logo-badge {
          display: inline-block;
          width: 48px;
          height: 40px;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          border-radius: 8px;
          text-align: center;
          vertical-align: middle;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
          margin-right: 12px;
        }
        
        .logo-text {
          color: #fff;
          font-weight: bold;
          font-size: 18px;
          line-height: 40px;
          letter-spacing: 1px;
        }
        
        /* Company Info */
        .company-info {
          display: inline-block;
          vertical-align: middle;
          text-align: left;
        }
        
        .company-name {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin: 0;
          line-height: 1.2;
        }
        
        .company-tagline {
          font-size: 12px;
          color: #888;
          margin: 2px 0 0 0;
        }
        
        .content {
          padding: 24px;
        }
        .content h1 {
          font-size: 20px;
          color: #333;
          margin-bottom: 16px;
        }
        .content p {
          font-size: 16px;
          color: #555;
          line-height: 1.6;
        }
        .content a.button {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 24px;
          background-color: #007bff;
          color: #fff !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          font-size: 13px;
          color: #888;
          padding: 20px;
          border-top: 1px solid #eee;
          background-color: #fafafa;
        }
        .footer a {
          color: #007bff;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <div class="logo-badge">
              <span class="logo-text">BTC</span>
            </div>
            <div class="company-info">
              <p class="company-name">Beyond Tax Consultants</p>
              <p class="company-tagline">Certified Public Accountants</p>
            </div>
          </div>
        </div>
        <div class="content">
          <h1>Reset your password</h1>
          <p>Hi ${user.first_name || 'there'},</p>
          <p>
            To reset your password, please click the button below. This link will expire in <strong>15 minutes</strong>.
          </p>
          <p style="text-align: center;">
            <a href="${verifyLink}" class="button">Reset Now</a>
          </p>
          <p>
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
          <br />
          <a href="${frontendUrl}">Visit our website</a>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendBookingEmailTemplate = (data) => {
  const companyName = data.service?.company_name || 'Beyond Tax Consultants';

  const {
    customer_name,
    customer_email,
    scheduled_date,
    scheduled_time,
    timezone = 'UTC',
    service,
    google_meet_link,
    meeting_location,
    customer_phone,
    description,
    reschedule_url,
    cancel_url,
    is_new_client,
    calendarLink,
  } = data;

  // Correct date formatting function
  const formatDateTime = (date, time) => {
    if (!date) return 'Not Provided';

    // Combine date + time; fallback to 00:00 if time missing
    const dateTimeString = time ? `${date}T${time}:00` : `${date}T00:00:00`;

    try {
      const dateObj = new Date(dateTimeString);
      return dateObj.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Booking Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f7fa; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
        .header { text-align: center; padding: 24px; border-bottom: 1px solid #eee; }
        .header img { max-width: 140px; }
        
        /* Logo Container */
        .logo-container {
          display: inline-block;
          text-align: left;
        }
        
        /* Logo Badge */
        .logo-badge {
          display: inline-block;
          width: 48px;
          height: 40px;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          border-radius: 8px;
          text-align: center;
          vertical-align: middle;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
          margin-right: 12px;
        }
        
        .logo-text {
          color: #fff;
          font-weight: bold;
          font-size: 18px;
          line-height: 40px;
          letter-spacing: 1px;
        }
        
        /* Company Info */
        .company-info {
          display: inline-block;
          vertical-align: middle;
          text-align: left;
        }
        
        .company-name {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin: 0;
          line-height: 1.2;
        }
        
        .company-tagline {
          font-size: 12px;
          color: #888;
          margin: 2px 0 0 0;
        }
        .content { padding: 24px; }
        .content h1 { font-size: 20px; color: #333; margin-bottom: 16px; }
        .content p { font-size: 16px; color: #555; line-height: 1.6; }
        .content a.button { display: inline-block; margin: 10px 0 20px 0; padding: 12px 24px; background-color: #007bff; color: #fff !important; text-decoration: none; border-radius: 4px; font-weight: bold; }
        .footer { text-align: center; font-size: 13px; color: #888; padding: 20px; border-top: 1px solid #eee; background-color: #fafafa; }
        .footer a { color: #007bff; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <div class="logo-badge">
              <span class="logo-text">BTC</span>
            </div>
            <div class="company-info">
              <p class="company-name">Beyond Tax Consultants</p>
              <p class="company-tagline">Certified Public Accountants</p>
            </div>
          </div>
        </div>
        <div class="content">
          <h1>Booking Confirmation</h1>
          <p>Hi ${customer_name || 'there'},</p>
          <p>Your appointment for <strong>${
            service?.title || 'our service'
          }</strong> has been confirmed.</p>
          <p><strong>Date & Time:</strong> ${formatDateTime(
            scheduled_date,
            scheduled_time
          )}</p>
          <p><strong>Location / Meeting Link:</strong> ${
            google_meet_link || meeting_location || 'Online Meeting'
          }</p>
          <p><strong>Organizer:</strong> ${
            service?.organizer_email || companyName
          }</p>
          <p><strong>Telephone:</strong> ${customer_phone || 'Not Provided'}</p>
          <p><strong>New Client:</strong> ${is_new_client ? 'Yes' : 'No'}</p>
          <p><strong>Description / Discussion Points:</strong><br />${
            description || 'No description provided.'
          }</p>
          ${
            reschedule_url
              ? `<p style="text-align:center;"><a href="${reschedule_url}" class="button">Reschedule</a></p>`
              : ''
          }
          ${
            cancel_url
              ? `<p style="text-align:center;"><a href="${cancel_url}" class="button" style="background-color:#dc3545;">Cancel</a></p>`
              : ''
          }
          <p>We look forward to speaking with you!</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
          <br /><a href="${service?.website || '#'}">Visit our website</a>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendVerificationLinkTemplate,
  sendBookingEmailTemplate,
};
