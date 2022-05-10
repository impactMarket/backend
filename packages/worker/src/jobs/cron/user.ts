import { interfaces, database } from '@impactmarket/core';
import { QueryTypes, Op } from 'sequelize';

export async function verifyUserSuspectActivity(): Promise<void> {
    const query = `
        WITH active_users AS (
            SELECT 
            "user".address, 
            "user".phone 
            FROM 
            "app_user" as "user"
            WHERE 
            "user".active = true
        ), 
        suspect_phone AS (
            SELECT 
            phone, 
            count(phone) n 
            FROM 
            active_users 
            GROUP BY
            phone
        ) 
        UPDATE 
            "app_user" as "user"
        SET 
            suspect = CASE WHEN suspect_phone.n > 1 THEN true ELSE false END 
        FROM 
            active_users, 
            suspect_phone 
        WHERE 
            "user".address = active_users.address 
            AND suspect_phone.phone = active_users.phone 
            AND suspect = CASE WHEN suspect_phone.n > 1 THEN false ELSE true END;`;

    await database.sequelize.query(query, {
        type: QueryTypes.UPDATE,
    });
}

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
