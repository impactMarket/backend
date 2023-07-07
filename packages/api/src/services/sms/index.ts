import twilio from 'twilio';

import config from '../../config';

export const sendSMS = (to: string, body: string) => {
    const { accountSid, authToken, fromNumber } = config.twilio;
    const client = twilio(accountSid, authToken);

    client.messages
        .create({
            body,
            from: fromNumber,
            to
        })
        .then(console.log)
        .catch(console.error);

    return true;
};
