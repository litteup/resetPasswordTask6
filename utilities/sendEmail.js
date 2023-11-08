const nodemailer = require('nodemailer');
require('dotenv').config();

const options = {
    service: "gmail",
    auth:{
        user: process.env.RESET_PASSWORD_EMAIL,
        pass: process.env.RESET_PASSWORD_APP_SECRET
    },
    tls: {
        rejectUnauthorized: false
    }
};

const send = nodemailer.createTransport(options);


module.exports = {
    send
};