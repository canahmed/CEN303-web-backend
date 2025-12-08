const nodemailer = require('nodemailer');
const config = require('../config');

// Create transporter
const createTransporter = () => {
    // If no SMTP credentials, defer to Ethereal auto account (even if NODE_ENV=production in local)
    if (!config.email.user || !config.email.password) {
        return null; // Will create test account on first use
    }

    return nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465, // true for 465, false for other ports
        auth: {
            user: config.email.user,
            pass: config.email.password
        }
    });
};

let transporter = createTransporter();

/**
 * Get or create email transporter
 * Uses Ethereal for development if no email config is provided
 */
const getTransporter = async () => {
    if (transporter) return transporter;

    // Create Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });

    console.log('📧 Using Ethereal test email account:', testAccount.user);
    return transporter;
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 */
const sendEmail = async ({ to, subject, text, html }) => {
    const emailTransporter = await getTransporter();

    const mailOptions = {
        from: config.email.from,
        to,
        subject,
        text,
        html
    };

    const info = await emailTransporter.sendMail(mailOptions);

    // Log preview URL for Ethereal
    if (config.nodeEnv === 'development') {
        console.log('📧 Email preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return info;
};

/**
 * Send email verification email
 * @param {string} to - Recipient email
 * @param {string} name - User name
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (to, name, token) => {
    const verificationUrl = `${config.frontendUrl}/verify-email/${token}`;

    // Log the verification link so it can be used in local/dev even if email fails
    console.log('Email verification link:', verificationUrl);

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
