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
                process.stdout.write(`MAIL ERROR: ${JSON.stringify(err)}\n`);
            }

            process.stdout.write(`MAIL : ${JSON.stringify(info)}\n`);
            process.stdout.write(`MAIL SENT : ${info.messageId}\n`);
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