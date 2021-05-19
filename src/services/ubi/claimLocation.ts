import axios from 'axios';
import config from 'config/index';
import { Op } from 'sequelize';
import countriesJSON from 'utils/countries.json';

import { models } from '../../database';

const countries: {
    [key: string]: {
        name: string;
        native: string;
        phone: string;
        currency: string;
        languages: string[];
        emoji: string;
    };
} = countriesJSON;
export default class ClaimLocationService {
    public static claimLocation = models.claimLocation;
    public static community = models.community;

    public static async add(
        communityId: string,
        gps: {
            latitude: number;
            longitude: number;
        }
    ): Promise<void> {
        if (config.apiEnvironment !== 'production') {
            await this.claimLocation.create({
                communityId,
                gps,
            });
            return;
        }
        const community = await this.community.findOne({
            attributes: ['country'],
            where: { publicId: communityId },
        });
        if (community === null) {
            throw new Error('no community found!');
        }
        const query = await axios.get(
            `${config.positionStackApiBaseUrl}?access_key=${config.positionStackApiKey}&query=${gps.latitude},${gps.longitude}`
        );
        // country code are 3 chars, we use 2 chars
        if (countries[community.country].name === query.data.data[0].country) {
            await this.claimLocation.create({
                communityId,
                gps,
            });
        }
    }

    public static async getAll(): Promise<
        {
            latitude: number;
            longitude: number;
        }[]
    > {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // a month ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        return this.claimLocation.findAll({
            attributes: ['gps'],
            where: {
                createdAt: {
                    [Op.gte]: aMonthAgo,
                },
            },
            raw: true,
        }) as any;
    }
}
