import { User } from '@interfaces/app/user';
import { Op } from 'sequelize';

import { models } from '../../../database';

export async function verifyUserSuspectActivity(): Promise<void> {
    const users = await models.user.findAll({
        include: [
            {
                model: models.appUserTrust,
                as: 'throughTrust',
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
        if (user.throughTrust && user.throughTrust.length > 0) {
            const suspectInId: number[] = [];
            const couldBeSuspect = user.throughTrust.filter((tt) => {
                if (tt.selfTrust && tt.selfTrust.length > 1) {
                    suspectInId.push(tt.id);
                    return true;
                }
                return false;
            });
            if (couldBeSuspect.length > 0) {
                await models.appUserTrust.update(
                    {
                        suspect: true,
                    },
                    {
                        where: { id: { [Op.in]: suspectInId } },
                        returning: false,
                    }
                );
            } else {
                // was it suspect before?
                const wasSuspect = user.throughTrust.filter((tt) => {
                    if (
                        tt.selfTrust &&
                        tt.selfTrust.length === 1 &&
                        tt.selfTrust[0].suspect
                    ) {
                        suspectInId.push(tt.id);
                        return true;
                    }
                    return false;
                });
                if (wasSuspect.length > 0) {
                    await models.appUserTrust.update(
                        {
                            suspect: false,
                        },
                        {
                            where: { id: { [Op.in]: suspectInId } },
                            returning: false,
                        }
                    );
                }
            }
        }
    }
}
