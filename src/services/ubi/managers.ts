import { ManagerAttributes } from '@models/ubi/manager';
import { BaseError } from '@utils/baseError';
import { Logger } from '@utils/logger';
import { isAddress, isUUID } from '@utils/util';
import { col, fn, QueryTypes, Transaction } from 'sequelize';

import { models, sequelize } from '../../database';
import { IManagerDetailsManager } from '../../types/endpoints';

export default class ManagerService {
    public static manager = models.manager;
    public static sequelize = sequelize;

    public static async add(
        address: string,
        communityId: number,
        t: Transaction | undefined = undefined
    ): Promise<boolean> {
        // if user does not exist, add to pending list
        // otherwise update
        const manager = await this.manager.findOne({
            where: { address, communityId },
        });
        if (manager === null) {
            const managerData = {
                address,
                communityId,
            };
            try {
                const updated = await this.manager.create(managerData, {
                    transaction: t,
                });
                return updated[0] > 0;
            } catch (e) {
                if (e.name !== 'SequelizeUniqueConstraintError') {
                    Logger.error(
                        'Error inserting new Manager. Data = ' +
                            JSON.stringify(managerData)
                    );
                    Logger.error(e);
                }
                return false;
            }
        }
        return true;
    }

    public static async get(
        address: string
    ): Promise<ManagerAttributes | null> {
        const r = await this.manager.findOne({
            where: { address, active: true },
        });
        if (r) {
            return r.toJSON() as ManagerAttributes;
        }
        return null;
    }

    /**
     * @deprecated Since mobile version 1.1.0
     */
    public static async search(
        managerAddress: string,
        address: string
    ): Promise<IManagerDetailsManager[]> {
        // select mq."user" address, u.username username, mq."createdAt" "timestamp"
        // from manager m, manager mq
        //     left join "user" u on u.address = mq."user"
        // where m."communityId" = mq."communityId"
        // and m."user" = '0x833961aab38d24EECdCD2129Aa5a5d41Fd86Acbf'
        // and mq."user" = '0x64771E37aA6cD3AeD0660fee96F6651CE4d1E3a5'
        // order by mq."createdAt" desc

        if (!isAddress(managerAddress)) {
            throw {
                code: 'NOT_MANAGER',
                message: 'Not a manager ' + managerAddress,
            };
        }

        return await this.sequelize.query(
            'select mq."address" address, u.username username, mq."createdAt" "timestamp" from manager m, manager mq left join "app_user" u on u.address = mq."address" where mq.active = true and m."communityId" = mq."communityId" and m."address" = \'' +
                managerAddress +
                '\'  and mq."address" = \'' +
                address +
                '\' order by mq."createdAt" desc',
            { type: QueryTypes.SELECT }
        );
    }

    /**
     * @deprecated Since mobile version 1.1.0 Replaced with /community/{id}/managers
     */
    public static async listManagers(
        managerAddress: string,
        offset: number,
        limit: number
    ): Promise<IManagerDetailsManager[]> {
        // select mq."user" address, u.username username, mq."createdAt" "timestamp"
        // from manager m, manager mq
        //     left join "user" u on u.address = mq."user"
        // where m."communityId" = mq."communityId"
        // and m."user" = '0x833961aab38d24EECdCD2129Aa5a5d41Fd86Acbf'
        // order by mq."createdAt" desc
        // offset 0
        // limit 10

        if (!isAddress(managerAddress)) {
            throw {
                code: 'NOT_MANAGER',
                message: 'Not a manager ' + managerAddress,
            };
        }

        return await this.sequelize.query(
            'select mq."address" address, u.username username, mq."createdAt" "timestamp" from manager m, manager mq left join "app_user" u on u.address = mq."address" where mq.active = true and m."communityId" = mq."communityId" and m."address" = \'' +
                managerAddress +
                '\' order by mq."createdAt" desc offset ' +
                offset +
                ' limit ' +
                limit,
            { type: QueryTypes.SELECT }
        );
    }

    public static async remove(
        address: string,
        communityId: number
    ): Promise<void> {
        await this.manager.update(
            { active: false },
            {
                where: { address, communityId },
            }
        );
    }

    public static async readRules(address: string): Promise<boolean> {
        try {
            const updated = await models.manager.update(
                {
                    readRules: true,
                },
                {
                    where: { address },
                }
            );

            if (updated[0] === 0) {
                throw new BaseError('UPDATE_FAILED', 'Manager was not updated');
            }
            return true;
        } catch (error) {
            throw new BaseError('UPDATE_FAILED', 'Manager was not updated');
        }
    }
}
