import { expect } from 'chai';
import { Sequelize } from 'sequelize';
import { replace, restore } from 'sinon';

import { database, interfaces, tests } from '@impactmarket/core';

import { verifyUserSuspectActivity } from '../../../src/jobs/cron/user';

// in this test there are users being assined with suspicious activity and others being removed
describe('[jobs - cron] verifyUserSuspectActivity', () => {
    let sequelize: Sequelize;
    before(async () => {
        sequelize = tests.config.setup.sequelizeSetup();
        await sequelize.sync();

        replace(database.sequelize, 'query', sequelize.query);
    });

    afterEach(async () => {
        await tests.config.setup.truncate(sequelize, 'AppUserModel');
        await tests.config.setup.truncate(sequelize);
    });

    after(() => {
        restore();
    });

    it('should detect suspicious account', async () => {
        await tests.factories.UserFactory({
            n: 3,
            props: [
                {
                    phone: '00351969696966',
                },
                {
                    phone: '00351969696966',
                },
                {
                    phone: '00351969696967',
                },
            ],
        });
        await verifyUserSuspectActivity();
        const users: interfaces.app.appUser.AppUser[] = await database.models.appUser.findAll({
            include: [
                {
                    model: database.models.appUserTrust,
                    as: 'trust',
                },
            ],
        });

        users.forEach((user) => {
            if (user.trust![0].phone === '00351969696966') {
                expect(user.suspect).to.be.equal(true);
            } else {
                expect(user.suspect).to.be.equal(false);
            }
        });
    });

    it('should remove suspect status from unsuspecting accounts', async () => {
        await tests.factories.UserFactory({
            n: 3,
            props: [
                {
                    phone: '00351969696969',
                    suspect: true, // was suspect before
                },
                {
                    phone: '00351969696970',
                },
                {
                    phone: '00351969696970',
                },
            ],
        });
        await verifyUserSuspectActivity();
        const users: interfaces.app.appUser.AppUser[] = await database.models.appUser.findAll({
            include: [
                {
                    model: database.models.appUserTrust,
                    as: 'trust',
                },
            ],
        });

        users.forEach((user) => {
            if (user.trust![0].phone === '00351969696969') {
                expect(user.suspect).to.be.equal(false);
            } else {
                expect(user.suspect).to.be.equal(true);
            }
        });
    });

    it('should ignore inactive accounts', async () => {
        await tests.factories.UserFactory({
            n: 2,
            props: [
                {
                    phone: '00351969696970',
                    active: false,
                },
                {
                    phone: '00351969696970',
                    suspect: true,
                },
            ],
        });
        await verifyUserSuspectActivity();
        const users: interfaces.app.appUser.AppUser[] = await database.models.appUser.findAll({
            include: [
                {
                    model: database.models.appUserTrust,
                    as: 'trust',
                },
            ],
        });

        users.forEach((user) => {
            expect(user.suspect).to.be.equal(false);
        });
    });

    // TODO: devide in two tests, one to find suspect, one to remove
});
