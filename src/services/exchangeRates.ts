import { models } from '../database';

export default class ExchangeRatesService {
    public static exchangeRates = models.exchangeRates;

    public static async get(): Promise<{ exchangeRates: any; rates: any }> {
        const rates = await this.exchangeRates.findAll({
            attributes: ['currency', 'rate'],
            raw: true,
        });
        const mapRates = {};
        for (let index = 0; index < rates.length; index++) {
            mapRates[rates[index].currency] = rates[index].rate;
        }
        const exchangeRates = {
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
            HNL: {
                name: 'Honduran Lempira',
                rate: mapRates['HNL'],
            },
            PHP: {
                name: 'Philippine Peso',
                rate: mapRates['PHP'],
            },
        };
        return { exchangeRates, rates };
    }
}
