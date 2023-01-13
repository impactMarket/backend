const { Appsignal } = require('@appsignal/nodejs');

// eslint-disable-next-line no-new
new Appsignal({
    active: true,
    name: 'impact-market',
    pushApiKey: process.env.APPSIGNAL_PUSH_API_KEY,
});
