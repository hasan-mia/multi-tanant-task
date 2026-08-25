require('dotenv').config();
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const sgMail = require('@sendgrid/mail');

// Twilio SMS Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Twilio Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Twilio Auth Token
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Twilio Phone Number
const client = twilio(accountSid, authToken);

// SendGrid Email Configuration
const sendGridApiKey = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(sendGridApiKey);

/**
 * Send a single SMS by Twilio
 * @param {string} to - Recipient's phone number
 * @param {string} message - SMS message content
 */
async function sendSingleSMS(to = '', message) {
  try {
    const response = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });
    console.log('SMS sent:', response.sid);
    return response;
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    throw error;
  }
}

/**
 * Send multiple SMS By Twilio
 * @param {string[]} recipients - Array of recipient phone numbers
 * @param {string} message - SMS message content
 */
async function sendBulkSMS(recipients, message) {
  try {
    const sendPromises = recipients.map((recipient) =>
      client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: recipient,
      })
    );
    const results = await Promise.all(sendPromises);
    console.log(
      'All SMS sent:',
      results.map((res) => res.sid)
    );
    return results;
  } catch (error) {
    console.error('Error sending bulk SMS:', error.message);
    throw error;
  }
}

/**
 * Send a single email by SendGrid
 * @param {string} to - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} text - Email text content
 */
async function sendSendGridSingleEmail(to, subject, text) {
  try {
    const msg = {
      to: to,
      from: process.env.SENDGRID_VERIFIED_EMAIL,
      subject: subject,
      text: text,
      html: text,
    };
    const response = await sgMail.send(msg);

    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send multiple emails by SendGrid
 * @param {string[]} recipients - Array of recipient email addresses
 * @param {string} subject - Email subject
 * @param {string} text - Email text content
 */
async function sendSendGridBulkEmails(recipients, subject, text) {
  try {
    const messages = recipients.map((recipient) => ({
      to: recipient,
      from: process.env.SENDGRID_VERIFIED_EMAIL,
      subject: subject,
      text: text,
    }));
    const response = await sgMail.send(messages);
    console.log('All Emails sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending bulk emails:', error.message);
    throw error;
  }
}

/**
 * Send a single email using Nodemailer (Google, Yahoo, Twilio)
 * @param {string} to - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} text - Email text content (plain or HTML)
 */
async function sendSMTPSingleEmail({
  to,
  cc,
  bcc,
  subject,
  html,
  text,
  attachments,
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"BTC" <${process.env.SMTP_MAIL}>`,
      to, // single email or comma-separated list
      cc, // optional
      bcc, // optional
      subject,
      text: text || html?.replace(/<[^>]+>/g, ''), // fallback to stripped HTML
      html,
      attachments, // optional array
    });

    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = {
  sendSingleSMS,
  sendBulkSMS,
  sendSendGridSingleEmail,
  sendSendGridBulkEmails,
  sendSMTPSingleEmail,
};
