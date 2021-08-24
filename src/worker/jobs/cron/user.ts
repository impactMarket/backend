import { QueryTypes } from 'sequelize';

import { sequelize } from '../../../database';

export async function verifyUserSuspectActivity(): Promise<void> {
    const query = `WITH 
    active_users 
        AS (SELECT "user".address, "trust".phone
                FROM public.user AS "user" 
                LEFT OUTER JOIN app_user_through_trust AS "through_trust"
                    ON "user".address = "through_trust"."userAddress"
                LEFT OUTER JOIN app_user_trust AS "trust"
                    ON "through_trust"."appUserTrustId" = "trust".id
                WHERE "user".active = true),
    suspect
        AS (SELECT address FROM (SELECT phone FROM active_users GROUP BY phone HAVING count(phone) > 1) as phones 
                LEFT OUTER JOIN active_users ON active_users.phone = phones.phone),
    update_trust
        AS (UPDATE public.user SET suspect = false WHERE suspect = true AND address NOT IN (SELECT * FROM suspect))
    UPDATE public.user SET suspect = true WHERE address IN (SELECT * FROM suspect)`;

    await sequelize.query(query, {
        type: QueryTypes.UPDATE,
    });
}
