import distance from '@turf/distance';
import { point } from '@turf/helpers';
import { Op, WhereOptions, literal } from 'sequelize';

import { models } from '../../database';
import { ExchangeRegistry } from '../../database/models/exchange/exchangeRegistry';
import { MerchantRegistry } from '../../database/models/merchant/merchantRegistry';

export default class CashoutProviderService {
    public async get(query: {
        country?: string;
        lat?: string;
        lng?: string;
        distance?: string;
    }) {
        let merchants: MerchantRegistry[] | null = null;

        if (!query || (!query.country && !query.lat && !query.lng)) {
            merchants = await models.merchantRegistry.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']],
            });
            const exchanges = await models.exchangeRegistry.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']],
            });

            return {
                merchants,
                exchanges,
            };
        }

        let exchangesWhere: WhereOptions<ExchangeRegistry> = {
            global: true,
        };

        if (query.country) {
            exchangesWhere = {
                [Op.or]: [
                    literal(`'${query.country}' = ANY(countries)`),
                    { global: true },
                ],
            };

            merchants = await models.merchantRegistry.findAll({
                where: {
                    country: query.country,
                },
            });
        }

        const exchanges = await models.exchangeRegistry.findAll({
            where: exchangesWhere,
            order: ['global'],
        });

        if (query.lat && query.lng) {
            const userLocation = point([
                parseInt(query.lng, 10),
                parseInt(query.lat, 10),
            ]);

            if (!merchants) {
                merchants = await models.merchantRegistry.findAll();
            }

            merchants = merchants
                .map((merchant) => {
                    const merchantLocation = point([
                        merchant.gps.longitude,
                        merchant.gps.latitude,
                    ]);
                    return {
                        ...merchant,
                        distance: distance(userLocation, merchantLocation),
                    };
                })
                .filter(
                    (merchant) =>
                        merchant.distance <
                        parseInt(query.distance || '100', 10)
                )
                .sort((x, y) => {
                    if (x.distance > y.distance) {
                        return 1;
                    }
                    if (x.distance < y.distance) {
                        return -1;
                    }
                    return 0;
                });
        }

        return {
            merchants,
            exchanges,
        };
    }
}
