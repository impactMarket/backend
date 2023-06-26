import { expect } from 'chai';
import { Sequelize } from 'sequelize';

import { AppUser } from '../../../src/interfaces/app/appUser';
import { sequelizeSetup, truncate } from '../../config/sequelizeSetup';
import UserFactory from '../../factories/user';
import MicroCreditCreate from '../../../src/services/microcredit/create';
import MicroCreditList from '../../../src/services/microcredit/list';
import { SinonStub, stub } from 'sinon';
import * as microCreditQueries from '../../../src/subgraph/queries/microcredit';

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
            await microCreditCreate.postDocs(users[0].id, [
                {
                    filepath: 'test',
                    category: 1
                }
            ]);

            const res = await microCreditList.getBorrower({ address: users[0].address });

            expect(res.docs.length).to.be.equals(1);
            expect(res.docs[0]).to.include({
                filepath: 'test',
                category: 1
            });
        });
    });
});
