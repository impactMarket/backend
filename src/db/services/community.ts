import { Community } from '../models/community';
import { ethers } from 'ethers';
import config from '../../config';
import ImpactMarketContractABI from '../../contracts/ImpactMarketABI.json'
import TransactionsService from './transactions';
import { ICommunityInfo } from '../../types';
import { Op } from 'sequelize';


export default class CommunityService {
    public static async request(
        requestByAddress: string,
        name: string,
        description: string,
        city: string,
        country: string,
        gps: {
            latitude: number,
            longitude: number,
        },
        email: string,
        visibility: string,
        coverImage: string,
        txCreationObj: any,
    ) {
        return Community.create({
            requestByAddress,
            name,
            description,
            city,
            country,
            gps,
            email,
            visibility,
            coverImage,
            status: 'pending',
            txCreationObj,
        });
    }

    public static async edit(
        publicId: string,
        name: string,
        description: string,
        city: string,
        country: string,
        gps: {
            latitude: number,
            longitude: number,
        },
        email: string,
        visibility: string,
        coverImage: string,
    ) {
        return Community.update({
            name,
            description,
            city,
            country,
            gps,
            email,
            visibility,
            coverImage,
        }, { returning: true, where: { publicId } });
    }

    public static async accept(acceptanceTransaction: string, publicId: string): Promise<boolean> {
        const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
        const receipt = await provider.waitForTransaction(acceptanceTransaction);
        const ifaceImpactMarket = new ethers.utils.Interface(ImpactMarketContractABI);
        if (receipt.logs === undefined) {
            return true;
        }
        const eventsImpactMarket = receipt.logs.map((log) => ifaceImpactMarket.parseLog(log));
        const index = eventsImpactMarket.findIndex((event) => event !== null && event.name === 'CommunityAdded');
        const communityContractAddress = eventsImpactMarket[index].values._addr;
        const dbUpdate: [number, Community[]] = await Community.update(
            { contractAddress: communityContractAddress, status: 'valid', txCreationObj: null },
            { returning: true, where: { publicId } },
        );
        if (dbUpdate[0] === 1) {
            return true;
        }
        return false;
    }

    public static async getAll(status?: string): Promise<ICommunityInfo[]> {
        let communities: Community[];
        if (status === undefined) {
            const communities = await Community.findAll({ raw: true });
            return communities.map((community) => ({
                ...community,
                createdAt: community.createdAt.toString(),
                updatedAt: community.updatedAt.toString(),
                backers: [],
                beneficiaries: {
                    added: [],
                    removed: [],
                },
                managers: [],
                totalClaimed: '0',
                totalRaised: '0',
                vars: {
                    _claimAmount: '0',
                    _baseInterval: '0',
                    _maxClaim: '0',
                    _incrementInterval: '0',
                },
            }))
        }
        let result: ICommunityInfo[] = [];
        communities = await Community.findAll({ where: { status }, raw: true });
        for (let index = 0; index < communities.length; index++) {
            result.push(await this.getCachedInfoToCommunity(communities[index]));
        }
        return result;
    }

    public static async findByFirstManager(requestByAddress: string) {
        return Community.findOne({ where: { requestByAddress } });
    }

    public static async findByPublicId(publicId: string) {
        return Community.findOne({ where: { publicId } });
    }

    public static async findByContractAddress(contractAddress: string): Promise<ICommunityInfo | null> {
        const community = await Community.findOne({ where: { contractAddress }, raw: true });
        if (community === null) {
            return null;
        }
        return await this.getCachedInfoToCommunity(community);
    }

    public static async getNamesAndFromAddresses(addresses: string[]) {
        return Community.findAll({
            attributes: ['contractAddress', 'name'],
            where: {
                contractAddress: {
                    [Op.in]: addresses
                }
            }
        });
    }

    private static async getCachedInfoToCommunity(community: Community): Promise<ICommunityInfo> {
        const beneficiaries = await TransactionsService.getBeneficiariesInCommunity(community.contractAddress);
        const managers = await TransactionsService.getCommunityManagersInCommunity(community.contractAddress);
        const backers = await TransactionsService.getBackersInCommunity(community.contractAddress);
        const vars = await TransactionsService.getCommunityVars(community.contractAddress);

        const claimed = await TransactionsService.getCommunityClaimedAmount(community.contractAddress);
        const raised = await TransactionsService.getCommunityRaisedAmount(community.contractAddress);

        return {
            ...community,
            createdAt: community.createdAt.toString(),
            updatedAt: community.updatedAt.toString(),
            backers,
            beneficiaries,
            managers,
            totalClaimed: claimed.toString(),
            totalRaised: raised.toString(),
            vars,
        };
    }

    public static async mappedNames(): Promise<Map<string, string>> {
        const mapped = new Map<string, string>();
        const query = await Community.findAll({
            attributes: ['contractAddress', 'name'],
        });
        for (let index = 0; index < query.length; index++) {
            const element = query[index];
            mapped.set(element.contractAddress, element.name);
        }
        return mapped;
    }
}