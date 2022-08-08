import connectMail from '../services/mail.service';

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
            text: this.#textEmail || '', // Plain text body
            html: this.#htmlEmail || '', // HTML body
        };

        return await this.#transporter.sendMail(
            message,
            (err, info: SMTPTransport.SentMessageInfo) => {
                if (err) {
                    process.stdout.write(
                        `MAIL ERROR: ${JSON.stringify(err)}\n`,
                    );
                }
            },
        );
    }

    setFromEmail(emailFrom: string) {
        return this.#fromEmail = emailFrom;
    }

    setToEmail(emailTo: string) {
        return this.#toEmail = emailTo;
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
