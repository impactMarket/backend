import { Sequelize } from 'sequelize';
import { stub, assert, match, SinonStub } from 'sinon';

import GlobalDemographicsService from '../../../src/services/global/globalDemographics';

import { ManagerAttributes } from '../../../src/database/models/ubi/manager';
import { AppUser } from '../../../src/interfaces/app/appUser';
import { BeneficiaryAttributes } from '../../../src/interfaces/ubi/beneficiary';
import { CommunityAttributes } from '../../../src/interfaces/ubi/community';
import { sequelizeSetup, truncate } from '../../config/sequelizeSetup';
import CommunityFactory from '../../factories/community';
import UserFactory from '../../factories/user';
import ManagerFactory from '../../factories/manager';
import BeneficiaryFactory from '../../factories/beneficiary';
import { models } from '../../../src/database';

const genderQueryResult = [
    {
        gender: 'f',
        total: 2740,
        country: 'BR',
    },
    {
        gender: 'm',
        total: 1363,
        country: 'BR',
    },
    {
        gender: 'u',
        total: 100,
        country: 'BR',
    },
    {
        gender: 'm',
        total: 1,
        country: 'CV',
    },
    {
        gender: 'f',
        total: 2,
        country: 'CV',
    },
    {
        gender: 'u',
        total: 10,
        country: 'CV',
    },
    {
        gender: 'o',
        total: 10,
        country: 'CV',
    },
    {
        gender: 'f',
        total: 11,
        country: 'GH',
    },
    {
        gender: 'm',
        total: 26,
        country: 'GH',
    },
    {
        gender: 'o',
        total: 10,
        country: 'GH',
    },
    {
        gender: 'f',
        total: 6,
        country: 'PH',
    },
    {
        gender: 'm',
        total: 5,
        country: 'PH',
    },
    {
        gender: 'u',
        total: 0,
        country: 'PH',
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
        country: 'NG',
        ageRange1: 0,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 0,
        ageRange5: 0,
        ageRange6: 0,
    },
    {
        country: 'VE',
        ageRange1: 0,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 0,
        ageRange5: 0,
        ageRange6: 0,
    },
    {
        country: 'HN',
        ageRange1: 0,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 0,
        ageRange5: 0,
        ageRange6: 0,
    },
    {
        country: 'GH',
        ageRange1: 11,
        ageRange2: 9,
        ageRange3: 3,
        ageRange4: 4,
        ageRange5: 1,
        ageRange6: 0,
    },
    {
        country: 'BR',
        ageRange1: 937,
        ageRange2: 1197,
        ageRange3: 893,
        ageRange4: 502,
        ageRange5: 169,
        ageRange6: 40,
    },
    {
        country: 'PH',
        ageRange1: 3,
        ageRange2: 0,
        ageRange3: 0,
        ageRange4: 3,
        ageRange5: 1,
        ageRange6: 0,
    },
    {
        country: 'CV',
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
        country: 'BR',
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
        country: 'CV',
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
        country: 'GH',
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
        country: 'PH',
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
        country: 'NG',
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
        country: 'VE',
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
        country: 'HN',
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

    let dbGlobalDemographicsInsertStub: SinonStub;
    let dbSequelizeQueryStub: SinonStub;

    before(() => {
        dbSequelizeQueryStub = stub(
            GlobalDemographicsService.sequelize,
            'query'
        );

        dbSequelizeQueryStub
            .withArgs(match(/current_date_year/))
            .returns(Promise.resolve(ageRangeQueryResult as any));
        dbSequelizeQueryStub
            .withArgs(match(/gender/))
            .returns(Promise.resolve(genderQueryResult as any));

        dbGlobalDemographicsInsertStub = stub(
            GlobalDemographicsService.globalDemographics,
            'bulkCreate'
        );
    });

    it('#calculateDemographics()', async () => {
        await GlobalDemographicsService.calculateDemographics();
        //
        await waitForStubCall(dbGlobalDemographicsInsertStub, 1);
        assert.callCount(dbGlobalDemographicsInsertStub, 1);
        assert.calledWith(dbGlobalDemographicsInsertStub.getCall(0), results);
    });
});

describe('calculate global demographics', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let communities: CommunityAttributes[];
    let managers: ManagerAttributes[];
    let beneficiaries: BeneficiaryAttributes[];
    const maxClaim = '450000000000000000000';
    let dbGlobalDemographicsInsertStub: SinonStub;

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();

        users = await UserFactory({
            n: 2,
            props: [
                {
                    gender: 'm'
                },
                {
                    gender: 'f'
                }
            ]
        });
        communities = await CommunityFactory([
            {
                requestByAddress: users[0].address,
                started: new Date(),
                status: 'valid',
                visibility: 'public',
                contract: {
                    baseInterval: 60 * 60 * 24,
                    claimAmount: '1000000000000000000',
                    communityId: 0,
                    incrementInterval: 5 * 60,
                    maxClaim,
                },
                hasAddress: true,
            }
        ]);
        managers = await ManagerFactory([users[0]], communities[0].id);
        beneficiaries = await BeneficiaryFactory(
            users.slice(0, 2),
            communities[0].id
        );
        dbGlobalDemographicsInsertStub = stub(
            GlobalDemographicsService.globalDemographics,
            'bulkCreate'
        );
    });

    after(async () => {
        await truncate(sequelize, 'Beneficiary');
        await truncate(sequelize);
    });

    it('calculateDemographics with undisclosed', async () => {
        await models.appUser.destroy({
            where: {
                address: users[0].address
            }
        });
        await GlobalDemographicsService.calculateDemographics();
        await waitForStubCall(dbGlobalDemographicsInsertStub, 1);
        assert.callCount(dbGlobalDemographicsInsertStub, 1);
        assert.calledWith(dbGlobalDemographicsInsertStub.getCall(0), {
            
        });
    });
});


