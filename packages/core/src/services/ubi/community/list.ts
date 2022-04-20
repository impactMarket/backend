import { ethers } from 'ethers';
import parsePhoneNumber from 'libphonenumber-js';
import { Op, literal, OrderItem, WhereOptions, Includeable } from 'sequelize';
import { Literal } from 'sequelize/types/lib/utils';

import config from '../../../config';
import { models } from '../../../database';
import { Community } from '../../../database/models/ubi/community';
import { CommunityAttributes } from '../../../interfaces/ubi/community';
import { UbiCommunityLabel } from '../../../interfaces/ubi/ubiCommunityLabel';
import {
    getCommunityProposal,
    communityEntities,
} from '../../../subgraph/queries/community';
import { BaseError } from '../../../utils/baseError';
import { fetchData } from '../../../utils/dataFetching';
import { CommunityDetailsService } from './details';

export class CommunityListService {
    communityDetailsService = new CommunityDetailsService();

    public async list(query: {
        orderBy?: string;
        filter?: string;
        name?: string;
        country?: string;
        extended?: string;
        offset?: string;
        limit?: string;
        lat?: string;
        lng?: string;
        fields?: string;
        status?: 'valid' | 'pending';
        review?: 'pending' | 'claimed' | 'declined' | 'accepted' | 'accepted';
        ambassadorAddress?: string;
    }): Promise<{ count: number; rows: CommunityAttributes[] }> {
        let extendedWhere: WhereOptions<CommunityAttributes> = {};
        const orderOption: OrderItem[] = [];
        const orderOutOfFunds = {
            active: false,
            orderType: '',
        };
        const orderBeneficiary = {
            active: false,
            orderType: '',
        };

        let beneficiariesState:
            | [
                  {
                      id: string;
                      beneficiaries: string;
                  }
              ]
            | undefined = undefined;

        let communitiesId: (number | undefined)[];
        let contractAddress: string[] = [];

        if (query.filter === 'featured') {
            const featuredIds = (
                await models.ubiCommunityLabels.findAll({
                    attributes: ['communityId'],
                    where: { label: 'featured' },
                })
            ).map((c) => (c.toJSON() as UbiCommunityLabel).communityId);
            extendedWhere = {
                ...extendedWhere,
                id: { [Op.in]: featuredIds },
            };
        }

        if (query.name) {
            extendedWhere = {
                ...extendedWhere,
                name: {
                    [Op.iLike]: `%${query.name}%`,
                },
            };
        }

        if (query.country) {
            extendedWhere = {
                ...extendedWhere,
                country: {
                    [Op.in]: query.country.split(';'),
                },
            };
        }

        if (query.review) {
            extendedWhere = {
                ...extendedWhere,
                review: query.review,
            };
            query.status = 'pending';
        }

        if (query.status === 'pending') {
            const communityProposals = await this._getOpenProposals();
            if (query.ambassadorAddress) {
                const ambassador = (await models.appUser.findOne({
                    attributes: [],
                    include: [
                        {
                            model: models.appUserTrust,
                            as: 'trust',
                            attributes: ['phone'],
                        },
                    ],
                    where: {
                        address: query.ambassadorAddress,
                    },
                })) as any;
                const phone = ambassador?.trust[0]?.phone;
                if (phone) {
                    const parsePhone = parsePhoneNumber(phone);
                    extendedWhere = {
                        ...extendedWhere,
                        country: parsePhone?.country,
                    };
                } else {
                    throw new BaseError(
                        'AMBASSADOR_NOT_FOUND',
                        'Ambassador not found'
                    );
                }
            }
            extendedWhere = {
                ...extendedWhere,
                requestByAddress: {
                    [Op.notIn]: communityProposals,
                },
            };
        } else {
            if (query.ambassadorAddress) {
                extendedWhere = {
                    ...extendedWhere,
                    ambassadorAddress: query.ambassadorAddress,
                };
            }
        }

        if (query.orderBy) {
            const orders = query.orderBy.split(';');

            for (let i = 0; i < orders.length; i++) {
                const [order, orderType] = orders[i].split(':');

                switch (order) {
                    case 'nearest': {
                        if (
                            query.lat === undefined ||
                            query.lng === undefined
                        ) {
                            throw new BaseError(
                                'INVALID_COORDINATES',
                                'invalid coordinates'
                            );
                        }
                        const lat = parseInt(query.lat, 10);
                        const lng = parseInt(query.lng, 10);
                        if (
                            typeof lat !== 'number' ||
                            typeof lng !== 'number'
                        ) {
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
                            orderType ? orderType : 'ASC',
                        ]);
                        break;
                    }
                    case 'out_of_funds': {
                        // this requires extended
                        // query.extended = 'true';
                        // // check if there was another order previously
                        // if (
                        //     orderOption.length === 0 &&
                        //     !orderBeneficiary.active
                        // ) {
                        //     const result = await this._getOutOfFunds(
                        //         {
                        //             limit: query.limit,
                        //             offset: query.offset,
                        //         },
                        //         orderType
                        //     );
                        //     // communitiesId = result.map((el) => el.id);
                        // } else {
                        //     // list communities out of funds after
                        //     orderOutOfFunds.active = true;
                        //     orderOutOfFunds.orderType = orderType;
                        // }
                        break;
                    }
                    case 'newest':
                        orderOption.push([
                            literal('"Community".started'),
                            orderType ? orderType : 'DESC',
                        ]);
                        break;
                    default: {
                        // check if there was another order previously
                        if (
                            orderOption.length === 0 &&
                            !orderOutOfFunds.active
                        ) {
                            beneficiariesState =
                                await this._getBeneficiaryState(
                                    {
                                        status: query.status,
                                        limit: query.limit,
                                        offset: query.offset,
                                    },
                                    extendedWhere,
                                    orderType
                                );
                            contractAddress = beneficiariesState!.map((el) =>
                                ethers.utils.getAddress(el.id)
                            );
                        } else {
                            // list communities beneficiaries after
                            orderBeneficiary.active = true;
                            orderBeneficiary.orderType = orderType;
                        }
                        break;
                    }
                }
            }
        } else {
            // if searching by pending or did not pass the "state" on fields, do not search on the graph
            if (query.status !== 'pending' && (!query.fields || query.fields.indexOf('state') !== -1)) {
                beneficiariesState = await this._getBeneficiaryState(
                    {
                        status: query.status,
                        limit: query.limit,
                        offset: query.offset,
                    },
                    extendedWhere
                );
                contractAddress = beneficiariesState!.map((el) =>
                    ethers.utils.getAddress(el.id)
                );
            }
        }

