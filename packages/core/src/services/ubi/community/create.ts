import { ethers } from 'ethers';

import CommunityContractABI from '../../../contracts/CommunityABI.json';
import { Community, models, sequelize } from '../../../database';
import {
    CommunityAttributes,
    IBaseCommunityAttributes,
    ICommunityCreationAttributes,
} from '../../../interfaces/ubi/community';
import { BaseError } from '../../../utils/baseError';
import CommunityContractService from './contract';
import { CommunityDetailsService } from './details';

export class CommunityCreateService {
    sequelize = sequelize;
    communityContractService = new CommunityContractService();
    communityDetailsService = new CommunityDetailsService();

    public async create({
        requestByAddress,
        name,
        contractAddress,
        description,
        language,
        currency,
        city,
        country,
        gps,
        email,
        txReceipt,
        contractParams,
        coverMediaPath,
    }: ICommunityCreationAttributes): Promise<Community> {
        let managerAddress: string = '';
        let createObject: ICommunityCreationAttributes = {
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
            visibility: 'public', // will be changed if private
            status: 'pending', // will be changed if private
            started: new Date(),
        };

        // if it was submitted as private, validate the transaction first.
        if (txReceipt !== undefined) {
            const ifaceCommunity = new ethers.utils.Interface(
                CommunityContractABI
            );
            const eventsCoomunity: ethers.utils.LogDescription[] = [];
            for (let index = 0; index < txReceipt.logs.length; index++) {
                try {
                    const parsedLog = ifaceCommunity.parseLog(
                        txReceipt.logs[index]
                    );
                    eventsCoomunity.push(parsedLog);
                } catch (e) {}
            }
            const index = eventsCoomunity.findIndex(
                (event) => event !== null && event.name === 'ManagerAdded'
            );
            if (index !== -1) {
                managerAddress = eventsCoomunity[index].args[0];
            } else {
                throw new BaseError('EVENT_NOT_FOUND', 'Event not found!');
            }
            createObject = {
                ...createObject,
                contractAddress: contractAddress!,
                visibility: 'private',
                status: 'valid',
            };
        }

        const t = await this.sequelize.transaction();
        try {
            const community = await models.community.create(createObject, {
                transaction: t,
            });
            await this.communityContractService.add(
                community.id,
                contractParams!,
                t
            );
            // await CommunityStateService.add
            if (txReceipt !== undefined) {
                await this.communityDetailsService.addManager(
                    managerAddress,
                    community.id,
                    t
                );
            }
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
                throw new BaseError(
                    'ALREADY_HAS_COMMUNITY',
                    'A user cannot create two communities'
                );
            }
            throw new BaseError('ERROR', (error as any).message);
        }
    }

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
