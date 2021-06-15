import { ExchangeRatesAttributes } from '@models/app/exchangeRates';
import redis from 'redis';
import { promisify } from 'util';

import config from '../../config';
import { models } from '../../database';

// const setRedis = promisify(redisClient.set);

export default class ExchangeRatesService {
    public static exchangeRates = models.exchangeRates;
    private static redisKey = 'exchangeRates';

    public static async get(): Promise<ExchangeRatesAttributes[]> {
        if (process.env.NODE_ENV !== 'test') {
            const redisClient = redis.createClient({
                url: config.redis,
            });
            const getRedis = promisify(redisClient.get).bind(redisClient);
            const rates = await getRedis(this.redisKey);
            if (rates === null) {
                const currentRates = await this.exchangeRates.findAll({
                    attributes: ['currency', 'rate'],
                    raw: true,
                });
                redisClient.set(
                    this.redisKey,
                    JSON.stringify(currentRates),
                    'EX',
                    21600 // 6 hours in seconds
                );

                return currentRates;
            }
            return JSON.parse(rates);
        }
        return this.exchangeRates.findAll({
            attributes: ['currency', 'rate'],
            raw: true,
        });
    }
}
