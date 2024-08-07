import { Includeable, Op, WhereOptions, col, fn, literal } from 'sequelize';
import { ethers } from 'ethers';
import { getAddress } from '@ethersproject/address';
import csv from 'csvtojson';
import fs from 'fs';
import json2csv from 'json2csv';

import { AppUser } from '../../../interfaces/app/appUser';
import { BaseError } from '../../../utils/baseError';
import { CommunityAttributes } from '../../../interfaces/ubi/community';
import { CommunityContentStorage } from '../../storage';
import { ManagerSubgraph } from '../../../subgraph/interfaces/manager';
import { UbiCommunityCampaign } from '../../../interfaces/ubi/ubiCommunityCampaign';
import { UbiCommunityContract } from '../../../interfaces/ubi/ubiCommunityContract';
import { countManagers, getCommunityManagers } from '../../../subgraph/queries/manager';
import { getCommunityAmbassador, getCommunityUBIParams } from '../../../subgraph/queries/community';
import { getSearchInput } from '../../../utils/util';
import { getUserRoles } from '../../../subgraph/queries/user';
import { models } from '../../../database';
const { writeFile } = fs.promises;

export class CommunityDetailsService {
    private communityContentStorage = new CommunityContentStorage();

    public async getContract(communityId: number) {
        const community = await models.community.findOne({
            attributes: ['contractAddress', 'status'],
            where: {
                id: communityId
            }
        });

        if (!community) {
            return null;
        }

        if (community.status === 'pending') {
            const result = await models.ubiCommunityContract.findOne({
                where: {
                    communityId
                }
            });

            if (!result) {
                return null;
            }

            return result.toJSON() as UbiCommunityContract;
        }
        const subgraphResult = await getCommunityUBIParams(community.contractAddress!);
        if (!subgraphResult) return null;
        return {
            ...subgraphResult,
            communityId
        };
    }

    public async getAmbassador(communityId: number, userAddress?: string) {
        const ambassadorAttributes: string[] = ['address', 'firstName', 'lastName', 'avatarMediaPath'];
        if (userAddress) {
            const userRoles = await getUserRoles(userAddress);
            if (userRoles && userRoles.ambassador) {
                ambassadorAttributes.push('email', 'phone');
            }
        }

        const community = await models.community.findOne({
            attributes: ['ambassadorAddress', 'status', 'contractAddress'],
            where: {
                id: communityId
            }
        });

        if (!community || (community.status === 'pending' && !community.ambassadorAddress)) {
            return null;
        }

        let address = '';
        let active = true;
        if (community.status === 'valid') {
            const subgraphAmbassador = await getCommunityAmbassador(community.contractAddress!);
            if (!subgraphAmbassador) {
                return null;
            }
            address = getAddress(subgraphAmbassador.id);
            active = subgraphAmbassador.status === 0;
        } else {
            address = getAddress(community.ambassadorAddress!);
            active = true;
        }

        const ambassador = await models.appUser.findOne({
            attributes: ambassadorAttributes,
            where: { address }
        });

        return {
            ...ambassador?.toJSON(),
            address,
            active
        };
    }

