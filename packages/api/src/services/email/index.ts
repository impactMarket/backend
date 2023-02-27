import sgMail, { MailDataRequired } from '@sendgrid/mail';

import config from '../../config';

export const sendEmail = (msg: MailDataRequired) => {
    if (config.sendgridApi.startsWith('SG.')) {
        sgMail.setApiKey(config.sendgridApi);
        sgMail.send(msg).catch(console.error);
    }

    return true;
};
