import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other services like sendgrid, mailgun, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
  },
});

export const sendOTPEmail = async (email, otp, name = "User") => {
  try {
    const mailOptions = {
      from: `"Buddy Coding Assistant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Buddy Coding Assistant",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .otp-box {
              background: #f4f4f4;
              border: 2px dashed #667eea;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for signing up for Buddy Coding Assistant! To complete your registration, please use the following OTP to verify your email address:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p>This OTP will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
              
              <p>If you didn't request this verification code, please ignore this email.</p>
              
              <p>Best regards,<br>Buddy Coding Assistant Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${name},
        
        Thank you for signing up for Buddy Coding Assistant!
        
        Your OTP verification code is: ${otp}
        
        This OTP will expire in 10 minutes. Please do not share this code with anyone.
        
        If you didn't request this verification code, please ignore this email.
        
        Best regards,
        Buddy Coding Assistant Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    throw error;
  }
};

export const sendWelcomeEmail = async (email, name = "User") => {
  try {
    const mailOptions = {
      from: `"Buddy Coding Assistant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Welcome to Buddy Coding Assistant!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 50px 30px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="70" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
              opacity: 0.3;
            }
            .header h1 {
              font-size: 36px;
              margin-bottom: 10px;
              position: relative;
              z-index: 1;
            }
            .header p {
              font-size: 18px;
              opacity: 0.95;
              position: relative;
              z-index: 1;
            }
            .emoji {
              font-size: 64px;
              display: block;
              margin-bottom: 20px;
              position: relative;
              z-index: 1;
            }
            .content {
              padding: 40px 30px;
              background: white;
            }
            .welcome-message {
              font-size: 20px;
              color: #667eea;
              font-weight: 600;
              margin-bottom: 20px;
            }
            .content p {
              margin-bottom: 20px;
              font-size: 16px;
              color: #555;
            }
            .features {
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              border-radius: 15px;
              padding: 30px;
              margin: 30px 0;
            }
            .features h3 {
              color: #667eea;
              margin-bottom: 20px;
              font-size: 22px;
            }
            .feature-item {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
              font-size: 16px;
            }
            .feature-item::before {
              content: '✨';
              margin-right: 12px;
              font-size: 20px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 600;
              text-align: center;
              margin: 30px 0;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
              transition: transform 0.2s;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            .footer p {
              color: #666;
              font-size: 14px;
              margin: 5px 0;
            }
            .social-links {
              margin-top: 20px;
            }
            .social-links a {
              color: #667eea;
              text-decoration: none;
              margin: 0 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="emoji">🎉</span>
              <h1>Welcome to Buddy!</h1>
              <p>Your Coding Journey Starts Here</p>
            </div>
            <div class="content">
              <div class="welcome-message">Hi ${name}! 👋</div>
              
              <p>We're thrilled to have you join the <strong>Buddy Coding Assistant</strong> community! You've taken the first step towards mastering coding challenges with AI-powered guidance.</p>
              
              <div class="features">
                <h3>🚀 What You Can Do:</h3>
                <div class="feature-item">Get instant hints for coding problems</div>
                <div class="feature-item">Ask custom questions about algorithms</div>
                <div class="feature-item">Learn step-by-step problem-solving approaches</div>
                <div class="feature-item">Track your progress across platforms</div>
              </div>
              
              <p><strong>Ready to get started?</strong> Open your Chrome extension on LeetCode, HackerRank, or Codeforces and let Buddy guide you through your next coding challenge!</p>
              
              <div style="text-align: center;">
                <a href="#" class="cta-button">Start Coding with Buddy →</a>
              </div>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <strong>Pro Tip:</strong> Keep the extension active while solving problems. Buddy learns from your coding patterns and provides personalized hints over time!
              </p>
            </div>
            <div class="footer">
              <p><strong>Buddy Coding Assistant</strong></p>
              <p>Your AI-powered coding companion</p>
              <div class="social-links">
                <p style="margin-top: 15px; color: #999; font-size: 12px;">
                  This is an automated welcome email. If you have questions, feel free to reach out!
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        🎉 Welcome to Buddy Coding Assistant!
        
        Hi ${name}!
        
        We're thrilled to have you join the Buddy Coding Assistant community!
        
        What You Can Do:
        ✨ Get instant hints for coding problems
        ✨ Ask custom questions about algorithms
        ✨ Learn step-by-step problem-solving approaches
        ✨ Track your progress across platforms
        
        Ready to get started? Open your Chrome extension on LeetCode, HackerRank, or Codeforces and let Buddy guide you through your next coding challenge!
        
        Pro Tip: Keep the extension active while solving problems. Buddy learns from your coding patterns and provides personalized hints over time!
        
        Best regards,
        Buddy Coding Assistant Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending welcome email: ${error.message}`);
    // Don't throw - welcome email failure shouldn't break auth flow
    return false;
  }
};
