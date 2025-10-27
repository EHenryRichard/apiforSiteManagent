import transporter from '../../config/emailConfig.js';

// Email Sender Class - Handles sending emails and returns status
class EmailSender {
  /**
   * Send email
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email address
   * @param {string} params.subject - Email subject
   * @param {string} params.html - HTML content
   * @param {string} [params.from] - Sender email (optional, uses env default)
   * @returns {Promise<Object>} Status of email sending
   */
  static async send({ to, subject, html, from }) {
    try {
      // Validate required parameters
      if (!to) {
        return {
          success: false,
          error: 'Recipient email address is required',
          code: 'MISSING_RECIPIENT',
        };
      }

      if (!subject) {
        return {
          success: false,
          error: 'Email subject is required',
          code: 'MISSING_SUBJECT',
        };
      }

      if (!html) {
        return {
          success: false,
          error: 'Email content is required',
          code: 'MISSING_CONTENT',
        };
      }

      // Prepare mail options
      const mailOptions = {
        from: from || process.env.GMAIL_USER,
        to: to,
        subject: subject,
        html: html,
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        recipient: to,
        subject: subject,
        message: 'Email sent successfully',
      };
    } catch (error) {
      console.error('Error sending email:', error);

      // Handle specific error types
      if (error.code === 'EAUTH') {
        return {
          success: false,
          error: 'Email authentication failed. Check Gmail credentials.',
          code: 'AUTH_FAILED',
          details: error.message,
        };
      }

      if (error.code === 'ECONNECTION') {
        return {
          success: false,
          error: 'Failed to connect to email server',
          code: 'CONNECTION_FAILED',
          details: error.message,
        };
      }

      return {
        success: false,
        error: 'Failed to send email',
        code: 'SEND_FAILED',
        details: error.message,
      };
    }
  }

  /**
   * Send bulk emails
   * @param {Array<Object>} emails - Array of email objects with {to, subject, html}
   * @returns {Promise<Object>} Status of bulk email sending
   */
  static async sendBulk(emails) {
    try {
      if (!Array.isArray(emails) || emails.length === 0) {
        return {
          success: false,
          error: 'Emails array is required and must not be empty',
          code: 'INVALID_INPUT',
        };
      }

      const results = await Promise.allSettled(
        emails.map((email) => this.send(email))
      );

      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;
      const failed = results.length - successful;

      return {
        success: failed === 0,
        total: results.length,
        successful: successful,
        failed: failed,
        results: results.map((r, index) => ({
          email: emails[index].to,
          status: r.status === 'fulfilled' ? r.value : r.reason,
        })),
      };
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      return {
        success: false,
        error: 'Failed to send bulk emails',
        code: 'BULK_SEND_FAILED',
        details: error.message,
      };
    }
  }
}

export default EmailSender;
