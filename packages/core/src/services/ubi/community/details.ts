import { BigNumber } from 'bignumber.js';
import { utils, ethers } from 'ethers';
import { Op, WhereOptions } from 'sequelize';

import config from '../../../config';
import { models } from '../../../database';
import { AppUser } from '../../../interfaces/app/appUser';
import { BeneficiaryAttributes } from '../../../interfaces/ubi/beneficiary';
import { CommunityAttributes } from '../../../interfaces/ubi/community';
import { BeneficiarySubgraph } from '../../../subgraph/interfaces/beneficiary';
import {
    getBeneficiariesByAddress,
    getBeneficiaries,
    countBeneficiaries,
} from '../../../subgraph/queries/beneficiary';
import {
    getCommunityManagers,
    getCommunityState,
    getCommunityUBIParams,
} from '../../../subgraph/queries/community';
import { getUserRoles } from '../../../subgraph/queries/user';
import { BaseError } from '../../../utils/baseError';
import { isAddress } from '../../../utils/util';
import { IListBeneficiary, BeneficiaryFilterType } from '../../endpoints';

export class CommunityDetailsService {
    public async getState(communityId: number) {
        const community = await models.community.findOne({
            attributes: ['contractAddress'],
            where: {
                id: communityId,
            },
        });
        if (!community || !community.contractAddress) {
            return null;
        }

        const state = await getCommunityState(community.contractAddress);
        return {
            ...state,
            communityId,
        };
    }

    public async getUBIParams(communityId: number) {
        const community = await models.community.findOne({
            attributes: ['contractAddress'],
            where: {
                id: communityId,
            },
        });
        if (!community || !community.contractAddress) {
            return null;
        }

        const ubiParams = await getCommunityUBIParams(
            community.contractAddress
        );
        return {
            ...ubiParams,
            communityId,
        };
    }

    /**
     * @swagger
     *  components:
     *    schemas:
     *      getManagersResponse:
     *        type: object
     *        properties:
     *          address:
     *            type: string
     *            description: Manager address
     *          username:
     *            type: string
     *            nullable: true
     *            description: Manager username or null
     *          isDeleted:
     *            type: boolean
     *            description: True if manager deleted account
     *          state:
     *            type: integer
     *            description: Manager state (see subgraph schema for more details)
     *          added:
     *            type: integer
     *            description: Number of beneficiaries added by manager
     *          removed:
     *            type: integer
     *            description: Number of beneficiaries removed by manager
     *          since:
     *            type: integer
     *            description: Unix timestamp of when the manager was added
     */
    public async getManagers(
        communityId: number,
        active: boolean | undefined
    ): Promise<
        {
            address: string;
            username: string | null;
            isDeleted: boolean;
            state: number;
            added: number;
            removed: number;
            since: number;
        }[]
    > {
        const community = (await models.community.findOne({
            where: { id: communityId },
        }))!;

        if (community.status === 'pending') {
            const user = await models.appUser.findOne({
                attributes: ['address', 'username'],
                where: {
                    address: community.requestByAddress,
                },
            });
            return [
                {
                    address: user!.address,
                    username: user!.username,
                    isDeleted: false,
                    state: 0,
                    added: 0,
                    removed: 0,
                    since: 0,
                },
            ];
        } else {
            // contract address is only null while pending
            let managers = await getCommunityManagers(
                community.contractAddress!
            );
            managers = managers.map((m) => ({
                ...m,
                address: utils.getAddress(m.address),
            }));
            if (active !== undefined) {
                managers = managers.filter((m) => m.state === (active ? 0 : 1));
            }

            const result = await models.appUser.findAll({
                attributes: ['address', 'username'],
                where: {
                    address: { [Op.in]: managers.map((m) => m.address) },
                },
            });

            const users = result
                .map((u) => u.toJSON() as AppUser)
                .reduce((r, e) => {
                    r[e.address] = e;
                    return r;
                }, {});

            return managers.map((m) => ({
                ...m,
                ...users[m.address],
                isDeleted: !users[m.address],
            }));
        }
    }

