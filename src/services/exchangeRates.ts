import { ExchangeRatesAttributes } from '@models/app/exchangeRates';

import { models } from '../database';

export default class ExchangeRatesService {
    public static exchangeRates = models.exchangeRates;

    public static get(): Promise<ExchangeRatesAttributes[]> {
        return this.exchangeRates.findAll({
            attributes: ['currency', 'rate'],
            raw: true,
        });
    }
}
