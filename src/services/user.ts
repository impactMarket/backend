import { User } from '../db/models/user';
import { generateAccessToken } from '../middlewares';
import { ICommunityInfo, IUserWelcomeAuth, IUserWelcome } from '../types';
import ExchangeRatesService from './exchangeRates';
import TransactionsService from './transactions';
import { Transactions } from '../db/models/transactions';
import CommunityService from './community';
import Logger from '../loaders/logger';


export default class UserService {
    public static async auth(
        address: string,
        language: string,
        pushNotificationsToken: string,
    ): Promise<IUserWelcomeAuth | undefined> {
        try {
            const token = generateAccessToken(address);
            const user = await User.findOne({ where: { address } });
            if (user === null) {
                await User.create({
                    address,
                    avatar: Math.floor(Math.random() * 8) + 1,
                    language,
                    pushNotificationsToken,
                });
            } else {
                await User.update(
                    { pushNotificationsToken },
                    { where: { address } },
                );
            }
            const welcomeUser = await UserService.welcome(address);
            if (welcomeUser === undefined) {
                return undefined;
            }
            return {
                token,
                ...welcomeUser
            };
        } catch (e) {
            Logger.warning(address, e.message);
            return undefined;
        }
    }

    public static async welcome(
        address: string
    ): Promise<IUserWelcome | undefined> {
        const user = await User.findOne({ where: { address } });
        if (user === null) {
            return undefined;
        }
        let community: Transactions | undefined | null;
        let communityManager: Transactions | undefined | null;
        let communityPrivate: Transactions | undefined | null;
        let communityInfo: ICommunityInfo | null;
        let isBeneficiary = false;
        let isManager = false;
        community = await TransactionsService.findComunityToBeneficicary(address);
        if (community !== undefined) {
            isBeneficiary = true;
        }
        communityManager = await TransactionsService.findComunityToManager(address);
        if (communityManager === null) {
            // is there any change this guy is in a private community?
            communityPrivate = await TransactionsService.findUserPrivateCommunity(address);
            if (communityPrivate === null) {
                communityPrivate = undefined;
            } else {
                if (communityPrivate.event === 'ManagerAdded') {
                    isManager = true;
                } else {
                    isBeneficiary = true;
                }
            }
        } else {
            isManager = true;
        }
        if (community !== undefined) {
            communityInfo = await CommunityService.findByContractAddress(community.contractAddress);
        } else if (communityManager !== null && communityManager !== undefined) {
            communityInfo = await CommunityService.findByContractAddress(communityManager.contractAddress);
        } else if (communityPrivate !== null && communityPrivate !== undefined) {
            communityInfo = await CommunityService.findByContractAddress(communityPrivate.contractAddress);
        }
        return {
            user: user as any,
            exchangeRates: await ExchangeRatesService.get(),
            community: (community  || communityManager || communityPrivate) ? communityInfo! : undefined,
            isBeneficiary,
            isManager,
        };
    }

    public static async setUsername(
        address: string,
        username: string
    ): Promise<boolean> {
        const updated = await User.update(
            { username },
            { returning: true, where: { address } },
        );
        return updated[0] > 0;
    }

    public static async setCurrency(
        address: string,
        currency: string
    ): Promise<boolean> {
        const updated = await User.update(
            { currency },
            { returning: true, where: { address } },
        );
        return updated[0] > 0;
    }

    public static async setPushNotificationsToken(
        address: string,
        pushNotificationToken: string
    ): Promise<boolean> {
        const updated = await User.update(
            { pushNotificationToken },
            { returning: true, where: { address } },
        );
        return updated[0] > 0;
    }

    public static async setLanguage(
        address: string,
        language: string
    ): Promise<boolean> {
        const updated = await User.update(
            { language },
            { returning: true, where: { address } },
        );
        return updated[0] > 0;
    }

    public static async get(address: string): Promise<User | null> {
        return User.findOne({ where: { address } });
    }

    public static async mappedNames(): Promise<Map<string, string>> {
        const mapped = new Map<string, string>();
        const query = await User.findAll();
        for (let index = 0; index < query.length; index++) {
            const element = query[index];
            mapped.set(element.address, element.username);
        }
        return mapped;
    }
}
