const { Resend } = require('resend');
const config = require('../config');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 */
const sendEmail = async ({ to, subject, text, html }) => {
  // If no API key, log and skip
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️ RESEND_API_KEY not configured, skipping email');
    console.log('📧 Email would be sent to:', to);
    console.log('📧 Subject:', subject);
    console.log('💡 Tip: Set RESEND_API_KEY environment variable in Render dashboard');
    return { id: 'skipped' };
  }

  // Test mode: Resend free tier only allows sending to verified email
  // In development/test, override recipient to verified test email
  const isTestMode = process.env.NODE_ENV !== 'production';
  const testEmail = 'canahmed@icloud.com'; // Verified email in Resend
  const actualRecipient = to;
  const emailRecipient = isTestMode ? testEmail : to;

  console.log('📧 Attempting to send email via Resend...');
  console.log('   Mode:', isTestMode ? 'TEST (redirecting to verified email)' : 'PRODUCTION');
  console.log('   Original recipient:', actualRecipient);
  if (isTestMode) {
    console.log('   ⚠️ TEST MODE: Email will be sent to:', emailRecipient);
  } else {
    console.log('   To:', emailRecipient);
  }
  console.log('   Subject:', subject);
  console.log('   API Key present:', process.env.RESEND_API_KEY ? 'Yes' : 'No');

  try {
    const { data, error } = await resend.emails.send({
      from: 'Smart Campus <onboarding@resend.dev>',
      to: [emailRecipient],
      subject: isTestMode ? `[TEST - ${actualRecipient}] ${subject}` : subject,
      text,
      html: isTestMode ? `
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin-bottom: 20px;">
          <strong>⚠️ TEST MODE</strong><br>
          This email was originally intended for: <strong>${actualRecipient}</strong><br>
          In production, it will be sent to the actual recipient.
        </div>
        ${html}
      ` : html
    });

    if (error) {
      console.error('❌ Resend API error:', JSON.stringify(error, null, 2));
      throw new Error(`Email send failed: ${error.message || JSON.stringify(error)}`);
    }

    console.log('✅ Email sent successfully!');
    console.log('   Email ID:', data.id);
    if (isTestMode) {
      console.log('   💡 Remember: In production, emails will go to actual recipients');
    }
    return data;
  } catch (err) {
    console.error('❌ Email service error:', err.message);
    console.error('   Stack:', err.stack);
    throw err;
  }
};

/**
 * Send email verification email
 * @param {string} to - Recipient email
 * @param {string} name - User name
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (to, name, token) => {
  const verificationUrl = `${config.frontendUrl}/verify-email/${token}`;

  // Log the verification link
  console.log('📧 Email verification link:', verificationUrl);

  const subject = 'Smart Campus - Email Doğrulama';
  const text = `Merhaba ${name},\n\nEmail adresinizi doğrulamak için aşağıdaki linke tıklayın:\n${verificationUrl}\n\nBu link 24 saat geçerlidir.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Smart Campus - Email Doğrulama</h2>
      <p>Merhaba <strong>${name}</strong>,</p>
      <p>Email adresinizi doğrulamak için aşağıdaki butona tıklayın:</p>
      <a href="${verificationUrl}" 
         style="display: inline-block; padding: 12px 24px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Email Adresimi Doğrula
      </a>
      <p style="color: #7f8c8d; font-size: 12px;">Bu link 24 saat geçerlidir.</p>
      <p style="color: #7f8c8d; font-size: 12px;">Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelin.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} name - User name
 * @param {string} token - Reset token
 */
const sendPasswordResetEmail = async (to, name, token) => {
  const resetUrl = `${config.frontendUrl}/reset-password/${token}`;

  const subject = 'Smart Campus - Şifre Sıfırlama';
  const text = `Merhaba ${name},\n\nŞifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n${resetUrl}\n\nBu link 1 saat geçerlidir.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Smart Campus - Şifre Sıfırlama</h2>
      <p>Merhaba <strong>${name}</strong>,</p>
      <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
      <a href="${resetUrl}" 
         style="display: inline-block; padding: 12px 24px; background-color: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Şifremi Sıfırla
      </a>
      <p style="color: #7f8c8d; font-size: 12px;">Bu link 1 saat geçerlidir.</p>
      <p style="color: #7f8c8d; font-size: 12px;">Eğer şifre sıfırlama talebinde bulunmadıysanız, bu emaili görmezden gelin.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};