    public async getMerchant(communityId: number) {
        try {
            const merchant = await models.merchantRegistry.findAll({
                include: [
                    {
                        attributes: [],
                        model: models.merchantCommunity,
                        as: 'merchantCommunity',
                        where: {
                            communityId
                        }
                    }
                ]
            });
            return merchant;
        } catch (error) {
            throw new BaseError('UNEXPECTED_ERROR', error);
        }
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
     *          firstName:
     *            type: string
     *            nullable: true
     *            description: Manager firstName or null
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
    public async listManagers(
        communityId: number,
        offset: number,
        limit: number,
        filter: {
            state?: number;
        },
        searchInput?: string,
        orderBy?: string,
        userAddress?: string
    ): Promise<{
        count: number;
        rows: {
            address: string;
            firstName?: string | null;
            lastName?: string | null;
            isDeleted: boolean;
            state?: number;
            added: number;
            removed: number;
            since: number;
            until?: number;
        }[];
    }> {
        const managerAttributes: string[] = ['address', 'firstName', 'lastName', 'avatarMediaPath'];
        if (userAddress) {
            const userRoles = await getUserRoles(userAddress);
            if (userRoles && userRoles.ambassador) {
                managerAttributes.push('email', 'phone');
            }
        }
        const community = (await models.community.findOne({
            where: {
                id: communityId
            }
        }))!;

        let addresses: string[] = [];
        let appUserFilter: WhereOptions | null = null;
        let managersSubgraph: ManagerSubgraph[] | null = null;
        let appUsers: AppUser[] = [];
        let count: number = 0;
        let orderKey: string | null = null;
        let orderDirection: string | null = null;
        let managerState: string | undefined = undefined;

        if (orderBy) {
            [orderKey, orderDirection] = orderBy.split(':');
            orderDirection = orderDirection?.toLowerCase() === 'desc' ? orderDirection : 'asc';
        }

        if (searchInput) {
            const input = getSearchInput(searchInput);
            if (input.address) {
                addresses.push(input.address);
            } else if (input.name) {
                appUserFilter = literal(`concat("firstName", ' ', "lastName") ILIKE '%${input.name}%'`);
            }
        }

        if (filter.state !== undefined) {
            managerState = `state: ${filter.state ? filter.state : 0}`;
        }

        if (community.status === 'pending') {
            if (!!addresses[0] && community.requestByAddress !== addresses[0]) {
                return {
                    count: 0,
                    rows: []
                };
            }
            const user = await models.appUser.findOne({
                attributes: managerAttributes,
                where: {
                    address: community.requestByAddress
                }
            });
            return {
                count: user ? 1 : 0,
                rows: [
                    {
                        ...(user?.toJSON() as AppUser),
                        isDeleted: false,
                        state: undefined,
                        added: 0,
                        removed: 0,
                        since: 0,
                        until: 0
                    }
                ]
            };
        }
        if (appUserFilter) {
            // filter by name
            appUsers = await models.appUser.findAll({
                attributes: managerAttributes,
                where: {
                    address: appUserFilter
                }
            });
            addresses = appUsers.map(user => user.address);
            if (addresses.length === 0) {
                return {
                    count: 0,
                    rows: []
                };
            }
            managersSubgraph = await getCommunityManagers(
                community.contractAddress!,
                managerState,
                addresses,
                orderKey ? `orderBy: ${orderKey}` : undefined,
                orderDirection ? `orderDirection: ${orderDirection}` : undefined
            );
            count = managersSubgraph.length;
            if (count > limit) {
                managersSubgraph = managersSubgraph.slice(offset, offset + limit);
            }
        } else if (addresses.length > 0) {
            // filter by address
            managersSubgraph = await getCommunityManagers(
                community.contractAddress!,
                managerState,
                addresses,
                orderKey ? `orderBy: ${orderKey}` : undefined,
                orderDirection ? `orderDirection: ${orderDirection}` : undefined
            );
            count = managersSubgraph.length;
            appUsers = await models.appUser.findAll({
                attributes: managerAttributes,
                where: {
                    address: {
                        [Op.in]: addresses
                    }
                }
            });
        } else {
            managersSubgraph = await getCommunityManagers(
                community.contractAddress!,
                managerState,
                undefined,
                orderKey ? `orderBy: ${orderKey}` : undefined,
                orderDirection ? `orderDirection: ${orderDirection}` : undefined,
                limit,
                offset
            );
            count = await countManagers(community.contractAddress!, filter.state);
            addresses = managersSubgraph.map(manager => ethers.utils.getAddress(manager.address));
            appUsers = await models.appUser.findAll({
                attributes: managerAttributes,
                where: {
                    address: {
                        [Op.in]: addresses
                    }
                }
            });
        }

        if (!managersSubgraph || !managersSubgraph.length) {
            count = 0;
        }

        const result = managersSubgraph.map(manager => {
            const user = appUsers.find(user => user.address === ethers.utils.getAddress(manager.address));
            return {
                address: ethers.utils.getAddress(manager.address),
                firstName: user?.firstName,
                lastName: user?.lastName,
                email: user?.email,
                phone: user?.phone,
                avatarMediaPath: user?.avatarMediaPath,
                added: manager.added,
                removed: manager.removed,
                since: manager.since,
                until: manager.until,
                isDeleted: !user || !!user!.deletedAt,
                state: manager.state
            };
        });

        return {
            count,
            rows: result
        };
    }

    public async listBeneficiaries(
        userAddress: string,
        communityId: number,
        offset: number,
        limit: number,
        filter: any,
        searchInput?: string,
        orderBy?: string,
        lastActivity_lt?: number
    ): Promise<{
        count: number;
        rows: any[];
    }> {
        const roles = await getUserRoles(userAddress);
        const community = await models.community.findOne({
            attributes: ['contractAddress'],
            where: {
                id: communityId
            }
        });
        if (!community || !community.contractAddress) {
            throw new BaseError('COMMUNITY_NOT_FOUND', 'Community not found');
        }

        if (roles.ambassador) {
            if (roles.ambassador.communities.indexOf(community.contractAddress.toLowerCase()) === -1) {
                throw new BaseError('NOT_ALLOWED', 'User should be an ambassador or manager');
            }
        } else if (roles.manager) {
            const contractAddress = ethers.utils.getAddress(roles.manager.community);
            if (community.contractAddress !== contractAddress) {
                throw new BaseError('NOT_ALLOWED', 'User should be an ambassador or manager');
            }
        } else {
            throw new BaseError('NOT_ALLOWED', 'User should be an ambassador or manager');
        }

        let orderKey: string | null = null;
        let orderDirection: string | null = null;
        let appUserFilter: WhereOptions | null = null;
        let beneficiaryFilter: WhereOptions | null = null;

        if (orderBy) {
            [orderKey, orderDirection] = orderBy.split(':');
            orderDirection = orderDirection?.toLowerCase() === 'desc' ? orderDirection : 'asc';
        }

        if (searchInput) {
            const input = getSearchInput(searchInput);
            if (input.address) {
                beneficiaryFilter = {
                    userAddress: input.address
                };
            } else if (input.name) {
                appUserFilter = literal(`concat("firstName", ' ', "lastName") ILIKE '%${input.name}%'`);
            }
        }

        if (filter.state !== undefined) {
            beneficiaryFilter = {
                ...beneficiaryFilter,
                state: filter.state || 0
            };
        }

        if (lastActivity_lt) {
            beneficiaryFilter = {
                ...beneficiaryFilter,
                lastActivity: {
                    [Op.lt]: lastActivity_lt
                }
            };
        }

        const { rows, count } = await models.subgraphUBIBeneficiary.findAndCountAll({
            where: {
                communityAddress: community.contractAddress,
                ...beneficiaryFilter
            },
            include: [
                {
                    model: models.appUser,
                    as: 'user',
                    required: !!appUserFilter,
                    where: appUserFilter || {}
                }
            ],
            order: [[orderKey || 'since', orderDirection || 'desc']],
            limit,
            offset
        });

        return {
            count,
            rows: rows.map(row => ({
                address: row.userAddress,
                firstName: row.user?.firstName,
                lastName: row.user?.lastName,
                avatarMediaPath: row.user?.avatarMediaPath,
                since: row.since || 0,
                claimed: row.claimed,
                blocked: row.state === 2,
                isDeleted: !row.user || !!row.user!.deletedAt,
                state: row.state
            }))
        };
    }

    public async findById(
        id: number,
        userAddress?: string,
        query?: {
            state?: string | string[];
        }
    ): Promise<CommunityAttributes> {
        return this._findCommunityBy({ id }, userAddress, query?.state);
    }

    public async findByContractAddress(
        contractAddress: string,
        userAddress?: string,
        query?: {
            state?: string | string[];
        }
    ): Promise<CommunityAttributes> {
        return this._findCommunityBy({ contractAddress }, userAddress, query?.state);
    }

    private async _findCommunityBy(
        where: WhereOptions<CommunityAttributes>,
        userAddress?: string,
        returnState?: string | string[]
    ): Promise<CommunityAttributes> {
        const include: Includeable[] = [];

        if (!!returnState && (returnState === 'base' || returnState.indexOf('base') !== -1)) {
            include.push({
                model: models.subgraphUBICommunity,
                as: 'state'
            });
        }

        if (!!returnState && (returnState === 'ubi' || returnState.indexOf('ubi') !== -1)) {
            include.push({
                attributes: ['ubiRate', 'estimatedDuration'],
                model: models.ubiCommunityDailyMetrics,
                as: 'metrics',
                order: [['date', 'desc']],
                limit: 1
            });
        }

        const community = await models.community.findOne({
            where,
            include
        });
        if (community === null) {
            throw new BaseError('COMMUNITY_NOT_FOUND', 'Not found community ' + where);
        }

        let showEmail = false;
        if (userAddress) {
            // verify if user is the community creator, ambassador or manager
            if (
                (community.status === 'pending' && community.requestByAddress === userAddress) ||
                community.ambassadorAddress === userAddress
            ) {
                showEmail = true;
            } else {
                const userRole = await getUserRoles(userAddress);
                if (userRole.manager) {
                    showEmail = ethers.utils.getAddress(userRole.manager.community) === community.contractAddress;
                }
            }
        }

        const result: CommunityAttributes = community.toJSON();
        if (result.metrics && result.metrics[0]) {
            result.state = {
                ...result.state!,
                ...result.metrics[0]
            };
        }

        return {
            ...community.toJSON(),
            email: showEmail ? community.email : ''
        };
    }

    public async count(
        groupBy: string,
        status?: string,
        excludeCountry?: string,
        ambassadorAddress?: string
    ): Promise<any[]> {
        let groupName = '';
        switch (groupBy) {
            case 'country':
                groupName = 'country';
                break;
            case 'review':
                groupName = 'review';
                break;
            case 'reviewByCountry':
                groupName = 'reviewByCountry';
                break;
        }

        let where: WhereOptions = {
            visibility: 'public'
        };
        if (groupName.length === 0) {
            throw new BaseError('INVALID_GROUP', 'invalid group');
        }
        if (status) {
            where = {
                ...where,
                status
            };
        }
        if (ambassadorAddress) {
            where = {
                ...where,
                ambassadorAddress
            };
        }

        if (excludeCountry) {
            const countries = excludeCountry.split(';');
            where = {
                ...where,
                country: {
                    [Op.notIn]: countries
                }
            };
        }

        if (groupName === 'reviewByCountry') {
            const result = (await models.community.findAll({
                attributes: [
                    'country',
                    [fn('count', col('country')), 'count'],
                    [fn('count', literal("CASE WHEN review = 'pending' THEN 1 END")), 'pending'],
                    [fn('count', literal("CASE WHEN review = 'claimed' THEN 1 END")), 'claimed'],
                    [fn('count', literal("CASE WHEN review = 'declined' THEN 1 END")), 'declined'],
                    [fn('count', literal("CASE WHEN review = 'accepted' THEN 1 END")), 'accepted']
                ],
                where,
                group: ['country']
            })) as any;

            return result;
        }

        const result = (await models.community.findAll({
            attributes: [groupName, [fn('count', col(groupName)), 'count']],
            where,
            group: [groupName],
            raw: true
        })) as any;

        return result;
    }

    public async getPresignedUrlMedia(mime: string) {
        return this.communityContentStorage.getPresignedUrlPutObject(mime);
    }

    public async getPromoter(communityId: number) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const result = await models.ubiPromoter.findOne({
            include: [
                {
                    model: models.community,
                    as: 'community',
                    required: true,
                    attributes: [],
                    where: {
                        id: communityId
                    }
                },
                {
                    model: models.ubiPromoterSocialMedia,
                    as: 'socialMedia'
                }
            ]
        });

        if (!result) return null;

        return result.toJSON();
    }

