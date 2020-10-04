import axios from 'axios';
import config from './../config';
import { ExchangeRates } from '../db/models/exchangeRates';
import Logger from '../loaders/logger';

async function updateExchangeRates(): Promise<void> {
    Logger.info('Updating exchange rates...');
    const query = await axios.get(
        `http://data.fixer.io/api/latest?access_key=${config.fixerApiKey}`
    );
    const latestRates = query.data.rates;
    for (const currency in latestRates) {
        const rate = latestRates[currency];
        await ExchangeRates.update({
            rate,
        }, { where: { currency: currency } });
    }
}

export {
    updateExchangeRates,
}