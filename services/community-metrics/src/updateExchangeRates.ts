import { config, database, utils } from '@impactmarket/core';
import axios from 'axios';

async function updateExchangeRates(): Promise<void> {
    try {
        utils.Logger.info('Updating exchange rates...');
        const query = await axios.get(config.currenciesApiBaseUrl + config.currenciesApiKey);
        const latestRates = query.data.rates;
        for (const currency in latestRates) {
            const rate = latestRates[currency];
            await database.models.appExchangeRates.update(
                {
                    rate
                },
                { where: { currency } }
            );
        }
    } catch (error) {
        console.error('Error updateExchangeRates: ', error);
    }
}

export { updateExchangeRates };
