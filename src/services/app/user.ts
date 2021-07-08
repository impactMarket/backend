import {
    AppAnonymousReport,
    AppAnonymousReportCreation,
} from '@interfaces/app/appAnonymousReport';
import { User, UserCreationAttributes } from '@interfaces/app/user';
import { CommunityAttributes } from '@models/ubi/community';
import { ProfileContentStorage } from '@services/storage';
import { Logger } from '@utils/logger';
import { Op } from 'sequelize';

import { generateAccessToken } from '../../api/middlewares';
import { models, sequelize } from '../../database';
import { IUserHello, IUserAuth } from '../../types/endpoints';
import CommunityService from '../ubi/community';
import ExchangeRatesService from './exchangeRates';

export default class UserService {
    public static sequelize = sequelize;
    public static anonymousReport = models.anonymousReport;
    public static user = models.user;
    public static beneficiary = models.beneficiary;
    public static manager = models.manager;
    public static appUserTrust = models.appUserTrust;
    public static appUserThroughTrust = models.appUserThroughTrust;
    public static appMediaContent = models.appMediaContent;
    public static appMediaThumbnail = models.appMediaThumbnail;

    private static profileContentStorage = new ProfileContentStorage();

    public static async authenticate(
        user: UserCreationAttributes
    ): Promise<IUserAuth> {
        try {
            // generate access token for future interactions that require authentication
            const token = generateAccessToken(user.address);
            const exists = await this.exists(user.address);
            let userFromRegistry: User;
            if (!exists) {
                // create new user, including their phone number information
                userFromRegistry = (
                    await this.user.create(user, {
                        include: [
                            {
                                model: this.appUserTrust,
                                as: 'trust',
                            },
                        ],
                    })
                ).toJSON() as User;
            } else {
                if (user.pushNotificationToken) {
                    this.user.update(
                        { pushNotificationToken: user.pushNotificationToken },
                        { where: { address: user.address } }
                    );
                }
                // it's not null at this point
                userFromRegistry = (await this.user.findOne({
                    include: [
                        {
                            model: this.appMediaContent,
                            as: 'avatar',
                            required: false,
                            include: [
                                {
                                    model: this.appMediaThumbnail,
                                    as: 'thumbnails',
                                    separate: true,
                                },
                            ],
                        },
                        {
                            model: this.appUserTrust,
                            as: 'trust',
                        },
                    ],
                    where: { address: user.address },
                }))!.toJSON() as User;
            }
            const userHello = await this.loadUser(userFromRegistry);
            return {
                token,
                user: userFromRegistry,
                ...userHello,
            };
        } catch (e) {
            Logger.warn(`Error while auth user ${user.address} ${e}`);
            throw new Error(e);
        }
    }

    public static async welcome(
        address: string,
        pushNotificationToken?: string
    ): Promise<IUserHello> {
        let user: User;
        if (pushNotificationToken) {
            const updated = await this.user.update(
                { pushNotificationToken },
                { where: { address }, returning: true }
            );
            if (updated.length > 0) {
                user = updated[1][0].toJSON() as User;
            } else {
                user = (await this.user.findOne({
                    where: { address },
                }))!.toJSON() as User;
            }
        } else {
            user = (await this.user.findOne({
                where: { address },
            }))!.toJSON() as User;
        }
        return UserService.loadUser(user);
    }

    /**
     * @deprecated
     */
    public static async hello(
        address: string,
        phone?: string
    ): Promise<IUserHello> {
        const user = await this.user.findOne({
            include: [
                {
                    model: this.appUserTrust,
                    as: 'trust',
                },
            ],
            where: { address },
        });
        if (user === null) {
            throw new Error(address + ' user not found!');
        }
        if (phone) {
            const uu = user.toJSON() as User;
            const userTrustId =
                uu.trust && uu.trust.length > 0 ? uu.trust[0].id : undefined;
            if (userTrustId === undefined) {
                try {
                    await this.sequelize.transaction(async (t) => {
                        const userTrust = await this.appUserTrust.create(
                            {
                                phone,
                            },
                            { transaction: t }
                        );
                        await this.appUserThroughTrust.create(
                            {
                                userAddress: address,
                                appUserTrustId: userTrust.id,
                            },
                            { transaction: t }
                        );
                    });
                } catch (e) {
                    Logger.error(
                        'creating trust profile to existing account ' + e
                    );
                }
            }
        }
        return UserService.loadUser(user);
    }

    public static async getPresignedUrlMedia(mime: string): Promise<{
        uploadURL: string;
        filename: string;
    }> {
        return this.profileContentStorage.getPresignedUrlPutObject(mime);
    }

