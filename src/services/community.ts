import { Community } from '../models/community';
import { ethers } from 'ethers';
import config from '../config';
import ImpactMarketContractABI from '../contracts/ImpactMarketABI.json'
import TransactionsService from './transactions';
import { ICommunityInfo } from '../types';
import { Op } from 'sequelize';


export default class CommunityService {
    public static async request(
        requestByAddress: string,
        name: string,
        description: string,
        location: {
            title: string,
            latitude: number,
            longitude: number,
        },
        coverImage: string,
        txCreationObj: any,
    ) {
        return Community.create({
            requestByAddress,
            name,
            description,
            location,
            coverImage,
            status: 'pending',
            txCreationObj,
        });
    }

    public static async edit(
        publicId: string,
        name: string,
        description: string,
        location: {
            title: string,
            latitude: number,
            longitude: number,
        },
        coverImage: string,
    ) {
        return Community.update({
            name,
            description,
            location,
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
        let result: ICommunityInfo[] = [];
        let communities: Community[];
        if (status === undefined) {
            const communities = await Community.findAll();
            result = communities.map((community) => ({
                publicId: community.publicId,
                requestByAddress: community.requestByAddress,
                contractAddress: community.contractAddress,
                name: community.name,
                description: community.description,
                location: community.location,
                coverImage: community.coverImage,
                status: community.status,
                txCreationObj: community.txCreationObj,
                createdAt: community.createdAt.toString(),
                updatedAt: community.updatedAt.toString(),
                backers: [],
                beneficiaries: [],
                managers: [],
                totalClaimed: '0',
                totalRaised: '0',
                vars: {
                    _amountByClaim: '0',
                    _baseIntervalTime: '0',
                    _claimHardCap: '0',
                    _incIntervalTime: '0',
                },
            }))
            return result;
        }
        communities = await Community.findAll({ where: { status } });
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
        const community = await Community.findOne({ where: { contractAddress } });
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
            publicId: community.publicId,
            requestByAddress: community.requestByAddress,
            contractAddress: community.contractAddress,
            name: community.name,
            description: community.description,
            location: community.location,
            coverImage: community.coverImage,
            status: community.status,
            txCreationObj: community.txCreationObj,
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
}