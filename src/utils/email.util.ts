import MailController from '../controllers/mail.controller';

const mailController = new MailController();

export const sendEmailSuccess = async (mailTo: string[], statusCode: number, deliveryAttempt: number) => {
    const emailSubject = `Response Status: ${statusCode} - ${deliveryAttempt}`;
    const emailBodyHtml = `
        <table border="0" border-collapse="collapse" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border: 0;">
                    A message has been successfully sent to the target server.
                </td>
            </tr>
        </table>
    `;

    await sendEmail(mailTo, emailSubject, emailBodyHtml);
}

export const sendEmailFourHoundred = async (mailTo: string[], custodianName: string, endpoint: string) => {
    const emailSubject = `**URGENT** DAR Integration Authentication Error - ${custodianName}`;
    const emailBodyHtml = `
        <table border="0" border-collapse="collapse" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border: 0;">
                    HDRUK DAR Integration is unable to authenticate on the following endpoint: ${endpoint}
                </td>
            </tr>
            <tr>
                <td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border: 0;">
                    DAR integration will be paused until this error is resolved, please contact HDRUK Technical Support at the link below, and a member of HDRUK technical support will be in touch to re-enable this integration.
                </td>
            </tr>
            <tr>
                <td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border: 0;">
                    <a href="https://hdruk.atlassian.net/servicedesk/customer/portal/1/group/1/create/1">
                        https://hdruk.atlassian.net/servicedesk/customer/portal/1/group/1/create/1
                    </a>
                </td>
            </tr>           
        </table>
    `;

    await sendEmail(mailTo, emailSubject, emailBodyHtml);
}

export const sendEmailFiveHoundred = async (mailTo: string[], custodianName: string, endpoint: string) => {
    const emailSubject = `**URGENT** DAR Integration Error - ${custodianName}`;
    const emailBodyHtml = `
        <table border="0" border-collapse="collapse" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border: 0;">
                    The connection between HDRUK and ${custodianName} has failed several times at the following endpoint: ${endpoint}
                </td>
            </tr>
            <tr>
                <td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border: 0;">
                    DAR integration will be paused until this error is resolved, please contact HDRUK Technical Support at the link below, and a member of HDRUK technical support will be in touch to re-enable this integration.
                </td>
            </tr>
            <tr>
                <td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border-bottom: 1px solid #d0d3d4;">
                    <a href="https://hdruk.atlassian.net/servicedesk/customer/portal/1/group/1/create/1">
                        https://hdruk.atlassian.net/servicedesk/customer/portal/1/group/1/create/1
                    </a>
                </td>
            </tr>           
        </table>
    `;

    await sendEmail(mailTo, emailSubject, emailBodyHtml);
}

export const sendEmailDeadLetter = async (mailTo: string[], custodianName: string) => {
    const emailSubject = `**URGENT** DAR Integration Error - ${custodianName}`;
    const emailBodyHtml = `
        <table border="0" border-collapse="collapse" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td style="font-size: 14px; color: #3c3c3b; padding: 10px 5px; width: 50%; text-align: left; vertical-align: top; border-bottom: 1px solid #d0d3d4;">
                    Lorem ipsum... dead letter.
                </td>
            </tr>
        </table>
    `;

    await sendEmail(mailTo, emailSubject, emailBodyHtml);
}

const sendEmail = async (mailTo, emailSubject: string, emailBodyHtml: string) => {
    mailTo.forEach(async mail => {
        mailController.setFromEmail(process.env.MAIL_HDRUK_ADDRESS);
        mailController.setToEmail(mailTo);
        mailController.setSubjectEmail(emailSubject);
        mailController.setHtmlEmail(emailBodyHtml);
        await mailController.sendEmail();
    });
}
