import { models, sequelize } from '../../../database';
import {
    CommunityAttributes,
    IBaseCommunityAttributes,
} from '../../../interfaces/ubi/community';
import { BaseError } from '../../../utils/baseError';
import CommunityContractService from './contract';
import { CommunityDetailsService } from './details';

export class CommunityEditService {
    sequelize = sequelize;
    communityContractService = new CommunityContractService();
    communityDetailsService = new CommunityDetailsService();

    public async editSubmission(
        communityId: number,
        params: IBaseCommunityAttributes
    ): Promise<CommunityAttributes> {
        const t = await this.sequelize.transaction();
        try {
            const community = await models.community.findOne({
                attributes: ['id', 'requestByAddress', 'ambassadorAddress'],
                where: {
                    status: 'pending',
                    id: communityId,
                },
            });

            if (community === null) {
                throw new BaseError(
                    'COMMUNITY_NOT_FOUND',
                    'community not found!'
                );
            }

            // verify if user is the creator or ambassador of the community
            if (
                params.requestByAddress !== community.requestByAddress &&
                params.requestByAddress !== community.ambassadorAddress
            ) {
                throw new BaseError(
                    'NOT_ALLOWED',
                    'User not allowed to edit the community'
                );
            }

            const {
                name,
                description,
                language,
                currency,
                city,
                country,
                gps,
                email,
                contractParams,
                coverMediaPath,
            } = params;

            await models.community.update(
                {
                    name,
                    description,
                    language,
                    currency,
                    city,
                    country,
                    gps,
                    email,
                    coverMediaPath,
                },
                {
                    where: {
                        id: community.id,
                    },
                    transaction: t,
                }
            );

            if (contractParams) {
                await this.communityContractService.update(
                    community.id,
                    contractParams
                );
            }

            await t.commit();

            return this.communityDetailsService.findById(
                community.id,
                params.requestByAddress
            );
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    public async review(
        id: number,
        review: 'pending' | 'claimed' | 'declined' | 'accepted',
        ambassadorAddress: string
    ): Promise<boolean> {
        // TODO: validate if ambassador

        const result = await models.community.update(
            {
                review,
                ambassadorAddress,
            },
            {
                where: { id },
            }
        );

        if (result[0] === 0) {
            throw new BaseError('UPDATE_FAILED', 'community was not updated!');
        }

        return true;
    }
}
