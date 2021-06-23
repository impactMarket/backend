import { User } from '@interfaces/app/user';

import { models } from '../../../database';

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
}
