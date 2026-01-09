require('dotenv').config();

console.log('=== EMAIL CONFIGURATION TEST ===');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL);
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? `${process.env.SMTP_PASSWORD.substring(0, 4)}****` : 'NOT SET');
console.log('SMTP_PASSWORD Length:', process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 0);
console.log('SMTP_PASSWORD has spaces:', process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.includes(' ') : false);
console.log('================================\n');

// Use dynamic import for nodemailer
(async () => {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  console.log('Sending test email...\n');

  try {
    const info = await transporter.sendMail({
      from: `"SHOPIX Test" <${process.env.SMTP_EMAIL}>`,
      to: process.env.SMTP_EMAIL, // Send to yourself
      subject: 'SHOPIX Email Test - ' + new Date().toLocaleString(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #FF6B35; border-radius: 10px;">
          <h2 style="color: #FF6B35;">✅ Email Configuration Working!</h2>
          <p>This is a test email from SHOPIX backend.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Time: ${new Date().toLocaleString()}</li>
            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
            <li>SMTP Port: ${process.env.SMTP_PORT}</li>
            <li>From: ${process.env.SMTP_EMAIL}</li>
          </ul>
          <p style="color: green; font-weight: bold;">If you received this email, your SMTP configuration is working correctly! 🎉</p>
        </div>
      `
    });
    
    console.log('✅ SUCCESS! Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\n✅ Check your inbox:', process.env.SMTP_EMAIL);
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR! Failed to send email:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('\nFull Error:', error);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  AUTHENTICATION FAILED!');
      console.error('Possible reasons:');
      console.error('1. Password has spaces (should be: dgxsxofauyssor)');
      console.error('2. Wrong App Password');
      console.error('3. 2-Step Verification not enabled on Gmail');
      console.error('4. Need to generate new App Password');
    }
    
    process.exit(1);
  }
})();
