import { UbiRequestChangeParams } from '@interfaces/ubi/requestChangeParams';
import { UbiCommunityContract } from '@interfaces/ubi/ubiCommunityContract';
import { UbiCommunityDailyMetrics } from '@interfaces/ubi/ubiCommunityDailyMetrics';
import { UbiCommunityState } from '@interfaces/ubi/ubiCommunityState';
import { UbiOrganization } from '@interfaces/ubi/ubiOrganization';
import {
    Community,
    CommunityAttributes,
    CommunityCreationAttributes,
} from '@models/ubi/community';
import { ManagerAttributes } from '@models/ubi/manager';
import { notifyManagerAdded } from '@utils/util';
import { ethers } from 'ethers';
import {
    Op,
    QueryTypes,
    fn,
    col,
    literal,
    OrderItem,
    WhereOptions,
    Includeable,
} from 'sequelize';
import { Literal } from 'sequelize/types/lib/utils';

import config from '../../config';
import CommunityContractABI from '../../contracts/CommunityABI.json';
import ImpactMarketContractABI from '../../contracts/ImpactMarketABI.json';
import { models, sequelize } from '../../database';
import { ICommunityContractParams } from '../../types';
import {
    ICommunity,
    ICommunityLightDetails,
    ICommunityPendingDetails,
    IManagerDetailsBeneficiary,
    IManagerDetailsManager,
    IManagers,
    IManagersDetails,
} from '../../types/endpoints';
import {
    CommunityContentStorage,
    OrganizationContentStorage,
} from '../storage';
import BeneficiaryService from './beneficiary';
import CommunityContractService from './communityContract';
import CommunityDailyStateService from './communityDailyState';
import CommunityStateService from './communityState';
import ManagerService from './managers';

export default class CommunityService {
    public static community = models.community;
    public static manager = models.manager;
    public static user = models.user;
    public static ubiCommunityContract = models.ubiCommunityContract;
    public static ubiCommunityState = models.ubiCommunityState;
    public static ubiCommunityDailyMetrics = models.ubiCommunityDailyMetrics;
    public static ubiCommunityDailyState = models.ubiCommunityDailyState;
    public static ubiCommunityDemographics = models.ubiCommunityDemographics;
    public static claimLocation = models.claimLocation;
    public static ubiRequestChangeParams = models.ubiRequestChangeParams;
    public static ubiCommunitySuspect = models.ubiCommunitySuspect;
    public static ubiOrganization = models.ubiOrganization;
    public static ubiOrganizationSocialMedia =
        models.ubiOrganizationSocialMedia;
    public static ubiCommunityLabels = models.ubiCommunityLabels;
    public static appMediaContent = models.appMediaContent;
    public static appMediaThumbnail = models.appMediaThumbnail;
    public static sequelize = sequelize;

    private static communityContentStorage = new CommunityContentStorage();
    private static organizationContentStorage = new OrganizationContentStorage();