    public static async updateAvatar(
        address: string,
        mediaId: number
    ): Promise<boolean> {
        const updated = await this.user.update(
            { avatarMediaId: mediaId },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setUsername(
        address: string,
        username: string
    ): Promise<boolean> {
        const updated = await this.user.update(
            { username },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setCurrency(
        address: string,
        currency: string
    ): Promise<boolean> {
        const updated = await this.user.update(
            { currency },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setPushNotificationsToken(
        address: string,
        pushNotificationToken: string
    ): Promise<boolean> {
        const updated = await this.user.update(
            { pushNotificationToken },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setLanguage(
        address: string,
        language: string
    ): Promise<boolean> {
        const updated = await this.user.update(
            { language },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setGender(
        address: string,
        gender: string
    ): Promise<boolean> {
        const updated = await this.user.update(
            { gender },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setYear(
        address: string,
        year: number | null
    ): Promise<boolean> {
        const updated = await this.user.update(
            { year },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setChildren(
        address: string,
        children: number | null
    ): Promise<boolean> {
        const updated = await this.user.update(
            { children },
            { returning: true, where: { address } }
        );
        return updated[0] > 0;
    }

    public static async setProfilePicture(
        address: string,
        file: Express.Multer.File
    ) {
        const user = await this.user.findOne({ where: { address } });
        const media = await this.profileContentStorage.uploadContent(file);
        await this.user.update(
            { avatarMediaId: media.id },
            { returning: true, where: { address } }
        );
        if (user!.avatarMediaId !== null && user!.avatarMediaId !== media.id) {
            await this.profileContentStorage.deleteContent(user!.avatarMediaId);
        }
        return media;
    }

    public static async get(address: string): Promise<User | null> {
        return this.user.findOne({ where: { address }, raw: true });
    }

    public static report(
        message: string,
        communityId: string | undefined,
        category: 'general' | 'potential-fraud' | undefined
    ): Promise<AppAnonymousReport> {
        let newReport: AppAnonymousReportCreation = { message };
        if (communityId) {
            newReport = {
                ...newReport,
                communityId,
            };
        }
        if (category) {
            newReport = {
                ...newReport,
                category,
            };
        }
        return this.anonymousReport.create(newReport);
    }

    public static async exists(address: string): Promise<boolean> {
        const exists = await this.user.findOne({
            attributes: ['address'],
            where: { address },
            raw: true,
        });
        return exists !== null;
    }

    public static async getAllAddresses(): Promise<string[]> {
        return (
            await this.user.findAll({ attributes: ['address'], raw: true })
        ).map((u) => u.address);
    }

    public static async getPushTokensFromAddresses(
        addresses: string[]
    ): Promise<string[]> {
        const users = await this.user.findAll({
            attributes: ['pushNotificationToken'],
            where: { address: { [Op.in]: addresses } },
            raw: true,
        });
        return users
            .filter((u) => u.pushNotificationToken !== null)
            .map((u) => u.pushNotificationToken!);
    }

    /**
     * TODO: improve
     */
    private static async loadUser(user: User): Promise<IUserHello> {
        // const user = await this.user.findOne({
        //     include: [
        //         {
        //             model: this.appUserTrust,
        //             as: 'trust',
        //         },
        //     ],
        //     where: { address: userAddress },
        // });
        // if (user === null) {
        //     throw new Error('User is null?');
        // }
        // const fUser = user.toJSON() as User;
        const beneficiary = await this.beneficiary.findOne({
            where: { active: true, address: user.address },
        });
        const manager = await this.manager.findOne({
            where: { active: true, address: user.address },
        });

        // get user community
        // TODO: deprecated in mobile-app@1.1.5
        let community: CommunityAttributes | null = null;
        let managerInPendingCommunity = false;
        // reusable method
        const getCommunity = async (publicId: string) => {
            const community = await CommunityService.getCommunityOnlyByPublicId(
                publicId
            );
            if (community !== null) {
                return CommunityService.findById(community.id);
            }
            return null;
        };
        if (beneficiary) {
            community = await getCommunity(beneficiary.communityId);
        } else if (manager) {
            community = await getCommunity(manager.communityId);
        } else {
            const communityId = await CommunityService.findByFirstManager(
                user.address
            );
            if (communityId) {
                community = await getCommunity(communityId);
                managerInPendingCommunity = true;
            }
        }
        // until here

        return {
            isBeneficiary: beneficiary !== null,
            isManager: manager !== null || managerInPendingCommunity,
            blocked: beneficiary !== null ? beneficiary.blocked : false,
            verifiedPN:
                user.trust && user.trust.length !== 0
                    ? user.trust[0].verifiedPhoneNumber
                    : undefined, // TODO: deprecated in mobile-app@1.1.5
            suspect: user.suspect,
            rates: await ExchangeRatesService.get(), // TODO: deprecated in mobile-app@1.1.5
            community: community ? community : undefined, // TODO: deprecated in mobile-app@1.1.5
            communityId: community ? community.id : undefined,
        };
    }
}
