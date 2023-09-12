import { BaseError } from '../../../utils/baseError';
import {
    CommunityAttributes,
    IBaseCommunityAttributes,
    ICommunityCreationAttributes
} from '../../../interfaces/ubi/community';
import { CommunityDetailsService } from './details';
import { LogTypes } from '../../../interfaces/app/appLog';
import { getUserRoles } from '../../../subgraph/queries/user';
import { models, sequelize } from '../../../database';

export class CommunityCreateService {
    sequelize = sequelize;
    communityDetailsService = new CommunityDetailsService();

    public async create({
        requestByAddress,
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
        placeId
    }: ICommunityCreationAttributes): Promise<CommunityAttributes> {
        const createObject: ICommunityCreationAttributes = {
            requestByAddress,
            name,
            description,
            language,
            currency,
            city,
            country,
            gps,
            email,
            coverMediaPath,
            placeId,
            visibility: 'public', // will be changed if private
            status: 'pending', // will be changed if private
            started: new Date()
        };

        const t = await this.sequelize.transaction();
        try {
            const community = await models.community.create(createObject, {
                transaction: t,
                returning: true
            });
            const { claimAmount, maxClaim, decreaseStep, baseInterval, incrementInterval } = contractParams!;

            await models.ubiCommunityContract.create(
                {
                    communityId: community.id,
                    claimAmount: claimAmount as number,
                    maxClaim: maxClaim as number,
                    decreaseStep: decreaseStep as number,
                    baseInterval,
                    incrementInterval
                },
                { transaction: t }
            );
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit();
            return community;
        } catch (error) {
            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            // Since this is the service, we throw the error back to the controller,
            // so the route returns an error.
            if ((error as any).name === 'SequelizeUniqueConstraintError') {
                throw new BaseError('ALREADY_HAS_COMMUNITY', 'A user cannot create two communities');
            }
            throw new BaseError('ERROR', (error as any).message);
        }
    }

    public async editSubmission(communityId: number, params: IBaseCommunityAttributes): Promise<CommunityAttributes> {
        const t = await this.sequelize.transaction();
        try {
            const community = await models.community.findOne({
                attributes: ['id', 'requestByAddress', 'ambassadorAddress'],
                where: {
                    status: 'pending',
                    id: communityId
                }
            });

            if (community === null) {
                throw new BaseError('COMMUNITY_NOT_FOUND', 'community not found!');
            }

            // verify if user is the creator or ambassador of the community
            if (
                params.requestByAddress !== community.requestByAddress &&
                params.requestByAddress !== community.ambassadorAddress
            ) {
                throw new BaseError('NOT_ALLOWED', 'User not allowed to edit the community');
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
                placeId
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
                    placeId
                },
                {
                    where: {
                        id: community.id
                    },
                    transaction: t
                }
            );

            if (contractParams) {
                const { claimAmount, maxClaim, decreaseStep, baseInterval, incrementInterval } = contractParams;

                await models.ubiCommunityContract.update(
                    {
                        claimAmount: claimAmount as number,
                        maxClaim: maxClaim as number,
                        decreaseStep: decreaseStep as number,
                        baseInterval,
                        incrementInterval
                    },
                    {
                        where: { communityId },
                        transaction: t
                    }
                );
            }

            await t.commit();

            return this.communityDetailsService.findById(community.id, params.requestByAddress);
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
        const roles = await getUserRoles(ambassadorAddress);

        if (!roles.ambassador || !roles.ambassador.communities) {
            throw new BaseError('NOT_AMBASSADOR', 'user is not an ambassador');
        }

        const result = await models.community.update(
            {
                review,
                ambassadorAddress
            },
            {
                where: { id }
            }
        );

        if (result[0] === 0) {
            throw new BaseError('UPDATE_FAILED', 'community was not updated!');
        }

        return true;
    }

    public async edit(
        address: string,
        communityId: number,
        params: {
            name?: string;
            description?: string;
            coverMediaPath?: string;
        },
        userId?: number
    ): Promise<CommunityAttributes> {
        const { name, description, coverMediaPath } = params;

        const roles = await getUserRoles(address);

        if (!roles.ambassador && !roles.councilMember) {
            throw new BaseError('UNAUTHORIZED', 'user must be ambassador or council member');
        }

        const community = await models.community.findOne({
            attributes: ['contractAddress'],
            where: {
                id: communityId
            }
        });

        if (!community || !community.contractAddress) {
            throw new BaseError('COMMUNITY_NOT_FOUND', 'community not found');
        }

        if (roles.ambassador && roles.ambassador.communities.indexOf(community.contractAddress.toLowerCase()) === -1) {
            throw new BaseError('UNAUTHORIZED', 'user is not the ambassador of the requested community');
        }

        const update = await models.community.update(
            {
                name,
                description,
                coverMediaPath
            },
            {
                where: {
                    id: communityId
                }
            }
        );
        if (update[0] === 0) {
            throw new BaseError('UPDATE_FAILED', 'community was not updated!');
        }

        if (userId) {
            await models.appLog.create({
                userId,
                type: LogTypes.EDITED_COMMUNITY,
                detail: params,
                communityId
            });
        }

        return this.communityDetailsService.findById(communityId, address);
    }
}
