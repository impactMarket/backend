import { expect } from 'chai';
import { Sequelize } from 'sequelize';

import { CommunityAttributes } from '../../../src/database/models/ubi/community';
import { ManagerAttributes } from '../../../src/database/models/ubi/manager';
import { User } from '../../../src/interfaces/app/user';
import BeneficiaryService from '../../../src/services/ubi/beneficiary';
import { IListBeneficiary } from '../../../src/types/endpoints';
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

        users = await UserFactory({ n: 10 });
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
        await BeneficiaryFactory(users.slice(0, 8), community.publicId);
    });

    after(async () => {
        // this two has to come first!
        await truncate(sequelize, 'Manager');
        await truncate(sequelize, 'Beneficiary');
        await truncate(sequelize);
    });

    it('order by suspicious activity', async () => {
        // set some as suspect
        await sequelize.models.UserModel.update(
            { suspect: true },
            { where: { address: users[2].address } }
        );
        await sequelize.models.UserModel.update(
            { suspect: true },
            { where: { address: users[4].address } }
        );
        // test results
        let result: IListBeneficiary[];
        result = await BeneficiaryService.list(managers[0].address, true, 0, 5);
        expect(result[0]).to.include({
            address: users[4].address,
            suspect: true,
        });
        expect(result[1]).to.include({
            address: users[2].address,
            suspect: true,
        });
        expect(result[2]).to.include({
            address: users[7].address,
            suspect: false,
        });
        expect(result[3]).to.include({
            address: users[6].address,
            suspect: false,
        });
        expect(result[4]).to.include({
            address: users[5].address,
            suspect: false,
        });
        // change suspects
        await sequelize.models.UserModel.update(
            { suspect: false },
            { where: { address: users[4].address } }
        );
        await sequelize.models.UserModel.update(
            { suspect: true },
            { where: { address: users[5].address } }
        );
        // test results
        result = await BeneficiaryService.list(managers[0].address, true, 0, 5);
        expect(result[0]).to.include({
            address: users[5].address,
            suspect: true,
        });
        expect(result[1]).to.include({
            address: users[2].address,
            suspect: true,
        });
        expect(result[2]).to.include({
            address: users[7].address,
            suspect: false,
        });
        expect(result[3]).to.include({
            address: users[6].address,
            suspect: false,
        });
        expect(result[4]).to.include({
            address: users[4].address,
            suspect: false,
        });
    });

    describe('search', () => {
        it('by name (full)', async () => {
            const user = users[3];
            const result: IListBeneficiary[] = await BeneficiaryService.search(
                users[0].address,
                user.username!
            );
            expect(result.length).to.be.equal(1);
            expect(result[0]).to.contain({
                address: user.address,
                username: user.username!,
            });
        });

        it('by name (partially)', async () => {
            const user = users[4];
            const result = await BeneficiaryService.search(
                users[0].address,
                user.username!.slice(0, user.username!.length / 2)
            );
            expect(result.length).to.be.equal(1);
            expect(result[0]).to.contain({
                address: user.address,
                username: user.username!,
            });
        });

        it('by name (not case sensitive)', async () => {
            const user = users[5];
            const result = await BeneficiaryService.search(
                users[0].address,
                user.username!.toUpperCase()
            );
            expect(result.length).to.be.equal(1);
            expect(result[0]).to.contain({
                address: user.address,
                username: user.username!,
            });
        });

        it('by address (checksumed)', async () => {
            const user = users[6];
            const result = await BeneficiaryService.search(
                users[0].address,
                user.address
            );
            expect(result.length).to.be.equal(1);
            expect(result[0]).to.contain({
                address: user.address,
                username: user.username!,
            });
        });

        it('by address (not checksumed)', async () => {
            const user = users[7];
            const result = await BeneficiaryService.search(
                users[0].address,
                user.address.toLowerCase()
            );
            expect(result.length).to.be.equal(1);
            expect(result[0]).to.contain({
                address: user.address,
                username: user.username!,
            });
        });

        it('by non (beneficiary) existing address', async () => {
            const user = users[8];
            const result = await BeneficiaryService.search(
                users[0].address,
                user.address.toLowerCase()
            );
            expect(result.length).to.be.equal(0);
        });

        it('by non (beneficiary) existing name', async () => {
            const user = users[9];
            const result = await BeneficiaryService.search(
                users[0].address,
                user.username!.toUpperCase()
            );
            expect(result.length).to.be.equal(0);
        });
    });
});
