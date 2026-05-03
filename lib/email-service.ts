import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAILHOG_HOST || "smtp.mailhog.site",
  port: parseInt(process.env.MAILHOG_PORT || "2525"),
  auth: {
    user: process.env.MAILHOG_USER || "u_57cdbb55",
    pass: process.env.MAILHOG_PASS || "p_30f97feba7a38421",
  },
});

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SENDER_EMAIL = process.env.MAILHOG_SENDER_EMAIL || "noreply@boosterproject.local";

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const result = await transporter.sendMail({
      from: `"Booster Project" <${SENDER_EMAIL}>`,
      to: email,
      subject: "Verify Your Booster Project Account - " + code,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #000; color: #fff; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #111; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #8ff5ff; margin: 0; font-size: 24px; }
              .content { background-color: #0a0a0a; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
              .code-box { display: flex; justify-content: center; gap: 8px; margin: 30px 0; }
              .code-digit { display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 60px; background-color: #1a1a1a; border: 2px solid #8ff5ff; border-radius: 6px; font-size: 28px; font-weight: bold; color: #8ff5ff; font-family: monospace; }
              .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
              .warning { background-color: #1a0000; border: 1px solid #ff6b6b; color: #ff8787; padding: 12px; border-radius: 4px; margin-top: 15px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booster Project</h1>
              </div>
              <div class="content">
                <p>Welcome to Booster Project!</p>
                <p>Please verify your email address by entering the code below:</p>
                <div class="code-box">
                  ${code.split('').map(digit => `<span class="code-digit">${digit}</span>`).join('')}
                </div>
                <p style="text-align: center; color: #999; font-size: 14px; margin-top: 20px;">This code will expire in 15 minutes.</p>
                <div class="warning">
                  <strong>⚠️ Never share this code</strong><br>
                  We will never ask for this code via email or message. If you didn't sign up for Booster Project, please ignore this email.
                </div>
              </div>
              <div class="footer">
                <p>If you didn't create this account, please ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    console.log("Verification email sent to:", email, "Response:", result);
    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${DOMAIN}/reset-password?token=${token}`;

  try {
    console.log("Attempting to send password reset email to:", email);
    console.log("Reset link:", resetLink);

    const result = await transporter.sendMail({
      from: `"Booster Project" <${SENDER_EMAIL}>`,
      to: email,
      subject: "Reset Your Booster Project Password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #000; color: #fff; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #111; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #8ff5ff; margin: 0; font-size: 24px; }
              .content { background-color: #0a0a0a; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
              .button { display: inline-block; background-color: #ac89ff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center; }
              .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booster Project</h1>
              </div>
              <div class="content">
                <p>We received a request to reset your password.</p>
                <p>Click the button below to set a new password:</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #ac89ff;">${resetLink}</p>
                <p style="font-size: 12px; color: #999; margin-top: 20px;">This link will expire in 1 hour.</p>
              </div>
              <div class="footer">
                <p>If you didn't request this, you can safely ignore this email. Your password hasn't been changed.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log("Password reset email sent successfully to:", email);
    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
}
