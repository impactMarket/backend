import { expect } from 'chai';
import { models, sequelize } from '../../../src/database';
import { truncate } from '../../config/sequelizeSetup';
import CashoutProviderService from '../../../src/services/app/cashoutProvider';

describe('cashout provider', () => {
    const cashoutProviderService = new CashoutProviderService();

    before(async () => {
        await models.merchantRegistry.bulkCreate([
            {
                name: 'merchant 1',
                description: 'merchant description 1',
                country: 'BR',
                type: 0,
                fee: 0.005,
                min: 50,
                address: 'Rua Teste, 123 - Cidade - Estado - Brasil',
                phone: '+5514999999999',
                gps: { latitude: -28.951871, longitude: -52.306694 },
                cashout: true,
                payment: false
            },
            {
                name: 'merchant 2',
                description: 'merchant description 2',
                country: 'BR',
                type: 1,
                fee: 0.01,
                min: 20,
                address: 'Rua Teste, 321 - Cidade - Estado - Brasil',
                phone: '+5514999999999',
                gps: { latitude: -2.723646, longitude: -60.206576 },
                cashout: false,
                payment: true
            }
        ]);

        await models.exchangeRegistry.bulkCreate([
            {
                name: 'exchange 1',
                description: 'exchange description 1',
                countries: ['PT'],
                global: true,
                fee: 0.1
            },
            {
                name: 'exchange 2',
                description: 'exchange description 1',
                countries: ['BR'],
                global: false,
                fee: 0.1
            }
        ]);
    });

    after(() => {
        truncate(sequelize, 'exchangeRegistry');
        truncate(sequelize, 'merchantRegistry');
    });

    it('get cashout providers by country', async () => {
        const response = await cashoutProviderService.get({
            country: 'BR'
        });

        expect(response.exchanges?.length).to.equal(2);
        expect(response.merchants?.length).to.equal(2);
    });

    it('get cashout providers by location', async () => {
        const response = await cashoutProviderService.get({
            lat: '-2.921890',
            lng: '-60.658435'
        });

        expect(response.exchanges?.length).to.equal(1);
        expect(response.merchants?.length).to.equal(1);
        expect(response.merchants![0].name).to.equal('merchant 2');
    });

    it('get cashout providers by country + location', async () => {
        const response = await cashoutProviderService.get({
            country: 'BR',
            lat: '-2.921890',
            lng: '-60.658435'
        });

        expect(response.exchanges?.length).to.equal(2);
        expect(response.merchants?.length).to.equal(1);
        expect(response.merchants![0].name).to.equal('merchant 2');
    });

    it('should failed with no query params', async () => {
        cashoutProviderService
            .get({})
            .catch(e => expect(e.name).to.be.equal('INVALID_QUERY'))
            .then(() => {
                throw new Error("'fails to get provider' expected to fail");
            });
    });
});
