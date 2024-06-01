const nodemailer = require('nodemailer');

// Configure Nodemailer to use Hotmail
const transporter = nodemailer.createTransport({
    service: 'hotmail', // Use the 'hotmail' service
    auth: {
        user: 'classic.airmated@hotmail.com', // Replace with your Hotmail email
        pass: '0300360814455' // Replace with your Hotmail password
    }
});

module.exports = transporter;
