import { utils, config, database } from '@impactmarket/core';
import axios from 'axios';

async function updateExchangeRates(): Promise<void> {
    utils.Logger.info('Updating exchange rates...');
    const query = await axios.get(
        config.currenciesApiBaseUrl + config.currenciesApiKey
    );
    const latestRates = query.data.rates;
    for (const currency in latestRates) {
        const rate = latestRates[currency];
        await database.models.appExchangeRates.update(
            {
                rate,
            },
            { where: { currency } }
        );
    }
}

export { updateExchangeRates };
