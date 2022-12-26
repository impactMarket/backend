import { models } from '../../database';
export default class ExchangeRatesService {
    public async get() {
        const rates = await models.exchangeRates.findAll({
            attributes: ['currency', 'rate'],
        });
        return rates.map((rate) => rate.toJSON());
    }
}
