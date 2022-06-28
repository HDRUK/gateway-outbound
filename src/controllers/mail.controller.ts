import connectMail from "../services/mail.service";

import SMTPTransport = require('nodemailer/lib/smtp-transport');

const BaseController = require('./base.controller');

export default class MailController extends BaseController {
    #transporter;
    #fromEmail;
    #toEmail;
    #subjectEmail;
    #textEmail;
    #htmlEmail;

    constructor() {
        super();
        this.#transporter = connectMail();
    }

    async sendEmail() {
        const message = {
            from: this.#fromEmail,
            to: this.#toEmail,
            subject: this.#subjectEmail,
            text: this.#textEmail // Plain text body
        };

        return await this.#transporter.sendMail(message, (err, info: SMTPTransport.SentMessageInfo) => {
            if (err) {
                this.sendLoggingMessage(JSON.stringify(err), 'ERROR');
                throw new Error(err.message);
            }

            this.sendLoggingMessage(JSON.stringify(info), 'INFO');

            console.log('Message sent: %s', info.messageId);
        });
    }

    setFromEmail(email: string) {
        return this.#fromEmail = email;
    }

    setToEmail(email: string) {
        return this.#toEmail = email;
    }

    setSubjectEmail(subjectEmail: string) {
        return this.#subjectEmail = subjectEmail;
    }

    setTextEmail(textEmail: string) {
        return this.#textEmail = textEmail;
    }

    setHtmlEmail(htmlEmail: string) {
        return this.#htmlEmail = htmlEmail;
    }
}