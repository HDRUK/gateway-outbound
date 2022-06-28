import nodemailer from "nodemailer";

const mailHostname = process.env.MAIL_HOST || '';
const mailPort = parseInt(process.env.MAIL_PORT) || 0;
const mailUsername = process.env.MAIL_USERNAME || '';
const mailPassword = process.env.MAIL_PASSWORD || '';

const transporterOptions = {
    host: mailHostname,
    port: mailPort,
    auth: {
        user: mailUsername,
        pass: mailPassword,
    },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5,
};

const connectMail = () => {  
    return nodemailer.createTransport(transporterOptions);
}

export default connectMail;