import { User } from '@interfaces/app/user';

import { models, sequelize } from '../../../database';
import { Op } from 'sequelize';

export async function verifyUserSuspectActivity(): Promise<void> {
    const users = await models.user.findAll({
        include: [
            {
                model: models.appUserTrust,
                as: 'trust',
                include: [
                    {
                        model: models.appUserTrust,
                        as: 'selfTrust',
                    },
                ],
            },
        ],
    });
    for (let c = 0; c < users.length; c++) {
        const user = users[c].toJSON() as User;
        if (user.trust && user.trust.length > 0) {
            const couldBeSuspect = user.trust.filter((tt) => {
                if (tt.selfTrust && tt.selfTrust.length > 1) {
                    return true;
                }
                return false;
            });
            if (couldBeSuspect.length > 0) {
                await models.user.update(
                    {
                        suspect: true,
                    },
                    {
                        where: { address: user.address },
                        returning: false,
                    }
                );
            } else {
                // was it suspect before?
                if (user.suspect) {
                    await models.user.update(
                        {
                            suspect: false,
                        },
                        {
                            where: { address: user.address },
                            returning: false,
                        }
                    );
                }
            }
        }
    }
};

export async function verifyDeletedAccounts(): Promise<void> {
    const t = await sequelize.transaction();
    try {
        let date = new Date();
        date.setDate(date.getDate()-15);

        const users = await models.user.findAll({
            attributes: ['address'],
            where: {
                deletedAt: { [Op.lt]: date },
            },
            include: [
                {
                    model: models.appUserTrust,
                    as: 'trust'
                }
            ]
        });

        if(!users || !users.length) {
            throw new Error('Users not found');
        }

        const addresses = users.map(el => el.address);
        
        users.forEach((user: User) => {
            user.trust?.forEach(async (el) => {
                await models.appUserTrust.destroy({
                    where: {
                        id: el.id
                    },
                    transaction: t
                })
            });
        });

        await models.beneficiary.update({
            active: false
        }, {
            where: {
                address: { [Op.in]: addresses }
            }
        });

        await models.manager.update({
            active: false
        }, {
            where: {
                address: { [Op.in]: addresses }
            }
        });

        await models.storyContent.destroy({
            where: {
                byAddress: { [Op.in]: addresses }
            },
            transaction: t
        });

        await models.storyUserEngagement.destroy({
            where: {
                address: { [Op.in]: addresses }
            },
            transaction: t
        });

        await models.user.destroy({
            where: {
                address: { [Op.in]: addresses },
            },
            transaction: t
        });

        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
}
