import { utils, ethers } from 'ethers';
import { BigNumber } from 'bignumber.js';

import { models } from '../../../database';
import { AppUser } from '../../../interfaces/app/appUser';
import { getCommunityManagers, getCommunityState } from '../../../subgraph/queries/community';
import {
    IListBeneficiary,
    BeneficiaryFilterType,
} from '../../endpoints';
import { Op } from 'sequelize';
import { BeneficiaryAttributes } from '../../../interfaces/ubi/beneficiary';
import { isAddress } from '../../../utils/util';
import { BaseError } from '../../../utils/baseError';
import config from '../../../config';
import { getUserRoles } from '../../../subgraph/queries/user';
import { getBeneficiariesByAddress, getBeneficiariesByClaimInactivity } from '../../../subgraph/queries/beneficiary';
import { BeneficiarySubgraph } from '../../../subgraph/interfaces/beneficiary';

export class CommunityDetailsService {
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
        searchInput?: string,
    ): Promise<{
        count: number,
        rows: IListBeneficiary[],
    }> {
        let required: boolean = false;
        const roles = await getUserRoles(managerAddress);
        if (!roles.manager) {
            throw new BaseError(
                'MANAGER_NOT_FOUND',
                "Manager not found"
            );
        }
        const contractAddress = ethers.utils.getAddress(roles.manager.community);
        const community = await models.community.findOne({
            attributes: ['id'],
            where: {
                contractAddress,
            },
        });

        if (!community) {
            throw new BaseError(
                'COMMUNITY_NOT_FOUND',
                "Community not found"
            );
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
                    '$"user"."username"$': { [Op.iLike]: `%${searchInput.slice(0, 16)}%` },
                };
                required = true;
            } else {
                throw new BaseError('INVALID_SEARCH', 'Not valid search!');
            }
        }

        let beneficiariesSubgraph: BeneficiarySubgraph[] | null = null;

        if (filter.inactivity) {
            const communityState = await getCommunityState(contractAddress);

            const seconds = communityState.baseInterval *
                config.claimInactivityThreshold;
            const lastClaimAt = (new Date().getTime() / 1000 | 0) - seconds;

            beneficiariesSubgraph = await getBeneficiariesByClaimInactivity(lastClaimAt, contractAddress, limit, offset);
            const addresses = beneficiariesSubgraph.map(beneficiary => ethers.utils.getAddress(beneficiary.address))
            whereBeneficiary = {
                ...whereBeneficiary,
                '$"user"."address"$': {
                    [Op.in]: addresses
                }
            }
        }

        const beneficiaries: {
            count: number;
            rows: BeneficiaryAttributes[]
        } = await models.beneficiary.findAndCountAll({
            include: [{
                attributes: ['username', 'suspect'],
                model: models.appUser,
                as: 'user',
                required,
            }],
            where: {
                communityId: community.id,
                ...whereBeneficiary
            },
            limit,
            offset,
        });

        if (!beneficiariesSubgraph) {
            beneficiariesSubgraph = await getBeneficiariesByAddress(beneficiaries.rows.map(user => user.address ));
        }

        const result: IListBeneficiary[] = beneficiariesSubgraph.reduce((acc, el) => {
            const beneficiary = beneficiaries.rows.find(user => user.address === ethers.utils.getAddress(el.address));

            if(beneficiary) {
                acc.push({
                    address: el.address,
                    username: beneficiary.user?.username,
                    timestamp: el.since,
                    claimed: new BigNumber(el.claimed)
                                .multipliedBy(10 ** 18)
                                .toString(),
                    blocked: false,
                    suspect: beneficiary.user?.suspect,
                    isDeleted: !beneficiary.user || !!beneficiary?.user!.deletedAt,
                } as IListBeneficiary);
            }
            return acc;
        }, [] as IListBeneficiary[]);

        return {
            count: beneficiaries.count,
            rows: result,
        };
    }

    public _getBeneficiaryFilter(filter: BeneficiaryFilterType) {
        let where = {};

        // if (filter.active !== undefined) {
        //     where = {
        //         ...where,
        //         active: filter.active,
        //     };
        // }

        if (filter.suspect !== undefined) {
            where = {
                ...where,
                '$"user"."suspect"$': filter.suspect,
            };
        }

        if (filter.unidentified !== undefined) {
            filter.unidentified 
                ? where = {
                    ...where,
                    '$"user"."username"$': null,
                }
                : where = {
                    ...where,
                    '$"user"."username"$': {
                        [Op.ne]: null
                    },
                }
        }

        // if (filter.blocked) {
        //     where = {
        //         ...where,
        //         blocked: filter.blocked,
        //     };
        // }

        if (filter.loginInactivity !== undefined) {
            const date = new Date();
            date.setDate(date.getDate() - config.loginInactivityThreshold);

            filter.loginInactivity
                ? where = {
                    ...where,
                    '$"user"."lastLogin"$': {
                        [Op.lt]: date,
                    },
                }
                : where = {
                    ...where,
                    '$"user"."lastLogin"$': {
                        [Op.gte]: date,
                    },
                }
        }

        return where;
    }
}