import { ethers } from 'ethers';
import { Op } from 'sequelize';

import config from '../config';
import CommunityContractABI from '../contracts/CommunityABI.json';
import ImpactMarketContractABI from '../contracts/ImpactMarketABI.json';
import database from '../loaders/database';
import { Community, CommunityCreationAttributes } from '../db/models/community';
import { ICommunityContractParams, ICommunityInfo } from '../types';
import { notifyManagerAdded } from '../utils';
import CommunityContractService from './communityContract';
import CommunityDailyMetricsService from './communityDailyMetrics';
import CommunityDailyStateService from './communityDailyState';
import CommunityStateService from './communityState';
import SSIService from './ssi';
import TransactionsService from './transactions';
import { ICommunity, ICommunityLightDetails, IManagers, IManagersDetails } from '../types/endpoints';
import ManagerService from './managers';
import BeneficiaryService from './beneficiary';

const db = database();
export default class CommunityService {
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
        }

        // if it was submitted as private, validate the transaction first.
        if (txReceipt !== undefined) {
            const ifaceCommunity = new ethers.utils.Interface(CommunityContractABI);
            const eventsCoomunity: ethers.utils.LogDescription[] = [];
            for (let index = 0; index < txReceipt.logs.length; index++) {
                try {
                    const parsedLog = ifaceCommunity.parseLog(
                        txReceipt.logs[index]
                    );
                    eventsCoomunity.push(parsedLog);
                } catch (e) { }
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
            }
        }

        const t = await db.sequelize.transaction();
        try {
            const community = await db.models.community.create(createObject, { transaction: t });
            await CommunityContractService.add(community.publicId, contractParams, t);
            await CommunityStateService.add(community.publicId, t);
            await CommunityDailyStateService.populateNext5Days(community.publicId, t);
            if (txReceipt !== undefined) {
                await ManagerService.add(
                    managerAddress,
                    community.publicId,
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
        const community = await db.models.community.create({
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
        await CommunityContractService.add(community.publicId, contractParams);
        await CommunityStateService.add(community.publicId);
        await CommunityDailyStateService.populateNext5Days(community.publicId);
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
        return db.models.community.update(
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

    public static async accept(
        acceptanceTransaction: string,
        publicId: string
    ): Promise<boolean> {
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
            return true;
        }
        const eventsImpactMarket: ethers.utils.LogDescription[] = [];
        for (let index = 0; index < receipt.logs.length; index++) {
            try {
                const parsedLog = ifaceImpactMarket.parseLog(
                    receipt.logs[index]
                );
                eventsImpactMarket.push(parsedLog);
            } catch (e) { }
        }
        const index = eventsImpactMarket.findIndex(
            (event) => event !== null && event.name === 'CommunityAdded'
        );
        if (index !== -1) {
            const communityContractAddress =
                eventsImpactMarket[index].args._communityAddress;
            const dbUpdate: [number, Community[]] = await db.models.community.update(
                {
                    contractAddress: communityContractAddress,
                    status: 'valid',
                    txCreationObj: null,
                },
                { returning: true, where: { publicId } }
            );
            if (dbUpdate[0] === 1) {
                notifyManagerAdded(
                    dbUpdate[1][0].requestByAddress,
                    communityContractAddress
                );
                return true;
            }
            return false;
        }
        return true;
    }

    /**
     * @deprecated
     */
    public static async getAll(
        status: string,
        onlyPublic: boolean = true
    ): Promise<ICommunityInfo[]> {
        const result: ICommunityInfo[] = [];
        const communities = await db.models.community.findAll({
            where: {
                status,
                visibility: onlyPublic
                    ? 'public'
                    : {
                        [Op.or]: ['public', 'private'],
                    },
            },
            order: [['createdAt', 'ASC']],
        });
        for (let index = 0; index < communities.length; index++) {
            result.push(
                await this.getCachedInfoToCommunity(communities[index])
            );
        }
        return result;
    }

    public static async list(): Promise<ICommunityLightDetails[]> {
        // this could be much better, but byt the time of ritting, sequelize
        // does not support eager loading with global "raw: false".
        // Please, check again, and if available, update this
        // https://github.com/sequelize/sequelize/issues/6408
        const result: ICommunityLightDetails[] = [];
        const communities = await db.models.community.findAll({
            attributes: [
                'publicId',
                'name',
                'city',
                'country',
                'coverImage',
            ],
            where: {
                status: 'valid',
                visibility: 'public',
            },
        });
        const inCommunities = communities.map((c) => c.publicId);
        const communityState = await db.models.communityState.findAll({
            where: {
                communityId: {
                    [Op.in]: inCommunities
                }
            },
        });
        const communityContract = await db.models.communityContract.findAll({
            where: {
                communityId: {
                    [Op.in]: inCommunities
                }
            },
        });
        for (let index = 0; index < communities.length; index++) {
            result.push({
                ...communities[index],
                state: communityState.find((c) => c.communityId = communities[index].publicId)!,
                contract: communityContract.find((c) => c.communityId = communities[index].publicId)!,
            });
        }
        return result.sort((a, b) => a.state.beneficiaries > b.state.beneficiaries ? 1 : (a.state.beneficiaries < b.state.beneficiaries ? -1 : 0));
    }

    public static async listFull(): Promise<ICommunity[]> {
        // this could be much better, but byt the time of ritting, sequelize
        // does not support eager loading with global "raw: false".
        // Please, check again, and if available, update this
        // https://github.com/sequelize/sequelize/issues/6408
        const result: ICommunity[] = [];
        const communities = await db.models.community.findAll({
            where: {
                status: 'valid',
                visibility: 'public',
            },
        });
        const inCommunities = communities.map((c) => c.publicId);
        const communityState = await db.models.communityState.findAll({
            where: {
                communityId: {
                    [Op.in]: inCommunities
                }
            },
        });
        const communityContract = await db.models.communityContract.findAll({
            where: {
                communityId: {
                    [Op.in]: inCommunities
                }
            },
        });
        const communityDailyMetrics = await db.models.communityDailyMetrics.findAll({
            where: {
                communityId: {
                    [Op.in]: inCommunities
                }
            },
            order: [['createdAt', 'DESC']],
            limit: inCommunities.length
        });
        for (let index = 0; index < communities.length; index++) {
            result.push({
                ...communities[index],
                state: communityState.find((c) => c.communityId = communities[index].publicId)!,
                contract: communityContract.find((c) => c.communityId = communities[index].publicId)!,
                metrics: communityDailyMetrics.find((c) => c.communityId = communities[index].publicId)!,
            });
        }
        return result.sort((a, b) => a.state.beneficiaries > b.state.beneficiaries ? 1 : (a.state.beneficiaries < b.state.beneficiaries ? -1 : 0));
    }

    public static async managers(managerAddress: string): Promise<IManagers> {
        const manager = await ManagerService.get(managerAddress);
        if(manager === null) {
            throw new Error('Not a manager ' + managerAddress);
        }
        const managers = await ManagerService.countManagers(manager.communityId);
        const beneficiaries = await BeneficiaryService.countInCommunity(manager.communityId);
        return {
            managers,
            beneficiaries
        }
    }

    public static async managersDetails(managerAddress: string): Promise<IManagersDetails> {
        const manager = await ManagerService.get(managerAddress);
        if(manager === null) {
            throw new Error('Not a manager ' + managerAddress);
        }
        const managers = await ManagerService.listManagers(manager.communityId);
        const beneficiaries = await BeneficiaryService.listAllInCommunity(manager.communityId);
        return {
            managers,
            beneficiaries
        }
    }

    public static async get(
        publicId: string
    ): Promise<ICommunity | null> {
        const community = await db.models.community.findOne({
            where: {
                publicId,
            },
        });
        if (community === null) {
            throw new Error('Not found community ' + publicId);
        }
        const communityState = await db.models.communityState.findOne({
            where: {
                communityId: community.publicId
            },
        });
        const communityContract = await db.models.communityContract.findOne({
            where: {
                communityId: community.publicId
            },
        });
        const communityDailyMetrics = await db.models.communityDailyMetrics.findAll({
            where: {
                communityId: community.publicId
            },
            order: [['createdAt', 'DESC']],
            limit: 1
        });
        return {
            ...community,
            state: communityState!,
            contract: communityContract!,
            metrics: communityDailyMetrics[0]!,
        }
    }

    public static async getAllAddressesAndIds(): Promise<Map<string, string>> {
        const result = await db.models.community.findAll({
            attributes: ['contractAddress', 'publicId'],
            where: {
                contractAddress: {
                    [Op.ne]: null
                }
            }
        });
        return new Map(result.map((c) => [c.contractAddress!, c.publicId]));
    }

    public static async findByFirstManager(
        requestByAddress: string
    ): Promise<Community | null> {
        return db.models.community.findOne({
            where: {
                requestByAddress,
                status: {
                    [Op.or]: ['valid', 'pending'],
                },
            },
        });
    }

    /**
     * @deprecated
     */
    public static async findByPublicId(
        publicId: string
    ): Promise<ICommunityInfo | null> {
        const community = await db.models.community.findOne({
            where: {
                publicId,
                status: {
                    [Op.or]: ['valid', 'pending'],
                },
            },
        });
        if (community === null) {
            return null;
        }
        return await this.getCachedInfoToCommunity(community);
    }

    public static async findByContractAddress(
        contractAddress: string
    ): Promise<ICommunityInfo | null> {
        const community = await db.models.community.findOne({
            where: { contractAddress },
        });
        if (community === null) {
            return null;
        }
        return await this.getCachedInfoToCommunity(community);
    }

    public static async getOnlyCommunityByContractAddress(
        contractAddress: string
    ): Promise<Community | null> {
        return await db.models.community.findOne({ where: { contractAddress } });
    }

    public static async getNamesAndFromAddresses(
        addresses: string[]
    ): Promise<Community[]> {
        return db.models.community.findAll({
            attributes: ['contractAddress', 'name'],
            where: {
                contractAddress: {
                    [Op.in]: addresses,
                },
            },
        });
    }

    /**
     * @deprecated
     */
    private static async getCachedInfoToCommunity(
        community: Community
    ): Promise<ICommunityInfo> {
        const communityState = await CommunityStateService.get(
            community.publicId
        );
        const communityMetrics = await CommunityDailyMetricsService.getLastMetrics(
            community.publicId
        );
        const contractParams = await CommunityContractService.get(
            community.publicId
        );
        const beneficiaries = await TransactionsService.getBeneficiariesInCommunity(
            community.contractAddress!
        );
        const managers = await TransactionsService.getCommunityManagersInCommunity(
            community.contractAddress!
        );
        const backers = await TransactionsService.getBackersInCommunity(
            community.contractAddress!
        );
        let vars;
        // TODO: remove others
        if (contractParams !== null) {
            vars = {
                _claimAmount: contractParams.claimAmount,
                _baseInterval: contractParams.baseInterval.toString(),
                _incrementInterval: contractParams.incrementInterval.toString(),
                _maxClaim: contractParams.maxClaim,
            };
        } else if (community.visibility === 'public') {
            vars = await TransactionsService.getCommunityVars(
                community.contractAddress!
            );
        } else {
            vars = community.txCreationObj;
        }

        const totalClaimed = communityState.claimed;
        const totalRaised = communityState.raised;
        const ssi = await SSIService.get(community.publicId);

        return {
            ...community,
            backers, // TODO: to remove
            beneficiaries,
            managers,
            ssi,
            totalClaimed, // TODO: to remove
            totalRaised, // TODO: to remove
            vars,
            state: communityState,
            metrics: communityMetrics,
            contractParams,
        };
    }

    public static async mappedNames(): Promise<Map<string, string>> {
        const mapped = new Map<string, string>();
        const query = await db.models.community.findAll({
            attributes: ['contractAddress', 'name'],
            where: {
                contractAddress: {
                    [Op.ne]: null
                }
            }
        });
        for (let index = 0; index < query.length; index++) {
            const element = query[index];
            mapped.set(element.contractAddress!, element.name);
        }
        return mapped;
    }
}
