import { ethers } from 'ethers';

import { models } from '../../../database';
import { LogTypes, AppLog } from '../../../interfaces/app/appLog';
import { getUserRoles } from '../../../subgraph/queries/user';
import { BaseError } from '../../../utils/baseError';

export default class UserLogService {
    public async create(
        userId: number,
        type: LogTypes,
        detail: object,
        communityId?: number
    ) {
        try {
            await models.appLog.create({
                userId,
                type,
                detail,
                communityId,
            });
        } catch (error) {
            console.error('Failed to save log');
        }
    }

    public async get(
        ambassadorAddress: string,
        type: string,
        entity: string
    ): Promise<AppLog[]> {
        if (type === LogTypes.EDITED_COMMUNITY) {
            const community = await models.community.findOne({
                attributes: ['id'],
                where: {
                    id: parseInt(entity),
                    ambassadorAddress,
                },
            });

            if (!community) {
                throw new BaseError(
                    'COMMUNITY_NOT_FOUND',
                    'community not found'
                );
            }

            return models.appLog.findAll({
                include: [
                    {
                        attributes: ['username', 'address'],
                        model: models.appUser,
                        as: 'user',
                    },
                ],
                where: {
                    communityId: community.id,
                },
            });
        } else {
            const roles = await getUserRoles(entity);
            const contractAddress = roles.beneficiary?.community
                ? roles.beneficiary.community
                : roles.manager?.community
                ? roles.manager.community
                : null;
            if (!contractAddress) {
                throw new BaseError('USER_NOT_FOUND', 'user not found');
            }
            const community = await models.community.findOne({
                attributes: ['id'],
                where: {
                    contractAddress: ethers.utils.getAddress(contractAddress),
                    ambassadorAddress,
                },
            });
            if (!community) {
                throw new BaseError(
                    'COMMUNITY_NOT_FOUND',
                    'community not found'
                );
            }

            return models.appLog.findAll({
                include: [
                    {
                        attributes: ['username', 'address'],
                        model: models.appUser,
                        as: 'user',
                        where: {
                            address: entity,
                        },
                    },
                ],
            });
        }
    }
}
