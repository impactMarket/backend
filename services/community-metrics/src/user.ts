import { Op, WhereOptions } from 'sequelize';
import { database } from '@impactmarket/core';

export async function verifyDeletedAccounts(): Promise<void> {
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
    } catch (error) {
        await t.rollback();
        console.error('Error verifyDeletedAccounts: ', error);
    }
}
