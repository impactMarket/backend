import { Sequelize } from 'sequelize';
import { SinonStub, assert, match, stub } from 'sinon';

import { AppUser } from '../../../src/interfaces/app/appUser';
import { models } from '../../../src/database';
import { sequelizeSetup, truncate } from '../../config/sequelizeSetup';
import CommunityDemographicsService from '../../../src/services/ubi/communityDemographics';
import CommunityFactory from '../../factories/community';
import GlobalDemographicsService from '../../../src/services/global/globalDemographics';
import UserFactory from '../../factories/user';

const globalDemographicsService = new GlobalDemographicsService();
const communityDemographicsService = new CommunityDemographicsService();

async function waitForStubCall(stub: SinonStub<any, any>, callNumber: number) {
    return new Promise(resolve => {
        const validationInterval = setInterval(() => {
            if (stub.callCount >= callNumber) {
                resolve('');
                clearInterval(validationInterval);
            }
        }, 1000);
    });
}

describe('calculate global demographics', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    const maxClaim = 450;
    let dbGlobalDemographicsInsertStub: SinonStub;

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();

        const year = new Date().getUTCFullYear();
        const ageRange1 = year - 18;
        const ageRange2 = year - 25;
        const ageRange3 = year - 35;
        const ageRange4 = year - 45;
        const ageRange5 = year - 55;
        const ageRange6 = year - 65;

        users = await UserFactory({
            n: 7,
            props: [
                {
                    gender: 'm',
                    year: ageRange1
                },
                {
                    gender: 'm',
                    year: ageRange1
                },
                {
                    gender: 'f',
                    year: ageRange2
                },
                {
                    gender: 'f',
                    year: ageRange3
                },
                {
                    gender: 'f',
                    year: ageRange4
                },
                {
                    gender: 'u',
                    year: ageRange5
                },
                {
                    gender: 'u',
                    year: ageRange6
                }
            ]
        });
        await CommunityFactory([
            {
                requestByAddress: users[0].address,
                started: new Date(),
                status: 'valid',
                visibility: 'public',
                contract: {
                    baseInterval: 60 * 60 * 24,
                    claimAmount: 1,
                    communityId: 0,
                    incrementInterval: 5 * 60,
                    maxClaim
                },
                hasAddress: true
            }
        ]);
        dbGlobalDemographicsInsertStub = stub(globalDemographicsService.globalDemographics, 'bulkCreate');
    });

    after(async () => {
        await truncate(sequelize, 'beneficiary');
        await truncate(sequelize);
    });

    it('calculateDemographics with undisclosed', async () => {
        await models.appUser.destroy({
            where: {
                address: users[0].address
            }
        });

        await communityDemographicsService.calculate();

        await globalDemographicsService.calculate();
        await waitForStubCall(dbGlobalDemographicsInsertStub, 1);
        assert.callCount(dbGlobalDemographicsInsertStub, 1);
        assert.calledWith(dbGlobalDemographicsInsertStub.getCall(0), [
            {
                ageRange1: '1',
                ageRange2: '1',
                ageRange3: '1',
                ageRange4: '1',
                ageRange5: '1',
                ageRange6: '1',
                country: match.any,
                date: match.any,
                female: '3',
                male: '1',
                totalGender: '7',
                undisclosed: '3'
            }
        ]);
    });
});
