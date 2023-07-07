import { Transaction } from 'sequelize';

import { BaseError } from '../../utils/baseError';
import { Logger } from '../../utils/logger';
import { ManagerAttributes } from '../../database/models/ubi/manager';
import { models, sequelize } from '../../database';

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
            where: { address, communityId }
        });
        if (manager === null) {
            const managerData = {
                address,
                communityId
            };
            try {
                const updated = await this.manager.create(managerData, {
                    transaction: t
                });
                return updated[0] > 0;
            } catch (e) {
                if (e.name !== 'SequelizeUniqueConstraintError') {
                    Logger.error('Error inserting new Manager. Data = ' + JSON.stringify(managerData));
                    Logger.error(e);
                }
                return false;
            }
        }
        return true;
    }

    public static async get(address: string): Promise<ManagerAttributes | null> {
        const r = await this.manager.findOne({
            where: { address, active: true }
        });
        if (r) {
            return r.toJSON() as ManagerAttributes;
        }
        return null;
    }

    public static async remove(address: string, communityId: number): Promise<void> {
        await this.manager.update(
            { active: false },
            {
                where: { address, communityId }
            }
        );
    }

    public static async readRules(address: string): Promise<boolean> {
        try {
            const updated = await models.manager.update(
                {
                    readRules: true
                },
                {
                    where: { address }
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
