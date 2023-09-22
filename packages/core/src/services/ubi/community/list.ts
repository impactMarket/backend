import { Includeable, Op, OrderItem, WhereOptions, literal } from 'sequelize';
import { Literal } from 'sequelize/types/utils';
import { ethers } from 'ethers';

import { BaseError } from '../../../utils/baseError';
import { CommunityAttributes } from '../../../interfaces/ubi/community';
import { CommunityDetailsService } from './details';
import { UbiCommunityLabel } from '../../../interfaces/ubi/ubiCommunityLabel';
import { fetchData } from '../../../utils/dataFetching';
import { getAmbassadorByAddress, getCommunityProposal } from '../../../subgraph/queries/community';
import { getSearchInput } from '../../../utils/util';
import { models } from '../../../database';
import config from '../../../config';

export class CommunityListService {
    communityDetailsService = new CommunityDetailsService();

    public async list(query: {
        orderBy?: string;
        filter?: string;
        search?: string;
        country?: string;
        excludeCountry?: string;
        extended?: string;
        offset?: string;
        limit?: string;
        lat?: string;
        lng?: string;
        fields?: string;
        status?: 'valid' | 'pending';
        review?: 'pending' | 'claimed' | 'declined' | 'accepted' | 'accepted';
        ambassadorAddress?: string;
        state?: string | string[];
    }): Promise<{ count: number; rows: CommunityAttributes[] }> {
        let extendedWhere: WhereOptions<CommunityAttributes> = {};
        const orderOption: OrderItem[] = [];

        if (query.filter === 'featured') {
            const featuredIds = (
                await models.ubiCommunityLabels.findAll({
                    attributes: ['communityId'],
                    where: { label: 'featured' }
                })
            ).map(c => (c.toJSON() as UbiCommunityLabel).communityId);
            extendedWhere = {
                ...extendedWhere,
                id: { [Op.in]: featuredIds }
            };
        }

        if (query.search) {
            const input = getSearchInput(query.search);
            if (input.address) {
                extendedWhere = {
                    ...extendedWhere,
                    requestByAddress: input.address
                };
            } else if (input.name) {
                extendedWhere = {
                    ...extendedWhere,
                    name: {
                        [Op.iLike]: `%${input.name}%`
                    }
                };
            }
        }

        if (query.country) {
            extendedWhere = {
                ...extendedWhere,
                country: {
                    [Op.in]: query.country.split(';')
                }
            };
        }

        if (query.excludeCountry) {
            extendedWhere = {
                ...extendedWhere,
                country: {
                    [Op.notIn]: query.excludeCountry.split(';')
                }
            };
        }

        if (query.review) {
            extendedWhere = {
                ...extendedWhere,
                review: query.review
            };
            query.status = 'pending';
        }

        if (query.status === 'pending') {
            const communityProposals = await this._getOpenProposals();

            if (extendedWhere.requestByAddress) {
                const address = extendedWhere.requestByAddress;
                if (communityProposals.indexOf(address as string) !== -1) {
                    return {
                        count: 0,
                        rows: []
                    };
                }
            } else {
                extendedWhere = {
                    ...extendedWhere,
                    requestByAddress: {
                        [Op.notIn]: communityProposals
                    }
                };
            }
        }

        if (query.ambassadorAddress) {
            if (query.status === 'pending') {
                extendedWhere = {
                    ...extendedWhere,
                    ambassadorAddress: query.ambassadorAddress
                };
            } else {
                const ambassador = await getAmbassadorByAddress(query.ambassadorAddress);
                if (!ambassador || !ambassador.communities) {
                    return {
                        count: 0,
                        rows: []
                    };
                }
                extendedWhere = {
                    ...extendedWhere,
                    contractAddress: {
                        [Op.in]: ambassador.communities.map((address: string) => ethers.utils.getAddress(address))
                    }
                };
            }
        }

        if (query.orderBy) {
            const orders = query.orderBy.split(';');

            for (let i = 0; i < orders.length; i++) {
                const [order, orderType] = orders[i].split(':');

                switch (order) {
                    case 'nearest': {
                        if (query.lat === undefined || query.lng === undefined) {
                            throw new BaseError('INVALID_COORDINATES', 'invalid coordinates');
                        }
                        const lat = parseInt(query.lat, 10);
                        const lng = parseInt(query.lng, 10);
                        if (typeof lat !== 'number' || typeof lng !== 'number') {
                            throw new BaseError('NaN', 'not a number');
                        }

                        orderOption.push([
                            literal(
                                '(6371*acos(cos(radians(' +
                                    lat +
                                    "))*cos(radians(cast(gps->>'latitude' as float)))*cos(radians(cast(gps->>'longitude' as float))-radians(" +
                                    lng +
                                    '))+sin(radians(' +
                                    lat +
                                    "))*sin(radians(cast(gps->>'latitude' as float)))))"
                            ),
                            orderType ? orderType : 'ASC'
                        ]);
                        break;
                    }
                    case 'out_of_funds': {
                        if (query.status !== 'pending') {
                            orderOption.push([literal('"state"."estimatedFunds"'), orderType ? orderType : 'ASC']);
                        }
                        break;
                    }
                    case 'newest':
                        orderOption.push([literal('"community"."createdAt"'), orderType ? orderType : 'DESC']);
                        break;
                    case 'updated':
                        orderOption.push([literal('"community"."updatedAt"'), orderType ? orderType : 'DESC']);
                        break;
                    default: {
                        if (query.status !== 'pending') {
                            orderOption.push([literal('"state"."beneficiaries"'), orderType ? orderType : 'DESC']);
                        }
                        break;
                    }
                }
            }
        } else if (query.status !== 'pending' && (!query.fields || query.fields.indexOf('state') !== -1)) {
            orderOption.push([literal('"state"."beneficiaries"'), 'DESC']);
        }

        let include: Includeable[];
        let attributes: any;
        const exclude = ['email'];

        if (query.fields) {
            const fields = fetchData(query.fields!);
            // include id and contractAddress
            if (fields.root.length > 0) {
                if (fields.root.indexOf('id') === -1) {
                    fields.root.push('id');
                }
                if (fields.root.indexOf('contractAddress') === -1) {
                    fields.root.push('contractAddress');
                }
            }

            include = this._generateInclude(fields);
            attributes = fields.root
                ? fields.root.length > 0
                    ? fields.root.filter((el: string) => !exclude.includes(el))
                    : { exclude }
                : [];
        } else {
            attributes = { exclude };

            include = [
                {
                    model: models.subgraphCommunity,
                    as: 'state'
                },
                {
                    attributes: ['ubiRate', 'estimatedDuration'],
                    model: models.ubiCommunityDailyMetrics,
                    as: 'metrics',
                    order: [['date', 'desc']],
                    limit: 1
                }
            ];
        }

        const communityCount = await models.community.count({
            where: {
                status: query.status ? query.status : 'valid',
                visibility: 'public',
                ...extendedWhere
            }
        });

        const communitiesResult = await models.community.findAll({
            attributes,
            include,
            order: orderOption,
            where: {
                status: query.status ? query.status : 'valid',
                visibility: 'public',
                ...extendedWhere
            },
            offset: query.offset ? parseInt(query.offset, 10) : config.defaultOffset,
            limit: query.limit ? parseInt(query.limit, 10) : config.defaultLimit
        });

        return {
            count: communityCount,
            rows: communitiesResult.map(el => {
                const community = el.toJSON();

                if (community.metrics) {
                    community.state = {
                        ...community.state!,
                        ...community.metrics[0]
                    };
                }

                delete community.metrics;

                return community;
            })
        };
    }

