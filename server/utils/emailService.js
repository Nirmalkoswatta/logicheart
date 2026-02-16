const Mailjet = require('node-mailjet');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Mailjet with credentials from .env
const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY || 'your-api-key',
  apiSecret: process.env.MAILJET_SECRET_KEY || 'your-api-secret'
});

const sendOTP = async (email, otp) => {
  try {
    const request = mailjet
      .post("send", { 'version': 'v3.1' })
      .request({
        "Messages":[
          {
            "From": {
              "Email": "nirmalkoza@gmail.com",
              "Name": "LogicHeart"
            },
            "To": [
              {
                "Email": email,
                "Name": "User"
              }
            ],
            "Subject": "Your OTP Code for LogicHeart",
            "TextPart": `Your OTP code is ${otp}. It expires in 5 minutes.`,
            "HTMLPart": `<strong>Your OTP code is: ${otp}</strong><br>It expires in 5 minutes.`,
            "CustomID": "LogicHeartOTP"
          }
        ]
      });

    const result = await request;
    console.log('OTP Email sent successfully');
    // console.log(result.body);
  } catch (error) {
    console.error('Error sending email:', error.statusCode);
    if (error.response) {
      // console.error(JSON.stringify(error.response.body, null, 2));
      console.error(error.message);
    }
    
    // DEVELOPMENT FALLBACK: Log OTP to console if email fails
    console.log('\n========================================');
    console.log('📧 EMAIL DELIVERY FAILED - DEVELOPMENT MODE');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log('========================================\n');
  }
};

module.exports = { sendOTP };
