import { Sequelize } from 'sequelize';
import { CommunityAttributes } from '../../../src/database/models/ubi/community';
import { ManagerAttributes } from '../../../src/database/models/ubi/manager';

import { User } from '../../../src/interfaces/app/user';
import BeneficiaryService from '../../../src/services/ubi/beneficiary';
import BeneficiaryFactory from '../../factories/beneficiary';
import CommunityFactory from '../../factories/community';
import ManagerFactory from '../../factories/manager';
import UserFactory from '../../factories/user';
import truncate, { sequelizeSetup } from '../../utils/sequelizeSetup';

// in this test there are users being assined with suspicious activity and others being removed
describe('beneficiary service', () => {
    let sequelize: Sequelize;
    let users: User[];
    let communities: CommunityAttributes[];
    let managers: ManagerAttributes[];
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
            },
        ]);
        const community = {
            ...communities[0],
            contract: {
                baseInterval: 60 * 60 * 24,
                claimAmount: '1000000000000000000',
                communityId: 0,
                incrementInterval: 5 * 60,
                maxClaim: '450000000000000000000',
            },
        };
        managers = await ManagerFactory([users[0]], community.publicId);
        const beneficiaries = await BeneficiaryFactory(
            users,
            community.publicId
        );
    });

    after(async () => {
        // this two has to come first!
        await truncate(sequelize, 'Manager');
        await truncate(sequelize, 'Beneficiary');
        await truncate(sequelize);
    });

    it('order by suspicious activity', async () => {
        await BeneficiaryService.listBeneficiaries(
            managers[0].address,
            true,
            0,
            3
        );
    });
});
