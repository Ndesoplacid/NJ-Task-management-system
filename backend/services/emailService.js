import nodemailer from 'nodemailer';

let transporter;

// Create transporter, automatically creating a mock Ethereal test account if needed
const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (host && port && user && pass) {
    console.log('[Email Service] Configuring custom SMTP credentials');
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    console.log('[Email Service] No custom SMTP config found. Generating an Ethereal Mail testing account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log(`[Email Service] Ethereal account generated:`);
      console.log(`  - User: ${testAccount.user}`);
      console.log(`  - Pass: ${testAccount.pass}`);
      console.log(`  - Note: You can view sent test emails via links in the server log!`);

      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } catch (err) {
      console.error(`[Email Service Error] Failed to generate test mail account: ${err.message}`);
      // Fallback dummy transporter that logs to console
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('\n--- DUMMY EMAIL DISPATCH (FALLBACK) ---');
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Body:\n${mailOptions.text}`);
          console.log('----------------------------------------\n');
          return { messageId: 'dummy-id', mockUrl: '#' };
        }
      };
    }
  }

  return transporter;
};

/**
 * Sends a deadline reminder email to the user
 */
export const sendReminderEmail = async ({ to, username, taskTitle, deadline }) => {
  try {
    const client = await getTransporter();
    const formattedDeadline = new Date(deadline).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Task Reminders" <noreply@taskmanager.local>',
      to,
      subject: `🚨 Reminder: Upcoming Task Deadline in 2 Hours - "${taskTitle}"`,
      text: `Hello ${username},\n\nThis is an automated reminder that your task "${taskTitle}" is approaching its deadline.\n\nDeadline: ${formattedDeadline}\n\nPlease check your dashboard to complete or adjust your task.\n\nBest regards,\nTask Management System`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Task Deadline Reminder</h1>
          </div>
          <div style="padding: 24px; background-color: #ffffff; color: #333333; line-height: 1.6;">
            <p style="font-size: 16px;">Hello <strong>${username}</strong>,</p>
            <p style="font-size: 15px;">This is a friendly reminder that your task is approaching its scheduled deadline in <strong>2 hours</strong>:</p>
            
            <div style="background-color: #f3f4f6; border-left: 4px solid #6366f1; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">${taskTitle}</h3>
              <p style="margin: 0; color: #4b5563; font-size: 14px;">📅 Deadline: <strong>${formattedDeadline}</strong></p>
            </div>
            
            <p style="font-size: 15px;">Please check your dashboard to review task progress or mark it as complete.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);">Go to Dashboard</a>
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 16px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      `,
    };

    const info = await client.sendMail(mailOptions);
    console.log(`[Email Service] Reminder sent successfully: ${info.messageId}`);
    
    // Log preview URL for ethereal test emails
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Service Test Preview URL]: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a password reset email to the user
 */
export const sendResetEmail = async ({ to, username, resetUrl }) => {
  try {
    const client = await getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Task Account Security" <security@taskmanager.local>',
      to,
      subject: `🔒 Reset Your Task Management Password`,
      text: `Hello ${username},\n\nYou requested a password reset. Please use the following link to reset your password within 10 minutes:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Password Reset Request</h1>
          </div>
          <div style="padding: 24px; background-color: #ffffff; color: #333333; line-height: 1.6;">
            <p style="font-size: 16px;">Hello <strong>${username}</strong>,</p>
            <p style="font-size: 15px;">We received a request to reset the password for your Task Management account. Click the button below to choose a new password. This link is valid for <strong>10 minutes</strong>:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);">Reset My Password</a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 13px; word-break: break-all; color: #6366f1;"><a href="${resetUrl}">${resetUrl}</a></p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If you did not make this request, you can safely ignore this email; your password will remain secure.</p>
          </div>
          <div style="background-color: #f9fafb; padding: 16px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      `,
    };

    const info = await client.sendMail(mailOptions);
    console.log(`[Email Service] Password reset email sent: ${info.messageId}`);
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Service Test Preview URL]: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send password reset email: ${error.message}`);
    return { success: false, error: error.message };
  }
};