    public static async create(
        requestByAddress: string,
        name: string,
        contractAddress: string | undefined,
        description: string,
        language: string,
        currency: string,
        city: string,
        country: string,
        gps: {
            latitude: number;
            longitude: number;
        },
        email: string,
        coverMediaId: number,
        txReceipt: any | undefined,
        contractParams: ICommunityContractParams
    ): Promise<Community> {
        let managerAddress: string = '';
        const media = await this.appMediaContent.findOne({
            where: { id: coverMediaId },
        });
        let createObject: CommunityCreationAttributes = {
            requestByAddress,
            name,
            description,
            language,
            currency,
            city,
            country,
            gps,
            email,
            coverMediaId,
            coverImage: media!.url,
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
                throw new Error('Event not found!');
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
            const community = await this.community.create(createObject, {
                transaction: t,
            });
            await CommunityContractService.add(community.id, contractParams, t);
            if (createObject.visibility === 'private') {
                // in case it's public, will be added when accepted
                await CommunityStateService.add(community.id, t);
                // private communities don't need daily state
            }
            // await CommunityStateService.add
            // await CommunityDailyStateService.populateNext5Days
            if (txReceipt !== undefined) {
                await ManagerService.add(managerAddress, community.publicId, t);
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
            throw new Error(error);
        }
    }

    /**
     * @deprecated
     */
    public static async request(
        requestByAddress: string,
        name: string,
        description: string,
        language: string,
        currency: string,
        city: string,
        country: string,
        gps: {
            latitude: number;
            longitude: number;
        },
        email: string,
        coverMediaId: number,
        contractParams: ICommunityContractParams
    ): Promise<Community> {
        // TODO: improve, insert with unique transaction (see sequelize eager loading)
        const media = await this.appMediaContent.findOne({
            where: { id: coverMediaId },
        });
        const community = await this.community.create({
            requestByAddress,
            name,
            description,
            language,
            currency,
            city,
            country,
            gps,
            email,
            visibility: 'public',
            coverMediaId,
            coverImage: media!.url,
            status: 'pending',
            started: new Date(),
        });
        await CommunityContractService.add(community.id, contractParams);
        await CommunityStateService.add(community.id);
        await CommunityDailyStateService.populateNext5Days(community.id);
        return community;
    }

    public static async edit(
        id: number,
        name: string,
        description: string,
        language: string,
        currency: string,
        city: string,
        country: string,
        email: string,
        coverMediaId: number
    ): Promise<[number, Community[]]> {
        const community = await this.community.findOne({ where: { id } });
        // since cover can't be null, we first update and then remove
        const update = await this.community.update(
            {
                name,
                description,
                language,
                currency,
                city,
                country,
                email,
                coverMediaId,
            },
            { returning: true, where: { id } }
        );
        if (community!.coverMediaId !== coverMediaId) {
            // image has been replaced
            // delete previous one! new one was already uploaded, will be updated below
            await this.communityContentStorage.deleteContent(
                community!.coverMediaId
            );
        }
        return update;
    }

    public static async pending(): Promise<ICommunityPendingDetails[]> {
        // by the time of writting, sequelize
        // does not support eager loading with global "raw: false".
        // Please, check again, and if available, update this
        // https://github.com/sequelize/sequelize/issues/6408
        const sqlQuery =
            'select id, "publicId", "contractAddress", "requestByAddress", name, city, country, description, email, "coverImage", cc.*, cs.* ' +
            'from community c ' +
            'left join ubi_community_contract cc on c.id = cc."communityId" ' +
            'left join ubi_community_state cs on c.id = cs."communityId" ' +
            "where status = 'pending' and visibility = 'public' order by c.\"createdAt\" DESC";

        const rawResult: ({
            id: number;
            publicId: string;
            contractAddress: string;
            requestByAddress: string;
            name: string;
            city: string;
            country: string;
            description: string;
            email: string;
            coverImage: string;
        } & UbiCommunityState &
            UbiCommunityContract)[] = await this.sequelize.query(sqlQuery, {
            type: QueryTypes.SELECT,
        });

        const results: ICommunityPendingDetails[] = rawResult.map((c) => ({
            id: c.id,
            publicId: c.publicId,
            contractAddress: c.contractAddress,
            requestByAddress: c.requestByAddress,
            name: c.name,
            city: c.city,
            country: c.country,
            description: c.description,
            email: c.email,
            coverImage: c.coverImage,
            contract: {
                baseInterval: c.baseInterval,
                claimAmount: c.claimAmount,
                incrementInterval: c.incrementInterval,
                maxClaim: c.maxClaim,
                // values below don't matter
                communityId: c.id,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            },
            state: {
                backers: c.backers,
                beneficiaries: c.beneficiaries,
                removedBeneficiaries: c.removedBeneficiaries,
                managers: c.managers,
                claimed: c.claimed,
                claims: c.claims,
                raised: c.raised,
                // values below don't matter
                communityId: c.id,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            },
            // values below don't matter
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }));

        return results;
    }

    public static async accept(
        acceptanceTransaction: string,
        publicId: string
    ): Promise<string | null> {
        const provider = new ethers.providers.JsonRpcProvider(
            config.jsonRpcUrl
        );
        const receipt = await provider.waitForTransaction(
            acceptanceTransaction
        );
        const ifaceImpactMarket = new ethers.utils.Interface(
            ImpactMarketContractABI
        );
        if (receipt.logs === undefined) {
            return null;
        }
        const eventsImpactMarket: ethers.utils.LogDescription[] = [];
        for (let index = 0; index < receipt.logs.length; index++) {
            try {
                const parsedLog = ifaceImpactMarket.parseLog(
                    receipt.logs[index]
                );
                eventsImpactMarket.push(parsedLog);
            } catch (e) {}
        }
        const index = eventsImpactMarket.findIndex(
            (event) => event !== null && event.name === 'CommunityAdded'
        );
        if (index !== -1) {
            const communityContractAddress =
                eventsImpactMarket[index].args._communityAddress;

            const t = await this.sequelize.transaction();
            try {
                const dbUpdate: [
                    number,
                    Community[]
                ] = await this.community.update(
                    {
                        contractAddress: communityContractAddress,
                        status: 'valid',
                    },
                    { returning: true, where: { publicId }, transaction: t }
                );
                if (dbUpdate[0] === 1) {
                    notifyManagerAdded(
                        dbUpdate[1][0].requestByAddress,
                        communityContractAddress
                    );
                } else {
                    throw new Error(
                        'Did not update ' +
                            dbUpdate[1][0].id +
                            ' after acceptance!'
                    );
                }
                await CommunityStateService.add(dbUpdate[1][0].id, t);
                await CommunityDailyStateService.populateNext5Days(
                    dbUpdate[1][0].id,
                    t
                );
                // If the execution reaches this line, no errors were thrown.
                // We commit the transaction.
                await t.commit();
                return communityContractAddress;
            } catch (error) {
                // If the execution reaches this line, an error was thrown.
                // We rollback the transaction.
                await t.rollback();
                // Since this is the service, we throw the error back to the controller,
                // so the route returns an error.
                throw new Error(error);
            }
        }
        return null;
    }

    public static async pictureAdd(
        isOrganization: boolean,
        file: Express.Multer.File
    ) {
        if (isOrganization) {
            return this.organizationContentStorage.uploadContent(file);
        }
        return this.communityContentStorage.uploadContent(file);
    }

    public static async remove(publicId: string): Promise<boolean> {
        const c = await this.community.findOne({
            where: {
                publicId,
                status: 'pending',
                visibility: 'public',
            },
            raw: true,
        });
        if (c) {
            await this.community.destroy({
                where: {
                    publicId,
                },
            });
            await this.communityContentStorage.deleteContent(c.coverMediaId);
            return true;
        }
        return false;
    }

    /**
     * List all valid communities, both public and private
     */
    public static async listCommunitiesStructOnly(): Promise<Community[]> {
        return await this.community.findAll({
            where: {
                status: 'valid',
            },
            raw: true,
        });
    }

    /**
     * Count public valid communities
     */
    public static async countPublicCommunities(): Promise<number> {
        const communities = (await this.community.findAll({
            attributes: [[fn('count', col('contractAddress')), 'total']],
            where: {
                status: 'valid',
                visibility: 'public',
            },
            raw: true,
        })) as any;
        return communities[0].total;
    }

    public static async updateCoverImage(
        publicId: string,
        newPictureUrl: string
    ): Promise<boolean> {
        const result = await this.community.update(
            {
                coverImage: newPictureUrl,
            },
            { returning: true, where: { publicId } }
        );
        return result[0] > 0;
    }

    public static async list(query: {
        orderBy?: string;
        filter?: string;
        extended?: string;
        offset?: string;
        limit?: string;
        lat?: string;
        lng?: string;
    }): Promise<{ count: number; rows: CommunityAttributes[] }> {
        let orderOption: string | Literal | OrderItem[] | undefined;
        const extendedInclude: Includeable[] = [];

        switch (query.orderBy) {
            case 'nearest': {
                if (query.lat === undefined || query.lng === undefined) {
                    throw new Error('invalid coordinates');
                }
                const lat = parseInt(query.lat, 10);
                const lng = parseInt(query.lng, 10);
                if (typeof lat !== 'number' || typeof lng !== 'number') {
                    throw new Error('NaN');
                }
                orderOption = [
                    [
                        literal(
                            '(6371*acos(cos(radians(' +
                                lat +
                                "))*cos(radians(cast(gps->>'latitude' as float)))*cos(radians(cast(gps->>'longitude' as float))-radians(" +
                                lng +
                                '))+sin(radians(' +
                                lat +
                                "))*sin(radians(cast(gps->>'latitude' as float)))))"
                        ),
                        'ASC',
                    ],
                ];
                break;
            }
            default:
                orderOption = [[literal('state.beneficiaries'), 'DESC']];
                break;
        }

        if (query.filter === 'featured') {
            extendedInclude.push({
                model: this.ubiCommunityLabels,
                as: 'labels',
                where: {
                    label: 'featured',
                },
                duplicating: false,
            });
        }

        if (query.extended) {
            extendedInclude.push(
                {
                    model: this.ubiCommunityContract,
                    as: 'contract',
                },
                {
                    model: this.ubiCommunityDailyMetrics,
                    required: false,
                    separate: true,
                    as: 'metrics',
                    where: {
                        date: {
                            [Op.eq]: literal(
                                '(select date from ubi_community_daily_metrics order by date desc limit 1)'
                            ),
                        },
                    },
                }
            );
        }
        const communitiesResult = await this.community.findAndCountAll({
            where: {
                status: 'valid',
                visibility: 'public',
            },
            include: [
                {
                    model: this.ubiCommunityState,
                    as: 'state',
                },
                {
                    model: this.appMediaContent,
                    as: 'cover',
                    duplicating: false,
                    include: [
                        {
                            model: this.appMediaThumbnail,
                            as: 'thumbnails',
                            separate: true,
                        },
                    ],
                },
                ...extendedInclude,
            ],
            order: orderOption,
            offset: query.offset ? parseInt(query.offset, 10) : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
        });

        const communities = communitiesResult.rows.map((c) =>
            c.toJSON()
        ) as CommunityAttributes[];

        return {
            count: communitiesResult.count,
            rows: communities,
        };
    }

    /**
     * @deprecated
     */
    public static async listLight(
        order: string | undefined,
        query: any
    ): Promise<ICommunityLightDetails[]> {
        let offset: number | undefined;
        let limit: number | undefined;
        let useOrder = '';
        let orderOption: string | Literal | OrderItem[] | undefined;

        if (query.offset !== undefined && query.limit !== undefined) {
            const offset = parseInt(query.offset, 10);
            const limit = parseInt(query.limit, 10);
            if (typeof offset !== 'number' || typeof limit !== 'number') {
                throw new Error('NaN');
            }
        }

        if (order === undefined && query.order !== undefined) {
            useOrder = query.order;
        } else if (order !== undefined) {
            useOrder = order;
        }
        switch (useOrder) {
            case 'nearest': {
                const lat = parseInt(query.lat, 10);
                const lng = parseInt(query.lng, 10);
                if (typeof lat !== 'number' || typeof lng !== 'number') {
                    throw new Error('NaN');
                }
                orderOption = [
                    [
                        literal(
                            '(6371*acos(cos(radians(' +
                                lat +
                                "))*cos(radians(cast(gps->>'latitude' as float)))*cos(radians(cast(gps->>'longitude' as float))-radians(" +
                                lng +
                                '))+sin(radians(' +
                                lat +
                                "))*sin(radians(cast(gps->>'latitude' as float)))))"
                        ),
                        'ASC',
                    ],
                ];
                break;
            }
            default:
                orderOption = [[literal('state.beneficiaries'), 'DESC']];
                break;
        }

        const communitiesResult = await this.community.findAll({
            include: [
                {
                    model: this.ubiCommunityContract,
                    as: 'contract',
                },
                {
                    model: this.ubiCommunityState,
                    as: 'state',
                },
                {
                    model: this.appMediaContent,
                    as: 'cover',
                    include: [
                        {
                            model: this.appMediaThumbnail,
                            as: 'thumbnails',
                        },
                    ],
                },
            ],
            where: {
                status: 'valid',
                visibility: 'public',
            },
            limit,
            offset,
            order: orderOption,
        });

        const communities = communitiesResult.map((c) =>
            c.toJSON()
        ) as CommunityAttributes[];

        const results: ICommunityLightDetails[] = communities.map((c) => ({
            id: c.id,
            publicId: c.publicId,
            contractAddress: c.contractAddress!,
            name: c.name,
            city: c.city,
            country: c.country,
            coverImage: c.coverImage,
            cover: c.cover!,
            contract: c.contract!,
            state: c.state!,
        }));

        return results;
    }

    public static async fullList(
        order?: string
    ): Promise<CommunityAttributes[]> {
        let extendedWhere: WhereOptions<CommunityAttributes> = {};
        let orderOption: string | Literal | OrderItem[] | undefined;

        switch (order) {
            case 'out_of_funds': {
                extendedWhere = {
                    state: {
                        beneficiaries: {
                            [Op.not]: 0,
                        },
                    },
                };
                orderOption = [
                    [
                        literal(
                            '(state.raised - state.claimed) / metrics."ubiRate" / state.beneficiaries'
                        ),
                        'DESC',
                    ],
                ];
                break;
            }
            case 'newest':
                orderOption = [[literal('community.started'), 'DESC']];
                break;
            default:
                orderOption = [[literal('state.beneficiaries'), 'DESC']];
                break;
        }

        const communitiesResult = await this.community.findAll({
            include: [
                {
                    model: this.ubiCommunityContract,
                    as: 'contract',
                },
                {
                    model: this.ubiCommunityState,
                    as: 'state',
                },
                {
                    model: this.ubiCommunityDailyMetrics,
                    // required: false,
                    as: 'metrics',
                    where: {
                        date: {
                            [Op.eq]: literal(
                                '(select date from ubi_community_daily_metrics order by date desc limit 1)'
                            ),
                        },
                    },
                },
                {
                    model: this.appMediaContent,
                    as: 'cover',
                    include: [
                        {
                            model: this.appMediaThumbnail,
                            as: 'thumbnails',
                        },
                    ],
                },
            ],
            where: {
                status: 'valid',
                visibility: 'public',
                ...extendedWhere,
            },
            order: orderOption,
        });
        return communitiesResult.map((c) => c.toJSON() as CommunityAttributes);
    }

    /**
     * @deprecated
     */
    public static async listFull(order?: string): Promise<ICommunity[]> {
        // by the time of writting, sequelize
        // does not support eager loading with global "raw: false".
        // Please, check again, and if available, update this
        // https://github.com/sequelize/sequelize/issues/6408
        let sqlQuery =
            'select * from community c ' +
            'left join ubi_community_daily_metrics cm on c.id = cm."communityId" and cm.date = (select date from ubi_community_daily_metrics order by date desc limit 1) ' +
            'left join ubi_community_contract cc on c.id = cc."communityId" ' +
            'left join ubi_community_state cs on c.id = cs."communityId" ' +
            "where c.visibility = 'public' and c.status = 'valid' ";
        switch (order) {
            case 'out_of_funds':
                // we can't devide by zero! ubiRate is never zero
                sqlQuery +=
                    'and cs.beneficiaries != 0 order by (cs.raised - cs.claimed) / cm."ubiRate" / cs.beneficiaries';
                break;

            case 'newest':
                sqlQuery += 'order by c.started desc';
                break;

            default:
                sqlQuery += 'order by cs.beneficiaries desc';
                break;
        }

        const rawResult: (CommunityAttributes &
            UbiCommunityState &
            UbiCommunityContract &
            UbiCommunityDailyMetrics)[] = await this.sequelize.query(sqlQuery, {
            type: QueryTypes.SELECT,
        });

        const results: any[] = rawResult.map((c) => ({
            id: c.id,
            publicId: c.publicId,
            requestByAddress: c.requestByAddress,
            contractAddress: c.contractAddress,
            name: c.name,
            description: c.description,
            descriptionEn: c.descriptionEn,
            language: c.language,
            currency: c.currency,
            city: c.city,
            country: c.country,
            gps: c.gps,
            email: c.email,
            visibility: c.visibility,
            coverImage: c.coverImage,
            coverMediaId: c.coverMediaId,
            status: c.status,
            started: c.started,
            contract: {
                baseInterval: c.baseInterval,
                claimAmount: c.claimAmount,
                incrementInterval: c.incrementInterval,
                maxClaim: c.maxClaim,
                // values below don't matter
                communityId: c.id,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            },
            state: {
                backers: c.backers,
                beneficiaries: c.beneficiaries,
                removedBeneficiaries: c.removedBeneficiaries,
                managers: c.managers,
                claimed: c.claimed,
                claims: c.claims,
                raised: c.raised,
                // values below don't matter
                communityId: c.id,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            },
            metrics:
                c.ssi !== null &&
                c.ubiRate !== null &&
                c.estimatedDuration !== null
                    ? {
                          date: c.date,
                          estimatedDuration: c.estimatedDuration,
                          ssi: c.ssi,
                          ssiDayAlone: c.ssiDayAlone,
                          ubiRate: c.ubiRate,
                          // values below don't matter
                          communityId: c.id,
                          createdAt: c.createdAt,
                          updatedAt: c.updatedAt,
                          id: 0,
                      }
                    : undefined,
            // values below don't matter
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }));

        return results;
    }

    public static async listBeneficiaries(
        managerAddress: string,
        active: boolean,
        offset: number,
        limit: number
    ): Promise<IManagerDetailsBeneficiary[]> {
        return BeneficiaryService.listBeneficiaries(
            managerAddress,
            active,
            offset,
            limit
        );
    }

    /**
     * @deprecated Since mobile version 1.1.0
     */
    public static async listManagers(
        managerAddress: string,
        offset: number,
        limit: number
    ): Promise<IManagerDetailsManager[]> {
        return ManagerService.listManagers(managerAddress, offset, limit);
    }

    public static async searchBeneficiary(
        managerAddress: string,
        beneficiaryQuery: string,
        active?: boolean
    ): Promise<IManagerDetailsBeneficiary[]> {
        return await BeneficiaryService.search(
            managerAddress,
            beneficiaryQuery,
            active
        );
    }

    /**
     * @deprecated Since mobile version 1.1.0
     */
    public static async searchManager(
        managerAddress: string,
        beneficiaryQuery: string
    ): Promise<IManagerDetailsManager[]> {
        return await ManagerService.search(managerAddress, beneficiaryQuery);
    }

    /**
     * @deprecated Since mobile version 0.1.8
     */
    public static async managers(managerAddress: string): Promise<IManagers> {
        const manager = await ManagerService.get(managerAddress);
        if (manager === null) {
            throw new Error('Not a manager ' + managerAddress);
        }
        const managers = await ManagerService.countManagers(
            manager.communityId
        );
        const beneficiaries = await BeneficiaryService.countInCommunity(
            manager.communityId
        );
        return {
            managers,
            beneficiaries,
        };
    }

    /**
     * @deprecated Since mobile version 0.1.8
     */
    public static async managersDetails(
        managerAddress: string
    ): Promise<IManagersDetails> {
        const manager = await ManagerService.get(managerAddress);
        if (manager === null) {
            throw new Error('Not a manager ' + managerAddress);
        }
        const managers = await ManagerService.managersInCommunity(
            manager.communityId
        );
        const beneficiaries = await BeneficiaryService.listAllInCommunity(
            manager.communityId
        );
        return {
            managers,
            beneficiaries,
        };
    }

    public static getResquestChangeUbiParams(
        publicId: string
    ): Promise<UbiRequestChangeParams | null> {
        return this.ubiRequestChangeParams.findOne({
            where: { communityId: publicId },
        });
    }

    /**
     * @deprecated Use `findById`
     */
    public static async getByPublicId(
        publicId: string
    ): Promise<ICommunity | null> {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const rawCommunity = await this.community.findOne({
            include: [
                {
                    model: this.ubiCommunitySuspect,
                    as: 'suspect',
                    required: false,
                    where: {
                        createdAt: {
                            [Op.eq]: literal(
                                '(select max("createdAt") from ubi_community_suspect where "communityId" = "suspect"."communityId" and "createdAt" > \'' +
                                    yesterday.toISOString().split('T')[0] +
                                    "')"
                            ),
                        },
                    },
                },
                {
                    model: this.ubiOrganization,
                    as: 'organization',
                    required: false,
                },
            ],
            where: {
                publicId,
            },
        });
        if (rawCommunity === null) {
            throw new Error('Not found community ' + publicId);
        }
        const community = rawCommunity.toJSON() as CommunityAttributes;
        const communityState = await this.ubiCommunityState.findOne({
            where: {
                communityId: community.id,
            },
            raw: true,
        });
        const communityContract = await this.ubiCommunityContract.findOne({
            where: {
                communityId: community.id,
            },
            raw: true,
        });
        const communityDailyMetrics = await this.ubiCommunityDailyMetrics.findAll(
            {
                where: {
                    communityId: community.id,
                },
                order: [['createdAt', 'DESC']],
                limit: 1,
                raw: true,
            }
        );

        // because organization as a many-to-many (see association file)
        // needs to be broken
        let organization: UbiOrganization | undefined = undefined;
        if (
            community.organization &&
            (community.organization as any).length > 0
        ) {
            organization = (community.organization as any)[0];
        }
        return {
            ...community,
            organization,
            state: communityState!,
            contract: communityContract
                ? (communityContract as any)
                : undefined,
            metrics: communityDailyMetrics[0]!,
        } as any;
    }

    public static async findById(id: number): Promise<CommunityAttributes> {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const community = await this.community.findOne({
            include: [
                {
                    model: this.ubiCommunitySuspect,
                    as: 'suspect',
                    required: false,
                    where: {
                        createdAt: {
                            [Op.eq]: literal(
                                '(select max("createdAt") from ubi_community_suspect where "communityId" = "suspect"."communityId" and "createdAt" >= \'' +
                                    yesterday.toISOString().split('T')[0] +
                                    "')"
                            ),
                        },
                    },
                },
                {
                    model: this.ubiCommunityContract,
                    as: 'contract',
                },
                {
                    model: this.ubiCommunityState,
                    as: 'state',
                },
                {
                    model: this.ubiCommunityDailyMetrics,
                    as: 'metrics',
                    required: false,
                    where: {
                        createdAt: {
                            [Op.eq]: literal(
                                '(select max("createdAt") from ubi_community_daily_metrics where "communityId" = "metrics"."communityId")'
                            ),
                        },
                    },
                },
                {
                    model: this.ubiOrganization,
                    as: 'organization',
                    required: false,
                    include: [
                        {
                            model: this.ubiOrganizationSocialMedia,
                            as: 'socialMedia',
                        },
                        {
                            model: this.appMediaContent,
                            as: 'logo',
                            include: [
                                {
                                    model: this.appMediaThumbnail,
                                    as: 'thumbnails',
                                },
                            ],
                        },
                    ],
                },
                {
                    model: this.appMediaContent,
                    as: 'cover',
                    include: [
                        {
                            model: this.appMediaThumbnail,
                            as: 'thumbnails',
                        },
                    ],
                },
            ],
            where: {
                id,
            },
        });
        if (community === null) {
            throw new Error('Not found community ' + id);
        }
        return community.toJSON() as CommunityAttributes;
    }

    public static async getDashboard(id: string) {
        const result = await this.community.findOne({
            include: [
                {
                    model: this.ubiCommunityState,
                    as: 'state',
                },
                {
                    model: this.ubiCommunityContract,
                    as: 'contract',
                },
                {
                    model: this.ubiCommunityDemographics,
                    required: false,
                    as: 'demographics',
                    order: [['date', 'DESC']],
                    limit: 1,
                },
                {
                    model: this.ubiCommunityDailyMetrics,
                    required: false,
                    as: 'metrics',
                    order: [['date', 'DESC']],
                    limit: 30,
                },
                {
                    model: this.ubiCommunityDailyState,
                    as: 'dailyState',
                    order: [['date', 'DESC']],
                    limit: 30,
                },
            ],
            where: {
                id,
            },
        });
        return result?.toJSON() as CommunityAttributes;
    }

    public static async getClaimLocation(id: string) {
        const aMonthAgo = new Date();
        aMonthAgo.setDate(aMonthAgo.getDate() - 30);
        aMonthAgo.setHours(0, 0, 0, 0);
        const result = await this.community.findOne({
            attributes: ['id'],
            include: [
                {
                    model: this.claimLocation,
                    as: 'claimLocation',
                    where: {
                        createdAt: { [Op.gte]: aMonthAgo },
                    },
                },
            ],
            where: {
                id,
            },
        });
        return result?.toJSON() as CommunityAttributes;
    }

    public static async getManagers(communityId: string) {
        const community = (await this.community.findOne({
            where: { id: communityId },
        }))!;
        const result = await this.manager.findAll({
            include: [
                {
                    model: this.user,
                    as: 'user',
                    include: [
                        {
                            model: this.appMediaContent,
                            as: 'avatar',
                            required: false,
                            include: [
                                {
                                    model: this.appMediaThumbnail,
                                    as: 'thumbnails',
                                },
                            ],
                        },
                    ],
                },
            ],
            where: {
                communityId: community.publicId,
            },
        });
        return result.map((r) => r.toJSON() as ManagerAttributes);
    }

    public static async getCommunityOnlyByPublicId(
        publicId: string
    ): Promise<Community | null> {
        return this.community.findOne({
            where: {
                publicId,
            },
            raw: true,
        });
    }

    public static async getCommunityOnlyById(
        id: number
    ): Promise<Community | null> {
        return this.community.findOne({
            where: {
                id,
            },
            raw: true,
        });
    }

    /**
     * @deprecated (create a new method)
     */
    public static async getByContractAddress(
        contractAddress: string
    ): Promise<ICommunity | null> {
        const community = await this.community.findOne({
            where: {
                contractAddress,
            },
            raw: true,
        });
        if (community === null) {
            throw new Error('Not found community ' + contractAddress);
        }
        const communityState = await this.ubiCommunityState.findOne({
            where: {
                communityId: community.id,
            },
            raw: true,
        });
        const communityContract = await this.ubiCommunityContract.findOne({
            where: {
                communityId: community.id,
            },
            raw: true,
        });
        const communityDailyMetrics = await this.ubiCommunityDailyMetrics.findAll(
            {
                where: {
                    communityId: community.id,
                },
                order: [['createdAt', 'DESC']],
                limit: 1,
                raw: true,
            }
        );
        return {
            ...community,
            state: communityState!,
            contract: communityContract!,
            metrics: communityDailyMetrics[0]!,
        } as any;
    }

    public static async existsByContractAddress(
        contractAddress: string
    ): Promise<boolean> {
        const community = await this.community.count({
            where: {
                contractAddress,
            },
        });
        return community !== 0;
    }

    public static async getAllAddressesAndIds(): Promise<Map<string, string>> {
        const result = await this.community.findAll({
            attributes: ['contractAddress', 'publicId'],
            where: {
                contractAddress: {
                    [Op.ne]: null,
                },
            },
            raw: true,
        });
        return new Map(result.map((c) => [c.contractAddress!, c.publicId]));
    }

    public static async findByFirstManager(
        requestByAddress: string
    ): Promise<string | null> {
        const community = await this.community.findOne({
            attributes: ['publicId'],
            where: {
                requestByAddress,
                status: {
                    [Op.or]: ['valid', 'pending'],
                },
            },
            raw: true,
        });
        if (community) {
            return community.publicId;
        }
        return null;
    }

    public static async getOnlyCommunityByContractAddress(
        contractAddress: string
    ): Promise<Community | null> {
        return await this.community.findOne({
            where: { contractAddress },
            raw: true,
        });
    }
}
