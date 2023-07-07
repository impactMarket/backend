import { ethers } from 'ethers';

import { AppLog, LogTypes } from '../../../interfaces/app/appLog';
import { BaseError } from '../../../utils/baseError';
import { getUserRoles } from '../../../subgraph/queries/user';
import { models } from '../../../database';

export default class UserLogService {
    public async create(userId: number, type: LogTypes, detail: object, communityId?: number) {
        try {
            await models.appLog.create({
                userId,
                type,
                detail,
                communityId
            });
        } catch (error) {
            console.error('Failed to save log');
        }
    }

    public async get(ambassadorAddress: string, type: string, entity: string): Promise<AppLog[]> {
        if (type === LogTypes.EDITED_COMMUNITY) {
            const community = await models.community.findOne({
                attributes: ['id'],
                where: {
                    id: parseInt(entity, 10),
                    ambassadorAddress
                }
            });

            if (!community) {
                throw new BaseError('COMMUNITY_NOT_FOUND', 'community not found');
            }

            return models.appLog.findAll({
                include: [
                    {
                        attributes: ['firstName', 'address'],
                        model: models.appUser,
                        as: 'user'
                    }
                ],
                where: {
                    communityId: community.id
                }
            });
        }
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
                ambassadorAddress
            }
        });
        if (!community) {
            throw new BaseError('COMMUNITY_NOT_FOUND', 'community not found');
        }

        return models.appLog.findAll({
            include: [
                {
                    attributes: ['firstName', 'address'],
                    model: models.appUser,
                    as: 'user',
                    where: {
                        address: entity
                    }
                }
            ]
        });
    }
}
