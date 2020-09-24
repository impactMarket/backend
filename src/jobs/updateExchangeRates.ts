import axios from 'axios';
import config from './../config';
import { ExchangeRates } from '../db/models/exchangeRates';

async function updateExchangeRates(): Promise<void> {
    console.log('Updating exchange rates...');
    const query = await axios.get(
        `http://data.fixer.io/api/latest?access_key=${config.fixerApiKey}`
    );
    const latestRates = query.data.rates;
    for (const currency in latestRates) {
        const rate = latestRates[currency];
        console.log(rate)
        await ExchangeRates.update({
            rate,
        }, { where: { currency: currency } });
    }
}

export {
    updateExchangeRates,
}