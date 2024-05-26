const nodemailer = require('nodemailer');

// Configure Nodemailer to use Hotmail
const transporter = nodemailer.createTransport({
    service: 'hotmail', // Use the 'hotmail' service
    auth: {
        user: 'jazil10@hotmail.com', // Replace with your Hotmail email
        pass: '1@LeoMessi' // Replace with your Hotmail password
    }
});

module.exports = transporter;
