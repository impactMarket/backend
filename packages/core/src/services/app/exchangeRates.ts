import { models } from '../../database';
import { ExchangeRatesAttributes } from '../../database/models/app/exchangeRates';

export default class ExchangeRatesService {
    public async get(): Promise<ExchangeRatesAttributes[]> {
        return models.exchangeRates.findAll({
            attributes: ['currency', 'rate'],
            raw: true,
        });
    }
}
