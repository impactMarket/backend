import { Cashify } from 'cashify';
import { ExchangeRates } from '../db/models/exchangeRates';

export default class ExchangeRatesService {

    public static async get(): Promise<any> {
        const previousRates = await ExchangeRates.findAll();
        let mapRates = {};
        for (let index = 0; index < previousRates.length; index++) {
            mapRates[previousRates[index].currency] = previousRates[index].rate;
        }
        const cashify = new Cashify({ base: 'EUR', rates: mapRates });
        const rates = {
            "EUR": {
                name: 'Euro',
                rate: cashify.convert(1, { from: 'USD', to: 'EUR' })
            },
            "USD": {
                name: 'American Dollar',
                rate: 1,
            },
            "BRL": {
                name: 'Real Brasileiro',
                rate: cashify.convert(1, { from: 'USD', to: 'BRL' }),
            },
            "GHS": {
                name: 'Ghanaian Cedi',
                rate: cashify.convert(1, { from: 'USD', to: 'GHS' }),
            },
            "CVE": {
                name: 'Escudo Cabo Verde',
                rate: cashify.convert(1, { from: 'USD', to: 'CVE' }),
            },
            "NGN": {
                name: 'Nigerian Naira',
                rate: cashify.convert(1, { from: 'USD', to: 'NGN' }),
            },
        };
        return rates;
    }
}