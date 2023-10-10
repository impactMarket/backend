import { Sequelize } from 'sequelize';
import { expect } from 'chai';

import * as microCreditQueries from '../../../src/subgraph/queries/microcredit';
import { AppUser } from '../../../src/interfaces/app/appUser';
import { SinonStub, stub } from 'sinon';
import { sequelizeSetup, truncate } from '../../config/sequelizeSetup';
import MicroCreditCreate from '../../../src/services/microcredit/create';
import MicroCreditList from '../../../src/services/microcredit/list';
import UserFactory from '../../factories/user';

describe('microCredit', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let stubMicroCreditQueries: SinonStub<[borrower: string], Promise<number>>;
    const microCreditCreate = new MicroCreditCreate();
    const microCreditList = new MicroCreditList();

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();
        users = await UserFactory({ n: 5 });
        stubMicroCreditQueries = stub(microCreditQueries, 'getBorrowerLoansCount').resolves(2);
    });

    after(async () => {
        await truncate(sequelize, 'appUser');
        await truncate(sequelize, 'microCreditDocs');
        await truncate(sequelize);
        stubMicroCreditQueries.reset();
    });

    describe('docs', () => {
        it('create and list', async () => {
            await microCreditCreate.postDocs(users[0].id, 1, [
                {
                    filepath: 'test',
                    category: 1
                }
            ]);

            const res = await microCreditList.getBorrower({ address: users[0].address, include: ['docs'] });

            expect(res.docs.length).to.be.equals(1);
            expect(res.docs[0]).to.include({
                filepath: 'test',
                category: 1
            });
        });
    });
});
