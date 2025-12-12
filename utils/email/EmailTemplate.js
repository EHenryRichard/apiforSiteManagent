// Email Template Class - Generates HTML email templates with inline CSS
class EmailTemplate {
  // Generate verification email template
  static verificationEmail({
    recipientName,
    verificationCode,
    expiresIn,
    verificationLink,
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #111111;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #111111;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #ff6900; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Email Verification</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px; background-color: #1a1a1a; text-align: center;">
                    <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px;">Welcome${recipientName ? ', ' + recipientName : ''}!</h2>

                    <p style="margin: 0 0 24px 0; color: #cccccc; font-size: 16px; line-height: 1.6;">
                      Thank you for registering. We're excited to have you on board!
                    </p>

                    <p style="margin: 0 0 32px 0; color: #cccccc; font-size: 16px; line-height: 1.6;">
                      ${verificationLink ? 'Click the button below to verify your email and get started:' : 'Please use the verification code below to verify your email address:'}
                    </p>

                    <!-- Secure Link Button -->
                    ${verificationLink ? `
                    <table role="presentation" style="width: 100%; margin: 0 0 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${verificationLink}" style="display: inline-block; background-color: #ff6900; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 500; line-height: 1.5;">
                            Verify email address
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 16px 0; color: #cccccc; font-size: 14px; line-height: 1.6;">
                      This link will expire in <strong style="color: #ffffff;">${expiresIn || '24 hours'}</strong>.
                    </p>
                    ` : ''}

                    <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      If you didn't request this verification, please ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #0a0a0a; padding: 20px 30px; text-align: center; border-top: 1px solid #333333;">
                    <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.5;">
                      This is an automated email. Please do not reply.<br>
                      &copy; ${new Date().getFullYear()} All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // Generate regenerated token email template
  static regeneratedTokenEmail({
    recipientName,
    verificationCode,
    expiresIn,
    verificationLink,
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #111111;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #111111;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #ff6900; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">New Verification Code</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px; background-color: #1a1a1a;">
                    <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px;">Hello${
                      recipientName
                        ? ', ' + recipientName
                        : ''
                    }!</h2>

                    <p style="margin: 0 0 20px 0; color: #cccccc; font-size: 16px; line-height: 1.6;">
                      Your previous verification code has expired. ${
                        verificationLink
                          ? 'Please click the button below to verify your email address:'
                          : "Here's your new verification code:"
                      }
                    </p>

                    <!-- Secure Link Button -->
                    ${
                      verificationLink
                        ? `
                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${verificationLink}" style="display: inline-block; background-color: #ff6900; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 500; line-height: 1.5;">
                            Verify email address
                          </a>
                        </td>
                      </tr>
                    </table>
                    `
                        : ''
                    }

                    <!-- Verification Code Box -->
                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td style="background-color: #2a2a2a; border: 2px solid #ff6900; border-radius: 8px; padding: 25px; text-align: center;">
                          <div style="font-size: 40px; font-weight: bold; color: #ff6900; letter-spacing: 10px; font-family: 'Courier New', monospace;">
                            ${verificationCode}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 20px 0; color: #cccccc; font-size: 14px; line-height: 1.6;">
                      This code will expire in <strong style="color: #ffffff;">${
                        expiresIn || '24 hours'
                      }</strong>.
                    </p>

                    <p style="margin: 20px 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      If you didn't request this code, please ignore this email or contact support if you have concerns.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #0a0a0a; padding: 20px 30px; text-align: center; border-top: 1px solid #333333;">
                    <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.5;">
                      This is an automated email. Please do not reply.<br>
                      &copy; ${new Date().getFullYear()} All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer Link -->
              ${
                verificationLink
                  ? `
              <table role="presentation" style="width: 100%; max-width: 600px; margin: 24px auto 0;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.5;">
                      If the button doesn't work, copy and paste this URL into your browser:<br>
                      <a href="${verificationLink}" style="color: #ff6900; text-decoration: underline; word-break: break-all;">${verificationLink}</a>
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // Generate password reset email template
  static passwordResetEmail({
    recipientName,
    expiresIn,
    resetLink,
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #111111;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #111111;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #ff6900; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Password Reset</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px; background-color: #1a1a1a;">
                    <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px;">Hello${
                      recipientName
                        ? ', ' + recipientName
                        : ''
                    }!</h2>

                    <p style="margin: 0 0 20px 0; color: #cccccc; font-size: 16px; line-height: 1.6;">
                      You requested to reset your password. ${resetLink ? 'Click the button below to securely reset your password:' : 'Please verify this password reset request.'}
                    </p>

                    <!-- Secure Link Button -->
                    ${resetLink ? `
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${resetLink}" style="display: inline-block; background-color: #ff6900; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 500; line-height: 1.5;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 16px 0; color: #cccccc; font-size: 14px; line-height: 1.6;">
                      This link will expire in <strong style="color: #ffffff;">${expiresIn || '1 hour'}</strong>.
                    </p>
                    ` : ''}

                    <p style="margin: 20px 0; color: #ff6900; font-size: 14px; line-height: 1.6; font-weight: bold;">
                      ⚠ If you didn't request a password reset, please ignore this email and ensure your account is secure.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #0a0a0a; padding: 20px 30px; text-align: center; border-top: 1px solid #333333;">
                    <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.5;">
                      This is an automated email. Please do not reply.<br>
                      &copy; ${new Date().getFullYear()} All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // Generate login verification email template
  static loginVerificationEmail({
    recipientName,
    expiresIn,
    verificationLink,
    siteName,
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #111111;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #111111;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #ff6900; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Let's get you signed in</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px; background-color: #1a1a1a; text-align: center;">
                    <p style="margin: 0 0 24px 0; color: #cccccc; font-size: 16px; line-height: 1.6;">
                      Sign in with the secure link below
                    </p>

                    <!-- Secure Link Button -->
                    ${verificationLink ? `
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${verificationLink}" style="display: inline-block; background-color: #ff6900; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 500; line-height: 1.5;">
                            Sign in to ${siteName}
                          </a>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <p style="margin: 24px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      If you didn't request this email, you can safely ignore it.
                    </p>

                    <p style="margin: 16px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      If you're experiencing issues, please contact Support.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #0a0a0a; padding: 20px 30px; text-align: center; border-top: 1px solid #333333;">
                    <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.5;">
                      This is an automated email. Please do not reply.<br>
                      &copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}

export default EmailTemplate;
