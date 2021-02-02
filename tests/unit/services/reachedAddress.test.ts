import { stub, assert, match, SinonStub } from 'sinon';
import { Sequelize, DataTypes, Model } from 'sequelize';

import ReachedAddressService from '../../../src/services/reachedAddress';
import { initializeReachedAddress } from '../../../src/database/models/reachedAddress';
import { initializeBeneficiary } from '../../../src/database/models/beneficiary';
import { initializeCommunity } from '../../../src/database/models/community';

// Setup the mock database connection

// this works if run individually

describe('reachedAddress', () => {
    it('#getAllReachedEver()', async () => {
        const dbConfig: any = {
            dialect: 'postgres',
            protocol: 'postgres',
            native: true,
            query: { raw: true }, // I wish, eager loading gets fixed
        };
        const sequelize = new Sequelize(
            'postgresql://postgres:mysecretpassword@localhost/impactmarkettest',
            dbConfig
        );

        initializeReachedAddress(sequelize);
        initializeBeneficiary(sequelize);
        initializeCommunity(sequelize);

        await sequelize.models.ReachedAddress.bulkCreate([
            {
                address: '0x0Bcc4EdE0112bd7CC24DFf1442aC87BA1141e807',
                lastInteraction: '2021-01-02',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0xe9e3AbFEc337A2C71e13eb3AC0f40D36Ca8355B2',
                lastInteraction: '2020-11-19',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                lastInteraction: '2020-11-04',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x404724c5d216A93a8c31eE848f4012dCDa1D7333',
                lastInteraction: '2020-11-13',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x002D33893983E187814Be1bdBe9852299829C554',
                lastInteraction: '2020-11-18',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        await sequelize.models.Community.bulkCreate([
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
                status: 'valid',
                txCreationObj: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                currency: '',
                descriptionEn: null,
                language: '',
                started: '2020-12-16',
            },
        ]);

        await sequelize.models.Beneficiary.bulkCreate([
            {
                address: '0xd55Fae4769e3240FfFf4c17cd2CC03143e55E420',
                communityId: '073ddf28-4a3d-4e05-8570-ff38b656b46f',
                txAt: new Date(),
                claims: 0,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: true,
                tx:
                    '0xb56148b8a8c559bc52e438a8d50afc5c1f68201a07c6c67615d1e2da00999f5b',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                address: '0x002D33893983E187814Be1bdBe9852299829C554',
                communityId: '073ddf28-4a3d-4e05-8570-ff38b656b46f',
                txAt: new Date(),
                claims: 0,
                lastClaimAt: null,
                penultimateClaimAt: null,
                active: false,
                tx:
                    '0xef364783a779a9787ec590a3b40ba53915713c8c10315f98740819321b3423d9',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        // const x = await us.findAll({ attributes: ['address'] });
        // const r = await sequelize.models.UserModel.findAll({ attributes: ['address'] });
        const s = await ReachedAddressService.getAllReachedEver();
        // console.log(r, s, x);
        console.log(s);

        await sequelize.models.ReachedAddress.destroy({
            where: {},
        });
        await sequelize.models.Beneficiary.destroy({
            where: {},
        });
        await sequelize.models.Community.destroy({
            where: {},
        });
        //
        // await waitForStubCall(dbGlobalDemographicsInsertStub, 1);
        // assert.callCount(dbGlobalDemographicsInsertStub, 1);
        // assert.calledWith(dbGlobalDemographicsInsertStub.getCall(0), results);
    });
});
