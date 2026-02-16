const Mailjet = require('node-mailjet');
require('dotenv').config();

console.log('Testing Mailjet with API Key:', process.env.MAILJET_API_KEY ? 'Set' : 'Not Set');

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY,
  apiSecret: process.env.MAILJET_SECRET_KEY
});

const request = mailjet
  .post("send", { 'version': 'v3.1' })
  .request({
    "Messages":[
      {
        "From": {
          "Email": "nirmalkoza@gmail.com",
          "Name": "LogicHeart Test"
        },
        "To": [
          {
            "Email": "nirmalkoza@gmail.com",
            "Name": "Test User"
          }
        ],
        "Subject": "Mailjet Test Email",
        "TextPart": "This is a test email from LogicHeart and Mailjet.",
        "HTMLPart": "<h3>Mailjet Test</h3><p>This is a test email execution.</p>",
        "CustomID": "AppGettingStartedTest"
      }
    ]
  });

request
  .then((result) => {
    console.log('✅ Email sent successfully!');
    console.log(JSON.stringify(result.body, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error sending email:');
    console.error('Status:', err.statusCode);
    console.error('Message:', err.message);
    if (err.response) {
        console.error('Body:', JSON.stringify(err.response.body, null, 2));
    }
    process.exit(1);
  });
