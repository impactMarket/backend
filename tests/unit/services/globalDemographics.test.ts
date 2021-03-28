import { stub, assert, match, SinonStub } from 'sinon';

import GlobalDemographicsService from '../../../src/services/global/globalDemographics';

// import * as database from '../../../src/api/loaders/database';

const genderQueryResult = [
    {
        gender: 'f',
        total: 2740,
        country: 'Brasil',
    },
    {
        gender: 'm',
        total: 1363,
        country: 'Brasil',
    },
    {
        gender: 'u',
        total: 100,
        country: 'Brasil',
    },
    {
        gender: 'm',
        total: 1,
        country: 'Cabo Verde',
    },
    {
        gender: 'f',
        total: 2,
        country: 'Cabo Verde',
    },
    {
        gender: 'u',
        total: 10,
        country: 'Cabo Verde',
    },
    {
        gender: 'o',
        total: 10,
        country: 'Cabo Verde',
    },
    {
        gender: 'f',
        total: 11,
        country: 'Ghana',
    },
    {
        gender: 'm',
        total: 26,
        country: 'Ghana',
    },
    {
        gender: 'o',
        total: 10,
        country: 'Ghana',
    },
    {
        gender: 'f',
        total: 6,
        country: 'Philippines',
    },
    {
        gender: 'm',
        total: 5,
        country: 'Philippines',
    },
    {
        gender: 'u',
        total: 0,
        country: 'Philippines',
    },
];

const ageRangeQueryResult: {
    country: string;
    ageRange1: number;
    ageRange2: number;
    ageRange3: number;
    ageRange4: number;
    ageRange5: number;
    ageRange6: number;
}[] = [
    {
        country: 'Nigeria',
        ageRange1: 0,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 0,
        ageRange5: 0,
        ageRange6: 0,
    },
    {
        country: 'Venezuela',
        ageRange1: 0,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 0,
        ageRange5: 0,
        ageRange6: 0,
    },
    {
        country: 'Honduras',
        ageRange1: 0,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 0,
        ageRange5: 0,
        ageRange6: 0,
    },
    {
        country: 'Ghana',
        ageRange1: 11,
        ageRange2: 9,
        ageRange3: 3,
        ageRange4: 4,
        ageRange5: 1,
        ageRange6: 0,
    },
    {
        country: 'Brasil',
        ageRange1: 937,
        ageRange2: 1197,
        ageRange3: 893,
        ageRange4: 502,
        ageRange5: 169,
        ageRange6: 40,
    },
    {
        country: 'Philippines',
        ageRange1: 3,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 3,
        ageRange5: 1,
        ageRange6: 0,
    },
    {
        country: 'Cabo Verde',
        ageRange1: 0,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 0,
        ageRange5: 0,
        ageRange6: 0,
    },
];

const results = [
    {
        date: match.any,
        country: 'Brasil',
        ageRange1: 937,
        ageRange2: 1197,
        ageRange3: 893,
        ageRange4: 502,
        ageRange5: 169,
        ageRange6: 40,
        male: 1363,
        female: 2740,
        undisclosed: 100,
        totalGender: 4203,
    },
    {
        date: match.any,
        country: 'Cabo Verde',
        ageRange1: 0,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 0,
        ageRange5: 0,
        ageRange6: 0,
        male: 1,
        female: 2,
        undisclosed: 20,
        totalGender: 23,
    },
    {
        date: match.any,
        country: 'Ghana',
        ageRange1: 11,
        ageRange2: 9,
        ageRange3: 3,
        ageRange4: 4,
        ageRange5: 1,
        ageRange6: 0,
        male: 26,
        female: 11,
        undisclosed: 10,
        totalGender: 47,
    },
    {
        date: match.any,
        country: 'Philippines',
        ageRange1: 3,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 3,
        ageRange5: 1,
        ageRange6: 0,
        male: 5,
        female: 6,
        undisclosed: 0,
        totalGender: 11,
    },
    {
        date: match.any,
        country: 'Nigeria',
        ageRange1: 0,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 0,
        ageRange5: 0,
        ageRange6: 0,
        // there are default values
    },
    {
        date: match.any,
        country: 'Venezuela',
        ageRange1: 0,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 0,
        ageRange5: 0,
        ageRange6: 0,
        // there are default values
    },
    {
        date: match.any,
        country: 'Honduras',
        ageRange1: 0,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 0,
        ageRange5: 0,
        ageRange6: 0,
        // there are default values
    },
];

async function waitForStubCall(stub: SinonStub<any, any>, callNumber: number) {
    return new Promise((resolve) => {
        const validationInterval = setInterval(() => {
            if (stub.callCount >= callNumber) {
                resolve('');
                clearInterval(validationInterval);
            }
        }, 1000);
    });
}

describe('globalDemographics', () => {
    // TODO: fix whats in comment to work
    // stub(database, 'database').returns({
    //     sequelize: {
    //         query: ''
    //     },
    //     models: {
    //         globalDemographics: {
    //             bulkCreate: ''
    //         }
    //     },
    // });

    const dbSequelizeQueryStub = stub(
        GlobalDemographicsService.sequelize,
        'query'
    );
    const dbGlobalDemographicsInsertStub = stub(
        GlobalDemographicsService.globalDemographics,
        'bulkCreate'
    );

    dbSequelizeQueryStub
        .withArgs(match(/current_date_year/))
        .returns(Promise.resolve(ageRangeQueryResult as any));
    dbSequelizeQueryStub
        .withArgs(match(/gender/))
        .returns(Promise.resolve(genderQueryResult as any));

    it('#calculateDemographics()', async () => {
        await GlobalDemographicsService.calculateDemographics();
        //
        await waitForStubCall(dbGlobalDemographicsInsertStub, 1);
        assert.callCount(dbGlobalDemographicsInsertStub, 1);
        assert.calledWith(dbGlobalDemographicsInsertStub.getCall(0), results);
    });
});