    public async addBeneficiaries(file: Express.Multer.File, address: string) {
        const role = await getUserRoles(address);
        const contractAddress = role.manager?.community;

        if (!contractAddress) {
            throw new BaseError('NOT_MANAGER', 'user not a manager');
        }

        const failedAddress: any[] = [];
        const addressesToAdd: string[] = [];
        const usersToCreate: any[] = [];

        // convert csv to json
        const string = file.buffer.toString().replace(/;/g, ',');
        const beneficiaries = await csv({ ignoreEmpty: true }).fromString(string);

        // check valid address
        for (let i = 0; i < beneficiaries.length; i++) {
            const beneficiary = beneficiaries[i];
            try {
                const address = getAddress(beneficiary.address);
                const user = await models.appUser.findOne({
                    where: { address }
                });

                if (!user) {
                    const validate = this.validateUserRegistry(beneficiary);
                    if (validate.valid) {
                        usersToCreate.push({
                            address,
                            phone: beneficiary.phone,
                            firstName: beneficiary.firstName,
                            lastName: beneficiary.lastName,
                            age: beneficiary.yearOfBirth,
                            gender: beneficiary.gender
                        });
                    } else {
                        failedAddress.push({
                            address: beneficiary.address,
                            error: validate.error
                        });
                    }
                } else {
                    addressesToAdd.push(address);
                }
            } catch (error) {
                failedAddress.push({
                    address: beneficiary.address,
                    error: 'invalid address'
                });
            }
        }

        // create accounts
        if (usersToCreate.length > 0) {
            const users = await models.appUser.bulkCreate(usersToCreate);
            users.forEach(user => {
                addressesToAdd.push(user.address);
            });
        }

        // check if it is already a beneficiary
        const existingBeneficiaries = await this.verifyBeneficiaries(addressesToAdd);
        existingBeneficiaries.forEach(address => {
            addressesToAdd.splice(addressesToAdd.indexOf(address), 1);
        });

        // add beneficiaries

        if (failedAddress.length > 0) {
            // Write data into csv file named failed.csv
            const fields = ['address', 'error'];
            const data = json2csv.parse(failedAddress, { fields });
            const filePath = './public/';
            const fileName = 'failed.csv';
            await writeFile(filePath + fileName, data);
            setTimeout(async () => {
                // delete file after 30 seconds
                await fs.promises.unlink(filePath + fileName);
            }, 30000);

            return {
                success: false,
                filePath,
                fileName
            };
        }
        return {
            success: true
        };
    }

