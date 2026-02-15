const sgMail = require('@sendgrid/mail');

// Trim and validate API key
const apiKey = process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.trim() : '';
if (apiKey && apiKey.startsWith('SG.')) {
  sgMail.setApiKey(apiKey);
} else if (apiKey) {
  console.warn('SendGrid API key format is invalid. Expected format: SG.xxx');
}

const sendOTP = async (email, otp) => {
  const msg = {
    to: email,
    from: 'nirmalkoza@gmail.com', // Verified sender in SendGrid
    subject: 'Your OTP Code for LogicHeart',
    text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
    html: `<strong>Your OTP code is: ${otp}</strong><br>It expires in 5 minutes.`,
  };

  try {
    await sgMail.send(msg);
    console.log('OTP Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message);
    if (error.response) {
      console.error(error.response.body);
    }
    
    // DEVELOPMENT FALLBACK: Log OTP to console if email fails
    console.log('\n========================================');
    console.log('📧 EMAIL DELIVERY FAILED - DEVELOPMENT MODE');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log('========================================\n');
    
    // Don't throw error - allow registration to continue
    // In production, you should throw the error
  }
};

module.exports = { sendOTP };
