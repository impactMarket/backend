import { LogTypes, AppLog } from '../../../interfaces/app/appLog';
import { models } from '../../../database';
import { BaseError } from '../../../utils/baseError';
import { getUserRoles } from '../../../subgraph/queries/user';

export default class UserLogService {
    public async create(
        userId: number,
        type: LogTypes,
        detail: object,
        communityId?: number,
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

    public async get(ambassadorAddress: string, type: string, entity: string): Promise<AppLog[]> {
        const community = await models.community.findOne({
            attributes: ['id', 'contractAddress'],
            where: {
                ambassadorAddress,
            }
        });

        if (!community) {
            throw new BaseError('COMMUNITY_NOT_FOUND', 'community not found');
        }

        if (type === LogTypes.EDITED_COMMUNITY) {
            if (community.id !== parseInt(entity)) {
                throw new BaseError('COMMUNITY_NOT_FOUND', 'community not found');
            }

            return models.appLog.findAll({
                include: [{
                    attributes: ['username', 'address'],
                    model: models.appUser,
                    as: 'user',
                }],
                where: {
                    communityId: community.id,
                }
            });
        } else {
            const roles = await getUserRoles(entity);
            let contractAddress = roles.beneficiary?.community 
                                    ? roles.beneficiary.community 
                                    : roles.manager?.community 
                                        ? roles.manager.community 
                                        : null;
            if (!contractAddress || (community.contractAddress?.toLocaleLowerCase() !== contractAddress.toLocaleLowerCase())) {
                throw new BaseError('USER_NOT_FOUND', 'user not found');
            }

            return models.appLog.findAll({
                include: [{
                    attributes: ['username', 'address'],
                    model: models.appUser,
                    as: 'user',
                    where: {
                        address: entity,
                    }
                }],
            });
        }        
    }
}
