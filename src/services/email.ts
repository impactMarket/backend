import sgMail, { MailDataRequired } from '@sendgrid/mail';

import config from '../config';

export default class Email {
    constructor() {
        sgMail.setApiKey(config.sendgridApi);
    }

    public async notify(msg: MailDataRequired) {
        try {
            await sgMail.send(msg);
        } catch (error) {
            console.error(error);

            if (error.response) {
                console.error(error.response.body);
            }
        }
    }
}
