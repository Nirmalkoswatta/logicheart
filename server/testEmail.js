const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'nirmalkoza@gmail.com',
  from: 'nirmalkoza@gmail.com',
  subject: 'SendGrid Test',
  text: 'This is a test email from LogicHeart',
  html: '<strong>This is a test email from LogicHeart</strong>',
};

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email sent successfully!');
    console.log('Check your inbox at nirmalkoza@gmail.com');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error sending email:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.statusCode);
      console.error('Body:', JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  });
