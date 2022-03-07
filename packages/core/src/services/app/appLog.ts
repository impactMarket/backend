import { LogTypes, AppLog } from '../../interfaces/app/appLog';
import { Op } from 'sequelize';
import { models } from '../../database';
import { BaseError } from '../../utils/baseError';

interface LogReturn {
    community: {
        id: number,
        name: string,
    },
    logs: AppLog[]
}

export default class LogService {
    public static async saveLog(
        user: string | number,
        type: LogTypes,
        detail: object,
    ) {
        try {
            let userId: number;
            if(typeof user === 'string') {
                userId = (await models.appUser.findOne({
                    where: {
                        address: user,
                    }
                }))!.id;
            } else {
                userId = user
            }
            
            await models.appLog.create({
                userId,
                type,
                detail,
            });
        } catch (error) {
            console.error('Failed to save log');
        }
    }

    public static async getLog(ambassadorAddress: string): Promise<LogReturn[]> {
        const communities = await models.community.findAll({
            attributes: ['id', 'name'],
            include: [
                {
                    attributes: ['address'],
                    model: models.manager,
                    as: 'managers'
                },
                {
                    attributes: ['address'],
                    model: models.beneficiary,
                    as: 'beneficiaries'
                }
            ],
            where: {
                ambassadorAddress,
            },
        });

        if (!communities || !communities.length) {
            throw new BaseError('COMMUNITY_NOT_FOUND', 'community not found');
        }

        const response: LogReturn[] = [];
        for (let i = 0; i < communities.length; i++) {
            const community: any = communities[i].toJSON();
            const addresses: string[] = [];
            community.managers.forEach((el: { address: string }) => {
                addresses.push(el.address);
            });
            community.beneficiaries.forEach((el: { address: string }) => {
                addresses.push(el.address);
            });
    
            const logs: AppLog[] = await models.appLog.findAll({
                include: [{
                    attributes: ['address', 'username'],
                    model: models.appUser,
                    as: 'user',
                    where: {
                        address: { [Op.in]: addresses }
                    }
                }],
                raw: true,
                nest: true,
            });

            console.log({
                community: {
                    id: community.id,
                    name: community.name,
                },
                logs,
            })

            response.push({
                community: {
                    id: community.id,
                    name: community.name,
                },
                logs,
            })
        };

        return response;
    }
}