        let include: Includeable[];
        let attributes: any;
        let returnState = true;
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

            if (!fields.state) returnState = false;
            include = this._generateInclude(fields);
            attributes = fields.root
                ? fields.root.length > 0
                    ? fields.root.filter((el: string) => !exclude.includes(el))
                    : { exclude }
                : [];
        } else {
            include = this._oldInclude(query.extended);
            attributes = {
                exclude,
            };
        }

        const communityCount = await models.community.count({
            where: {
                status: query.status ? query.status : 'valid',
                visibility: 'public',
                ...extendedWhere,
            },
        });

        let communitiesResult: Community[];

        if (contractAddress.length > 0) {
            communitiesResult = await models.community.findAll({
                attributes,
                order: orderOption,
                where: {
                    contractAddress: {
                        [Op.in]: contractAddress,
                    },
                },
                include,
            });
            // re-order
            if (orderOption.length > 0) {
                communitiesId = communitiesResult!.map((el) => el.id);
            } else {
                communitiesId = contractAddress.map((address) => {
                    const community = communitiesResult.find(
                        (community) => community.contractAddress === address
                    );
                    return community?.id;
                });
            }
        } else {
            communitiesResult = await models.community.findAll({
                attributes,
                include,
                order: orderOption,
                where: {
                    status: query.status ? query.status : 'valid',
                    visibility: 'public',
                    ...extendedWhere,
                },
                offset: query.offset
                    ? parseInt(query.offset, 10)
                    : config.defaultOffset,
                limit: query.limit
                    ? parseInt(query.limit, 10)
                    : config.defaultLimit,
            });
            communitiesId = communitiesResult!.map((el) => el.id);
            contractAddress = communitiesResult!.map(
                (el) => el.contractAddress!
            );
        }

        if (orderBeneficiary.active) {
            beneficiariesState = await this._getBeneficiaryState(
                {
                    status: query.status,
                    limit: query.limit,
                    offset: query.offset,
                },
                {},
                undefined,
                contractAddress
            );
            contractAddress = beneficiariesState!.map((el) =>
                ethers.utils.getAddress(el.id)
            );

            // re-order IDs
            communitiesId = contractAddress.map((el) => {
                const community = communitiesResult.find(
                    (community) => community.contractAddress === el
                );
                return community?.id;
            });
        }

        // if (orderOutOfFunds.active) {
        //     const result = await this._getOutOfFunds(
        //         {
        //             limit: query.limit,
        //             offset: query.offset,
        //         },
        //         orderOutOfFunds.orderType,
        //         communitiesId
        //     );
        //     // re-order by out of funds
        //     communitiesId = result.map((el) => el.id);
        // }

        // remove empty elements
        communitiesId = communitiesId.filter(Number);

        let states: ({
            communityId: number;
            claims: number;
            claimed: string;
            beneficiaries: number;
            removedBeneficiaries: number;
            contributed: string;
            contributors: number;
            managers: number;
        } | null)[];
        if (returnState) {
            const promises = communitiesId.map((id) =>
                this.communityDetailsService.getState(id!)
            );
            states = await Promise.all(promises);
        }

        //formate response
        const communities: CommunityAttributes[] = [];
        communitiesId.forEach(async (id) => {
            let community: any;
            const filteredCommunity = communitiesResult.find(
                (el) => el.id === id
            );
            community = {
                ...(filteredCommunity?.toJSON() as CommunityAttributes),
            };

            if (returnState) {
                const state = states.find(
                    (el) => el?.communityId === community.id!
                );

                community = {
                    ...community,
                    state,
                };
            }
            communities.push(community);
        });

        return {
            count: communityCount,
            rows: communities,
        };
    }

    private async _getOpenProposals(): Promise<string[]> {
        const proposals = await getCommunityProposal();
        const requestByAddress = proposals.map((element) => {
            const calldata = ethers.utils.defaultAbiCoder.decode(
                [
                    'address[]',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                    'uint256',
                ],
                element
            );
            return calldata[0][0];
        });

        return requestByAddress;
    }

    private async _getBeneficiaryState(
        query: {
            status?: string;
            limit?: string;
            offset?: string;
        },
        extendedWhere: WhereOptions<CommunityAttributes>,
        orderType?: string,
        communities?: string[]
    ): Promise<any> {
        let contractAddress: string[] = [];
        if (Object.keys(extendedWhere).length > 0) {
            const communities = await models.community.findAll({
                attributes: ['contractAddress'],
                where: {
                    status: query.status ? query.status : 'valid',
                    visibility: 'public',
                    ...extendedWhere,
                },
            });
            contractAddress = communities.map(
                (community) => community.contractAddress!
            );
            if (!contractAddress || !contractAddress.length) {
                return [];
            }
        } else if (communities && communities.length > 0) {
            contractAddress = communities;
        }

        let result: any[] = [];

        if (contractAddress.length > 0) {
            result = await communityEntities(
                `orderBy: beneficiaries,
                        orderDirection: ${
                            orderType ? orderType.toLocaleLowerCase() : 'desc'
                        },
                        first: ${
                            query.limit
                                ? parseInt(query.limit, 10)
                                : config.defaultLimit
                        },
                        skip: ${
                            query.offset
                                ? parseInt(query.offset, 10)
                                : config.defaultOffset
                        },
                        where: { id_in: [${contractAddress.map(
                            (el) => `"${el.toLocaleLowerCase()}"`
                        )}]}`,
                `id, beneficiaries`
            );
        } else {
            result = await communityEntities(
                `orderBy: beneficiaries,
                    orderDirection: ${
                        orderType ? orderType.toLocaleLowerCase() : 'desc'
                    },
                    first: ${
                        query.limit
                            ? parseInt(query.limit, 10)
                            : config.defaultLimit
                    },
                    skip: ${
                        query.offset
                            ? parseInt(query.offset, 10)
                            : config.defaultOffset
                    },`,
                `id, beneficiaries`
            );
        }

        return result;
    }

    // private async _getOutOfFunds(
    //     query: {
    //         limit?: string;
    //         offset?: string;
    //     },
    //     orderType?: string,
    //     communitiesId?: number[]
    // ): Promise<any> {

    // }

    private _generateInclude(fields: any): Includeable[] {
        const extendedInclude: Includeable[] = [];

        if (fields.suspect) {
            extendedInclude.push({
                model: models.ubiCommunitySuspect,
                attributes:
                    fields.suspect.length > 0 ? fields.suspect : undefined,
                as: 'suspect',
                required: false,
                duplicating: false,
                where: {
                    createdAt: {
                        [Op.eq]: literal(
                            '(select max("createdAt") from ubi_community_suspect ucs where ucs."communityId"="Community".id and date("createdAt") > (current_date - INTERVAL \'1 day\'))'
                        ),
                    } as { [Op.eq]: Literal },
                },
            });
        }

        if (fields.cover) {
            extendedInclude.push({
                attributes: ['id', 'url'],
                model: models.appMediaContent,
                as: 'cover',
                duplicating: false,
                include: [
                    {
                        attributes: ['url', 'width', 'height', 'pixelRatio'],
                        model: models.appMediaThumbnail,
                        as: 'thumbnails',
                        separate: true,
                    },
                ],
            });
        }

        if (fields.proposal) {
            extendedInclude.push({
                // all attributes
                model: models.appProposal,
                as: 'proposal',
            });
        }

        if (fields.contract) {
            extendedInclude.push({
                attributes:
                    fields.contract.length > 0 ? fields.contract : undefined,
                model: models.ubiCommunityContract,
                as: 'contract',
            });
        }

        if (fields.metrics) {
            const metricsAttributes = fields.metrics
                ? fields.metrics.length > 0
                    ? fields.metrics
                    : undefined
                : [];

            extendedInclude.push({
                attributes: metricsAttributes,
                model: models.ubiCommunityDailyMetrics,
                required: false,
                duplicating: false,
                as: 'metrics',
                where: {
                    date: {
                        [Op.eq]: literal(
                            '(select date from ubi_community_daily_metrics order by date desc limit 1)'
                        ),
                    } as { [Op.eq]: Literal },
                },
            });
        }

        if (fields.ambassador) {
            extendedInclude.push({
                attributes:
                    fields.ambassador.length > 0
                        ? fields.ambassador
                        : undefined,
                model: models.appUser,
                as: 'ambassador',
            });
        }

        return extendedInclude;
    }

    private _oldInclude(extended?: string): Includeable[] {
        const extendedInclude: Includeable[] = [];
        const yesterdayDateOnly = new Date();
        yesterdayDateOnly.setUTCHours(0, 0, 0, 0);
        yesterdayDateOnly.setDate(yesterdayDateOnly.getDate() - 1);
        const yesterdayDate = yesterdayDateOnly.toISOString().split('T')[0];

        // TODO: deprecated in mobile@1.1.6
        if (extended) {
            extendedInclude.push(
                {
                    model: models.ubiCommunityContract,
                    as: 'contract',
                },
                {
                    model: models.ubiCommunityDailyMetrics,
                    required: false,
                    duplicating: false,
                    as: 'metrics',
                    where: {
                        date: {
                            [Op.eq]: literal(
                                '(select date from ubi_community_daily_metrics order by date desc limit 1)'
                            ),
                        } as { [Op.eq]: Literal },
                    },
                }
            );
        }

        return [
            {
                model: models.ubiCommunitySuspect,
                attributes: ['suspect'],
                as: 'suspect',
                required: false,
                duplicating: false,
                where: {
                    createdAt: {
                        [Op.eq]: literal(
                            '(select max("createdAt") from ubi_community_suspect ucs where ucs."communityId"="Community".id and date("createdAt") > (current_date - INTERVAL \'1 day\'))'
                        ),
                    },
                },
            },
            {
                model: models.appMediaContent,
                as: 'cover',
                duplicating: false,
                include: [
                    {
                        model: models.appMediaThumbnail,
                        as: 'thumbnails',
                        separate: true,
                    },
                ],
            },
            {
                attributes: { exclude: ['id', 'communityId'] },
                model: models.ubiCommunityDailyState,
                as: 'dailyState',
                duplicating: false,
                where: {
                    date: yesterdayDate,
                },
                required: false,
            },
            ...extendedInclude,
        ] as Includeable[];
    }
}
