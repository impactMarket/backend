import { expect } from 'chai';
import { Sequelize } from 'sequelize';

import { AppUser } from '../../../src/interfaces/app/appUser';
import { CommunityAttributes } from '../../../src/interfaces/ubi/community';
import UserService from '../../../src/services/app/user/index';
import { sequelizeSetup, truncate } from '../../config/sequelizeSetup';
import CommunityFactory from '../../factories/community';
import UserFactory from '../../factories/user';

describe('user service v2', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let communities: CommunityAttributes[];

    const userService = new UserService();

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();
        users = await UserFactory({ n: 5 });

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
                    maxClaim: '450000000000000000000',
                },
                hasAddress: true,
                ambassadorAddress: users[1].address,
            },
            {
                requestByAddress: users[2].address,
                started: new Date(),
                status: 'valid',
                visibility: 'public',
                contract: {
                    baseInterval: 60 * 60 * 24,
                    claimAmount: '1000000000000000000',
                    communityId: 0,
                    incrementInterval: 5 * 60,
                    maxClaim: '450000000000000000000',
                },
                hasAddress: true,
                ambassadorAddress: users[3].address,
            },
        ]);
    });

    describe('report', () => {
        after(async () => {
            await truncate(sequelize, 'Community');
            await truncate(sequelize, 'AppAnonymousReportModel');
        });

        describe('create', () => {
            it('create successfully', async () => {
                const firstReport = await userService.report(
                    'report',
                    communities[0].id,
                    'general'
                );
                const secondReport = await userService.report(
                    'report2',
                    communities[1].id,
                    'general'
                );

                expect(firstReport).to.be.true;
                expect(secondReport).to.be.true;
            });
        });

        describe('list', () => {
            it('list by ambassador address', async () => {
                const reports = await userService.getReport(users[1].address, {});

                expect(reports.count).to.be.eq(1);
                expect(reports.rows[0]).to.include({
                    communityId: communities[0].id,
                    message: 'report',
                    category: 'general',
                });
            });
        });
    });
});
