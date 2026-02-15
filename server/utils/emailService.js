const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOTP = async (email, otp) => {
  const msg = {
    to: email,
    from: 'no-reply@logicheart.com', // Change to your verified sender
    subject: 'Your OTP Code for LogicHeart',
    text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
    html: `<strong>Your OTP code is: ${otp}</strong><br>It expires in 5 minutes.`,
  };

  try {
    await sgMail.send(msg);
    console.log('OTP Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

module.exports = { sendOTP };
