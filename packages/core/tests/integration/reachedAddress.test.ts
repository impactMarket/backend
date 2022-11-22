import { assert } from 'chai';
import { Sequelize } from 'sequelize';
import { stub, SinonStub } from 'sinon';

import ReachedAddressService from '../../src/services/reachedAddress';
import * as ubiSubgraph from '../../src/subgraph/queries/ubi';
import { sequelizeSetup } from '../config/sequelizeSetup';

describe('reachedAddress', () => {
    let sequelize: Sequelize;
    let returnGetUbiDailyEntitySubgraph: SinonStub;

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

        returnGetUbiDailyEntitySubgraph = stub(
            ubiSubgraph,
            'getUbiDailyEntity'
        );

        await sequelize.models.ReachedAddress.bulkCreate([
            {
                address: '0x0Bcc4EdE0112bd7CC24DFf1442aC87BA1141e807',
                lastInteraction: yesterday,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0xe9e3AbFEc337A2C71e13eb3AC0f40D36Ca8355B2',
                lastInteraction: twoMonthsAgo,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                lastInteraction: yesterday,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x404724c5d216A93a8c31eE848f4012dCDa1D7333',
                lastInteraction: yesterday,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x002D33893983E187814Be1bdBe9852299829C554',
                lastInteraction: twoMonthsAgo,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const community = await sequelize.models.Community.bulkCreate([
            {
                publicId: '073ddf28-4a3d-4e05-8570-ff38b656b46f',
                requestByAddress: '0x002D33893983E187814Be1bdBe9852299829C554',
                contractAddress: '0x592B9a3a16ad1Ce9a20878a28e3B1eD92D8eDb32',
                name: '',
                description: '',
                city: '',
                country: '',
                gps: { latitude: 0, longitude: 0 },
                email: '',
                visibility: 'public',
                coverImage: '',
                coverMediaId: 0,
                status: 'valid',
                createdAt: new Date(),
                updatedAt: new Date(),
                currency: '',
                descriptionEn: null,
                language: '',
                started: twoMonthsAgo,
            },
        ]);

        await sequelize.models.AppUserModel.bulkCreate([
            {
                address: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x002D33893983E187814Be1bdBe9852299829C554',
                username: 'x1',
                language: 'pt',
                currency: 'BTC',
                pushNotificationToken: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        await sequelize.models.Beneficiary.bulkCreate([
            {
                address: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                communityId: (community as any)[0].id,
                txAt: new Date(),
                claims: 0,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: true,
                blocked: false,
                tx: '0xb56148b8a8c559bc52e438a8d50afc5c1f68201a07c6c67615d1e2da00999f5b',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x002D33893983E187814Be1bdBe9852299829C554',
                communityId: (community as any)[0].id,
                txAt: new Date(),
                claims: 0,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: false,
                blocked: false,
                tx: '0xef364783a779a9787ec590a3b40ba53915713c8c10315f98740819321b3423d9',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    });

    after(async () => {
        await sequelize.models.ReachedAddress.destroy({
            where: {},
        });
        await sequelize.models.Beneficiary.destroy({
            where: {},
        });
        await sequelize.models.AppUserModel.destroy({
            where: {},
        });
        await sequelize.models.Community.destroy({
            where: {},
        });
    });

    it('#getAllReachedLast30Days()', async () => {
        returnGetUbiDailyEntitySubgraph.returns([
            {
                // yesterday
                reach: 3,
            },
        ]);
        const reachedAddressService = new ReachedAddressService();
        const s = await reachedAddressService.getAllReachedLast30Days();
        assert.deepEqual(s, { reach: 3, reachOut: 0 });
    });
});
