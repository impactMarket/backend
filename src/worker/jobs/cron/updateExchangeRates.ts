import { Logger } from '@logger/logger';
import { ExchangeRates } from '@models/exchangeRates';
import axios from 'axios';

import config from '../../../config';

async function updateExchangeRates(): Promise<void> {
    Logger.info('Updating exchange rates...');
    const query = await axios.get(
        config.currenciesApiBaseUrl + config.currenciesApiKey
    );
    const latestRates = query.data.rates;
    for (const currency in latestRates) {
        const rate = latestRates[currency];
        await ExchangeRates.update(
            {
                rate,
            },
            { where: { currency } }
        );
    }
}

export { updateExchangeRates };