    private async verifyBeneficiaries(addresses: string[]) {
        const beneficiaries: string[] = [];
        const promises = addresses.map(address => getUserRoles(address));
        const results = await Promise.all(promises);

        results.forEach(result => {
            if (result.beneficiary) {
                beneficiaries.push(getAddress(result.beneficiary.address));
            }
        });

        return beneficiaries;
    }

    public async getCampaign(communityId: number) {
        const result = await models.ubiCommunityCampaign.findOne({
            where: {
                communityId
            }
        });
        return result !== null ? (result.toJSON() as UbiCommunityCampaign) : null;
    }

    private validateUserRegistry(user: any) {
        // validate firstName and lastName
        if (!user.firstName || !user.lastName) {
            return {
                valid: false,
                error: 'invalid firstName/lastName'
            };
        }

        // validate yearOfBirth
        const year = parseInt(user.yearOfBirth, 10);
        if (!year) {
            return {
                valid: false,
                error: 'invalid yearOfBirth'
            };
        }

        // validate phone
        if (!user.phone || typeof user.phone !== 'string') {
            return {
                valid: false,
                error: 'invalid phone'
            };
        }

        // validate gender
        if (!user.gender || ['m', 'f', 'u'].indexOf(user.gender.toLowerCase()) === -1) {
            return {
                valid: false,
                error: 'invalid gender'
            };
        }

        return {
            valid: true
        };
    }
}
