import database from '../loaders/database';

const db = database();
export default class ExchangeRatesService {
    public static async get(): Promise<any> {
        const previousRates = await db.models.exchangeRates.findAll();
        const mapRates = {};
        for (let index = 0; index < previousRates.length; index++) {
            mapRates[previousRates[index].currency] = previousRates[index].rate;
        }
        const rates = {
            EUR: {
                name: 'Euro',
                rate: mapRates['EUR'],
            },
            USD: {
                name: 'American Dollar',
                rate: 1,
            },
            BRL: {
                name: 'Real Brasileiro',
                rate: mapRates['BRL'],
            },
            GHS: {
                name: 'Ghanaian Cedi',
                rate: mapRates['GHS'],
            },
            CVE: {
                name: 'Escudo Cabo Verde',
                rate: mapRates['CVE'],
            },
            NGN: {
                name: 'Nigerian Naira',
                rate: mapRates['NGN'],
            },
            ARS: {
                name: 'Peso Argentino',
                rate: mapRates['ARS'],
            },
            VES: {
                name: 'Bolívar Venezuelano',
                rate: mapRates['VES'],
            },
        };
        return rates;
    }
}
