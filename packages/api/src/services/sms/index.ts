import AfricasTalking from 'africastalking';
import twilio from 'twilio';

import config from '../../config';

const isSupportedByAfricasTalking = (to: string) => {
    if (
        to.startsWith('+229') ||
        to.startsWith('+267') ||
        to.startsWith('+226') ||
        to.startsWith('+237') ||
        to.startsWith('+225') ||
        to.startsWith('+251') ||
        to.startsWith('+233') ||
        to.startsWith('+254') ||
        to.startsWith('+266') ||
        to.startsWith('+265') ||
        to.startsWith('+223') ||
        to.startsWith('+264') ||
        to.startsWith('+234') ||
        to.startsWith('+250') ||
        to.startsWith('+221') ||
        to.startsWith('+27') ||
        to.startsWith('+255') ||
        to.startsWith('+228') ||
        to.startsWith('+256') ||
        to.startsWith('+260') ||
        to.startsWith('+263')
    ) {
        return true;
    }

    return false;
};

export const sendSMS = (to: string, body: string) => {
    if (isSupportedByAfricasTalking(to)) {
        // Send SMS via AfricasTalking
        const { apiKey, username, senderId } = config.africasTalking;
        const africastalking = AfricasTalking({
            apiKey,
            username
        });

        africastalking.SMS.send({
            to,
            message: body,
            from: senderId
        })
            .then(console.log)
            .catch(console.error);

        return true;
    }

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