    private async _getOpenProposals(): Promise<string[]> {
        const proposals = await getCommunityProposal();
        const requestByAddress: string[] = [];
        proposals.forEach(element => {
            try {
                const calldata = ethers.utils.defaultAbiCoder.decode(
                    [
                        'address[]',
                        'address',
                        'uint256',
                        'uint256',
                        'uint256',
                        'uint256',
                        'uint256',
                        'uint256',
                        'uint256',
                        'uint256'
                    ],
                    element
                );
                requestByAddress.push(ethers.utils.getAddress(calldata[0][0]));
            } catch (_error) {}
        });

        return requestByAddress;
    }

    private _generateInclude(fields: any): Includeable[] {
        const extendedInclude: Includeable[] = [];

        if (fields.suspect) {
            extendedInclude.push({
                model: models.ubiCommunitySuspect,
                attributes: fields.suspect.length > 0 ? fields.suspect : undefined,
                as: 'suspect',
                required: false,
                duplicating: false,
                where: {
                    createdAt: {
                        [Op.eq]: literal(
                            '(select max("createdAt") from ubi_community_suspect ucs where ucs."communityId"="community".id and date("createdAt") > (current_date - INTERVAL \'1 day\'))'
                        )
                    } as { [Op.eq]: Literal }
                }
            });
        }

        if (fields.proposal) {
            extendedInclude.push({
                // all attributes
                model: models.appProposal,
                as: 'proposal'
            });
        }

        if (fields.contract) {
            extendedInclude.push({
                attributes: fields.contract.length > 0 ? fields.contract : undefined,
                model: models.ubiCommunityContract,
                as: 'contract'
            });
        }

        if (fields.metrics) {
            const metricsAttributes = fields.metrics ? (fields.metrics.length > 0 ? fields.metrics : undefined) : [];

            extendedInclude.push({
                attributes: metricsAttributes,
                model: models.ubiCommunityDailyMetrics,
                required: false,
                duplicating: false,
                as: 'metrics',
                where: {
                    date: {
                        [Op.eq]: literal('(select date from ubi_community_daily_metrics order by date desc limit 1)')
                    } as { [Op.eq]: Literal }
                }
            });
        }

        if (fields.ambassador) {
            extendedInclude.push({
                attributes: fields.ambassador.length > 0 ? fields.ambassador : undefined,
                model: models.appUser,
                as: 'ambassador'
            });
        }

        if (fields.state) {
            extendedInclude.push({
                attributes: fields.state.length > 0 ? fields.state : undefined,
                model: models.subgraphCommunity,
                as: 'state'
            });
        }

        if (fields.metrics) {
            extendedInclude.push({
                attributes: fields.metrics.length > 0 ? fields.metrics : undefined,
                model: models.ubiCommunityDailyMetrics,
                as: 'metrics',
                order: [['date', 'desc']],
                limit: 1
            });
        }

        return extendedInclude;
    }
}
