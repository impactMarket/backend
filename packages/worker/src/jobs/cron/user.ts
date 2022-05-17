import { interfaces, database } from '@impactmarket/core';
import { QueryTypes, Op } from 'sequelize';

export async function verifyDeletedAccounts(): Promise<void> {
    const t = await database.sequelize.transaction();
    try {
        const date = new Date();
        date.setDate(date.getDate() - 15);

        const users = await database.models.appUser.findAll({
            attributes: ['address'],
            where: {
                deletedAt: { [Op.lt]: date },
            },
            include: [
                {
                    model: database.models.appUserTrust,
                    as: 'trust',
                },
            ],
        });

        const addresses = users.map((el) => el.address);

        users.forEach((user: interfaces.app.appUser.AppUser) =>
            user.trust?.forEach(async (el) => {
                await database.models.appUserTrust.destroy({
                    where: {
                        id: el.id,
                    },
                    transaction: t,
                });
            })
        );

        await database.models.appUser.destroy({
            where: {
                address: { [Op.in]: addresses },
            },
            transaction: t,
        });

        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
}
