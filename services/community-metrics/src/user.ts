import { Op, WhereOptions } from 'sequelize';
import { database, utils, config } from '@impactmarket/core';

export async function verifyDeletedAccounts(): Promise<void> {
    utils.Logger.info('Verifying user accounts to delete...');
    const t = await database.sequelize.transaction();
    try {
        const date = new Date();
        date.setDate(date.getDate() - 15);

        const { lt } = Op;

        const users = await database.models.appUser.findAll({
            attributes: ['address'],
            where: {
                deletedAt: { [lt]: date },
            },
        });

        const addresses = users.map((el) => el.address);

        await database.models.appUser.destroy({
            where: {
                address: { [Op.in]: addresses },
            } as WhereOptions,
            transaction: t,
        });

        await t.commit();
        utils.Logger.info('User accounts to delete verified!');
    } catch (error) {
        await t.rollback();
        utils.slack.sendSlackMessage('🚨 Error to verify deleted accounts', config.slack.lambdaChannel);
        utils.Logger.error('Error verifyDeletedAccounts: ', error);
    }
}