    public async listBeneficiaries(
        managerAddress: string,
        offset: number,
        limit: number,
        filter: BeneficiaryFilterType,
        searchInput?: string
    ): Promise<{
        count: number;
        rows: IListBeneficiary[];
    }> {
        let required: boolean = false;
        const roles = await getUserRoles(managerAddress);
        if (!roles.manager) {
            throw new BaseError('MANAGER_NOT_FOUND', 'Manager not found');
        }
        const contractAddress = ethers.utils.getAddress(
            roles.manager.community
        );
        const community = await models.community.findOne({
            attributes: ['id'],
            where: {
                contractAddress,
            },
        });

        if (!community) {
            throw new BaseError('COMMUNITY_NOT_FOUND', 'Community not found');
        }

        let whereBeneficiary = this._getBeneficiaryFilter(filter);

        if (searchInput) {
            if (isAddress(searchInput)) {
                whereBeneficiary = {
                    ...whereBeneficiary,
                    '$"user"."address"$': ethers.utils.getAddress(searchInput),
                };
                required = false;
            } else if (
                searchInput.toLowerCase().indexOf('drop') === -1 &&
                searchInput.toLowerCase().indexOf('delete') === -1 &&
                searchInput.toLowerCase().indexOf('update') === -1
            ) {
                whereBeneficiary = {
                    ...whereBeneficiary,
                    '$"user"."username"$': {
                        [Op.iLike]: `%${searchInput.slice(0, 16)}%`,
                    },
                };
                required = true;
            } else {
                throw new BaseError('INVALID_SEARCH', 'Not valid search!');
            }
        }

        let beneficiariesSubgraph: BeneficiarySubgraph[] | null = null;

        if (filter.inactivity !== undefined) {
            const communityState = await getCommunityState(contractAddress);

            const seconds =
                communityState.baseInterval * config.claimInactivityThreshold;
            const timestamp = ((new Date().getTime() / 1000) | 0) - seconds;
            const lastClaimAt = filter.inactivity
                ? `lastClaimAt_lt: ${timestamp}`
                : `lastClaimAt_gte: ${timestamp}`;

            beneficiariesSubgraph = await getBeneficiaries(
                contractAddress,
                limit,
                offset,
                lastClaimAt
            );
            const addresses = beneficiariesSubgraph.map((beneficiary) =>
                ethers.utils.getAddress(beneficiary.address)
            );
            whereBeneficiary = {
                ...whereBeneficiary,
                '$"user"."address"$': {
                    [Op.in]: addresses,
                },
            };
        } else if (filter.state !== undefined) {
            const state = filter.state === 'active' ? 0 : 1;
            beneficiariesSubgraph = await getBeneficiaries(
                contractAddress,
                limit,
                offset,
                undefined,
                `state: ${state}`
            );
            const addresses = beneficiariesSubgraph.map((beneficiary) =>
                ethers.utils.getAddress(beneficiary.address)
            );
            whereBeneficiary = {
                ...whereBeneficiary,
                '$"user"."address"$': {
                    [Op.in]: addresses,
                },
            };
        }

        const count = await countBeneficiaries(
            contractAddress,
            filter.state ? filter.state : 'all'
        );
        const beneficiaries = await models.beneficiary.findAll({
            include: [
                {
                    attributes: ['username', 'suspect'],
                    model: models.appUser,
                    as: 'user',
                    required,
                },
            ],
            where: {
                communityId: community.id,
                ...whereBeneficiary,
            },
            limit,
            offset,
        });

        if (!beneficiariesSubgraph) {
            beneficiariesSubgraph = await getBeneficiariesByAddress(
                beneficiaries.map((user) => user.address)
            );
        }

        const result: IListBeneficiary[] = beneficiariesSubgraph.reduce(
            (acc, el) => {
                const beneficiary = beneficiaries
                    .find(
                        (user) =>
                            user.address === ethers.utils.getAddress(el.address)
                    )
                    ?.toJSON() as BeneficiaryAttributes;
                if (beneficiary) {
                    acc.push({
                        address: el.address,
                        username: beneficiary.user?.username,
                        timestamp: el.since,
                        claimed: el.claimed,
                        blocked: el.state === 2,
                        suspect: beneficiary.user?.suspect,
                        isDeleted:
                            !beneficiary.user || !!beneficiary?.user!.deletedAt,
                        state:
                            el.state === 0
                                ? 'active'
                                : el.state === 1
                                ? 'removed'
                                : 'locked',
                    } as IListBeneficiary);
                }
                return acc;
            },
            [] as IListBeneficiary[]
        );

        return {
            count,
            rows: result,
        };
    }

    public _getBeneficiaryFilter(filter: BeneficiaryFilterType) {
        let where = {};

        if (filter.suspect !== undefined) {
            where = {
                ...where,
                '$"user"."suspect"$': filter.suspect,
            };
        }

        if (filter.unidentified !== undefined) {
            filter.unidentified
                ? (where = {
                      ...where,
                      '$"user"."username"$': null,
                  })
                : (where = {
                      ...where,
                      '$"user"."username"$': {
                          [Op.ne]: null,
                      },
                  });
        }

        if (filter.loginInactivity !== undefined) {
            const date = new Date();
            date.setDate(date.getDate() - config.loginInactivityThreshold);

            filter.loginInactivity
                ? (where = {
                      ...where,
                      '$"user"."lastLogin"$': {
                          [Op.lt]: date,
                      },
                  })
                : (where = {
                      ...where,
                      '$"user"."lastLogin"$': {
                          [Op.gte]: date,
                      },
                  });
        }

        return where;
    }

    public async findById(
        id: number,
        userAddress?: string
    ): Promise<CommunityAttributes> {
        return this._findCommunityBy({ id }, userAddress);
    }

    public async findByContractAddress(
        contractAddress: string,
        userAddress?: string
    ): Promise<CommunityAttributes> {
        return this._findCommunityBy({ contractAddress }, userAddress);
    }

    private async _findCommunityBy(
        where: WhereOptions<CommunityAttributes>,
        userAddress?: string
    ): Promise<CommunityAttributes> {
        const community = await models.community.findOne({
            where,
        });
        if (community === null) {
            throw new BaseError(
                'COMMUNITY_NOT_FOUND',
                'Not found community ' + where
            );
        }

        let showEmail = false;
        if (userAddress) {
            // verify if user is the community creator, ambassador or manager
            if (
                (community.status === 'pending' &&
                    community.requestByAddress === userAddress) ||
                community.ambassadorAddress === userAddress
            ) {
                showEmail = true;
            } else {
                const userRole = await getUserRoles(userAddress);
                if (userRole.manager) {
                    showEmail =
                        ethers.utils.getAddress(userRole.manager.community) ===
                        community.contractAddress;
                }
            }
        }

        const state = (await this.getState(community.id)) as any;

        return {
            ...community.toJSON(),
            state,
            email: showEmail ? community.email : '',
        };
    }
}
