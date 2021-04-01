import { UbiRequestChangeParams } from '@interfaces/ubi/requestChangeParams';
import { UbiCommunityContract } from '@interfaces/ubi/ubiCommunityContract';
import { UbiCommunityState } from '@interfaces/ubi/ubiCommunityState';
import {
    Community,
    CommunityAttributes,
    CommunityCreationAttributes,
} from '@models/ubi/community';
import { CommunityDailyMetricsAttributes } from '@models/ubi/communityDailyMetrics';
import { notifyManagerAdded } from '@utils/util';
import { ethers } from 'ethers';
import { Op, QueryTypes, fn, col, literal } from 'sequelize';

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
import { deleteContentFromS3 } from '../storage';
import BeneficiaryService from './beneficiary';
import CommunityContractService from './communityContract';
import CommunityDailyStateService from './communityDailyState';
import CommunityStateService from './communityState';
import ManagerService from './managers';

export default class CommunityService {
    public static community = models.community;
    public static ubiCommunityContract = models.ubiCommunityContract;
    public static ubiCommunityState = models.ubiCommunityState;
    public static communityDailyMetrics = models.communityDailyMetrics;
    public static ubiRequestChangeParams = models.ubiRequestChangeParams;
    public static ubiCommunitySuspect = models.ubiCommunitySuspect;
    public static sequelize = sequelize;

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
        coverImage: string,
        txReceipt: any | undefined,
        contractParams: ICommunityContractParams
    ): Promise<Community> {
        let managerAddress: string = '';
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
            coverImage,
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
        coverImage: string,
        contractParams: ICommunityContractParams
    ): Promise<Community> {
        // TODO: improve, insert with unique transaction (see sequelize eager loading)
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
            coverImage,
            status: 'pending',
            started: new Date(),
        });
        await CommunityContractService.add(community.id, contractParams);
        await CommunityStateService.add(community.id);
        await CommunityDailyStateService.populateNext5Days(community.id);
        return community;
    }

    public static async edit(
        publicId: string,
        name: string,
        description: string,
        language: string,
        currency: string,
        city: string,
        country: string,
        email: string,
        coverImage: string
    ): Promise<[number, Community[]]> {
        return this.community.update(
            {
                name,
                description,
                language,
                currency,
                city,
                country,
                email,
                coverImage,
            },
            { returning: true, where: { publicId } }
        );
    }

    public static async pending(): Promise<ICommunityPendingDetails[]> {
        // by the time of writting, sequelize
        // does not support eager loading with global "raw: false".
        // Please, check again, and if available, update this
        // https://github.com/sequelize/sequelize/issues/6408
        const sqlQuery =
            'select id, "publicId", "contractAddress", "requestByAddress", name, city, country, description, email, "coverImage", cc.*, cs.* ' +
            'from community c ' +
            'left join ubi_community_contract cc on c."publicId" = cc."communityId" ' +
            'left join ubi_community_state cs on c."publicId" = cs."communityId" ' +
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
            txCreationObj: null,
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
                        txCreationObj: null,
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
            await deleteContentFromS3(
                config.aws.bucketImagesCommunity,
                c.coverImage
            );
            await this.ubiCommunityState.destroy({
                where: {
                    communityId: publicId,
                },
            });
            await this.ubiCommunityContract.destroy({
                where: {
                    communityId: publicId,
                },
            });
            await this.community.destroy({
                where: {
                    publicId,
                },
            });
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

    public static async list(
        order: string | undefined,
        query: any
    ): Promise<ICommunityLightDetails[]> {
        // by the time of writting, sequelize
        // does not support eager loading with global "raw: false".
        // Please, check again, and if available, update this
        // https://github.com/sequelize/sequelize/issues/6408
        let sqlQuery =
            'select id, "publicId", "contractAddress", name, city, country, "coverImage", cc.*, cs.* ' +
            'from community c ' +
            'left join ubi_community_contract cc on c."publicId" = cc."communityId" ' +
            'left join ubi_community_state cs on c."publicId" = cs."communityId" ' +
            "where status = 'valid' and visibility = 'public' ";
        let useOrder = '';
        if (order === undefined && query.order !== undefined) {
            useOrder = query.order;
        }
        switch (useOrder) {
            case 'nearest': {
                const lat = parseInt(query.lat, 10);
                const lng = parseInt(query.lng, 10);
                if (typeof lat !== 'number' || typeof lng !== 'number') {
                    throw new Error('NaN');
                }
                sqlQuery +=
                    'order by (6371*acos(cos(radians(' +
                    lat +
                    "))*cos(radians(cast(gps->>'latitude' as float)))*cos(radians(cast(gps->>'longitude' as float))-radians(" +
                    lng +
                    '))+sin(radians(' +
                    lat +
                    "))*sin(radians(cast(gps->>'latitude' as float)))))";
                break;
            }
            default:
                sqlQuery += 'order by cs.beneficiaries desc';
                break;
        }

        if (query.offset !== undefined && query.limit !== undefined) {
            const offset = parseInt(query.offset, 10);
            const limit = parseInt(query.limit, 10);
            if (typeof offset !== 'number' || typeof limit !== 'number') {
                throw new Error('NaN');
            }
            const totalCommunities = await CommunityService.countPublicCommunities();
            sqlQuery +=
                ' offset ' +
                offset +
                ' limit ' +
                Math.min(limit, Math.max(totalCommunities - offset, 0));
        }

        const rawResult: ({
            id: number;
            publicId: string;
            contractAddress: string;
            name: string;
            city: string;
            country: string;
            coverImage: string;
        } & UbiCommunityState &
            UbiCommunityContract)[] = await this.sequelize.query(sqlQuery, {
            type: QueryTypes.SELECT,
        });

        const results: ICommunityLightDetails[] = rawResult.map((c) => ({
            id: c.id,
            publicId: c.publicId,
            contractAddress: c.contractAddress,
            name: c.name,
            city: c.city,
            country: c.country,
            coverImage: c.coverImage,
            txCreationObj: null,
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

    public static async listFull(order?: string): Promise<ICommunity[]> {
        // by the time of writting, sequelize
        // does not support eager loading with global "raw: false".
        // Please, check again, and if available, update this
        // https://github.com/sequelize/sequelize/issues/6408
        let sqlQuery =
            'select * from community c ' +
            'left join ubi_community_daily_metrics cm on c."publicId" = cm."communityId" and cm.date = (select date from ubi_community_daily_metrics order by date desc limit 1) ' +
            'left join ubi_community_contract cc on c."publicId" = cc."communityId" ' +
            'left join ubi_community_state cs on c."publicId" = cs."communityId" ' +
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
            CommunityDailyMetricsAttributes)[] = await this.sequelize.query(
            sqlQuery,
            { type: QueryTypes.SELECT }
        );

        const results: ICommunity[] = rawResult.map((c) => ({
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
            status: c.status,
            started: c.started,
            txCreationObj: null,
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
                          communityId: c.publicId,
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
        const rawCommunity = await this.community.findAll({
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
            ],
            where: {
                publicId,
            },
        });
        const community = rawCommunity[0].toJSON() as CommunityAttributes;
        if (community === null) {
            throw new Error('Not found community ' + publicId);
        }
        const communityState = await this.ubiCommunityState.findOne({
            where: {
                communityId: community.publicId,
            },
            raw: true,
        });
        const communityContract = await this.ubiCommunityContract.findOne({
            where: {
                communityId: community.publicId,
            },
            raw: true,
        });
        const communityDailyMetrics = await this.communityDailyMetrics.findAll({
            where: {
                communityId: community.publicId,
            },
            order: [['createdAt', 'DESC']],
            limit: 1,
            raw: true,
        });
        return {
            ...community,
            state: communityState!,
            contract: communityContract
                ? (communityContract as any)
                : undefined,
            metrics: communityDailyMetrics[0]!,
        };
    }

    public static async findById(id: number): Promise<CommunityAttributes> {
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
            ],
            where: {
                id,
            },
        });
        if (rawCommunity === null) {
            throw new Error('Not found community ' + id);
        }
        const community = rawCommunity.toJSON() as CommunityAttributes;
        // const communityDailyMetrics = await this.communityDailyMetrics.findAll({
        //     where: {
        //         communityId: community.publicId,
        //     },
        //     order: [['createdAt', 'DESC']],
        //     limit: 1,
        //     raw: true,
        // });
        return {
            ...community,
            // metrics: communityDailyMetrics[0]!,
        };
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
                communityId: community.publicId,
            },
            raw: true,
        });
        const communityContract = await this.ubiCommunityContract.findOne({
            where: {
                communityId: community.publicId,
            },
            raw: true,
        });
        const communityDailyMetrics = await this.communityDailyMetrics.findAll({
            where: {
                communityId: community.publicId,
            },
            order: [['createdAt', 'DESC']],
            limit: 1,
            raw: true,
        });
        return {
            ...community,
            state: communityState!,
            contract: communityContract!,
            metrics: communityDailyMetrics[0]!,
        };
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

    public static async getNamesAndFromAddresses(
        addresses: string[]
    ): Promise<Community[]> {
        return this.community.findAll({
            attributes: ['contractAddress', 'name'],
            where: {
                contractAddress: {
                    [Op.in]: addresses,
                },
            },
            raw: true,
        });
    }

    public static async mappedNames(): Promise<Map<string, string>> {
        const mapped = new Map<string, string>();
        const query = await this.community.findAll({
            attributes: ['contractAddress', 'name'],
            where: {
                contractAddress: {
                    [Op.ne]: null,
                },
            },
            raw: true,
        });
        for (let index = 0; index < query.length; index++) {
            const element = query[index];
            mapped.set(element.contractAddress!, element.name);
        }
        return mapped;
    }
}
