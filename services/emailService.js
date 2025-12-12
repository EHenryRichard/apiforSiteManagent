import EmailTemplate from '../utils/email/EmailTemplate.js';
import EmailSender from '../utils/email/EmailSender.js';

/**
 * Send verification email with token
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email
 * @param {string} params.token - Verification code
 * @param {string} [params.recipientName] - Optional recipient name
 * @param {string} [params.expiresIn] - Optional expiration time (default: 24 hours)
 * @param {string} [params.verificationLink] - Optional verification link
 * @returns {Promise<Object>} Status of email sending
 */
export const sendVerificationEmail = async ({
  email,
  token,
  recipientName,
  expiresIn,
  verificationLink,
}) => {
  try {
    // Generate HTML template
    const html = EmailTemplate.verificationEmail({
      recipientName: recipientName,
      verificationCode: token,
      expiresIn: expiresIn || '24 hours',
      verificationLink: verificationLink,
    });

    // Send email
    const result = await EmailSender.send({
      to: email,
      subject: 'Verify your email address',
      html: html,
    });

    return result;
  } catch (error) {
    console.error('Error in sendVerificationEmail:', error);
    return {
      success: false,
      error: 'Failed to send verification email',
      details: error.message,
    };
  }
};

/**
 * Send regenerated token email
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email
 * @param {string} params.token - New verification code
 * @param {string} [params.recipientName] - Optional recipient name
 * @param {string} [params.expiresIn] - Optional expiration time (default: 24 hours)
 * @param {string} [params.verificationLink] - Optional verification link
 * @returns {Promise<Object>} Status of email sending
 */
export const sendRegeneratedTokenEmail = async ({
  email,
  token,
  recipientName,
  expiresIn,
  verificationLink,
}) => {
  try {
    // Generate HTML template
    const html = EmailTemplate.regeneratedTokenEmail({
      recipientName: recipientName,
      verificationCode: token,
      expiresIn: expiresIn || '24 hours',
      verificationLink: verificationLink,
    });

    // Send email
    const result = await EmailSender.send({
      to: email,
      subject: 'New verification code',
      html: html,
    });

    return result;
  } catch (error) {
    console.error('Error in sendRegeneratedTokenEmail:', error);
    return {
      success: false,
      error: 'Failed to send regenerated token email',
      details: error.message,
    };
  }
};

/**
 * Send password reset email
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email
 * @param {string} [params.recipientName] - Optional recipient name
 * @param {string} [params.expiresIn] - Optional expiration time (default: 1 hour)
 * @param {string} [params.resetLink] - Optional password reset link
 * @returns {Promise<Object>} Status of email sending
 */
export const sendPasswordResetEmail = async ({ email, recipientName, expiresIn, resetLink }) => {
  try {
    // Generate HTML template (NO CODE - just magic link for security)
    const html = EmailTemplate.passwordResetEmail({
      recipientName: recipientName,
      expiresIn: expiresIn || '1 hour',
      resetLink: resetLink,
    });

    // Send email
    const result = await EmailSender.send({
      to: email,
      subject: 'Reset your password',
      html: html,
    });

    return result;
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    return {
      success: false,
      error: 'Failed to send password reset email',
      details: error.message,
    };
  }
};

/**
 * Send login verification email
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email
 * @param {string} [params.recipientName] - Optional recipient name
 * @param {string} [params.expiresIn] - Optional expiration time (default: 15 minutes)
 * @param {string} [params.verificationLink] - Optional verification link
 * @returns {Promise<Object>} Status of email sending
 */
export const sendLoginVerificationEmail = async ({
  email,
  recipientName,
  expiresIn,
  verificationLink,
  siteName,
}) => {
  try {
    // Generate HTML template (NO token, IP, device, or location - security!)
    const html = EmailTemplate.loginVerificationEmail({
      recipientName: recipientName,
      expiresIn: expiresIn || '15 minutes',
      verificationLink: verificationLink,
      siteName: process.env.APPNAME,
    });

    // Send email
    const result = await EmailSender.send({
      to: email,
      subject: 'Sign in to your account',
      html: html,
    });

    return result;
  } catch (error) {
    console.error('Error in sendLoginVerificationEmail:', error);
    return {
      success: false,
      error: 'Failed to send login verification email',
      details: error.message,
    };
  }
};
