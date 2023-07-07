import { Op, WhereOptions, literal } from 'sequelize';
import { point } from '@turf/helpers';
import distance from '@turf/distance';

import { ExchangeRegistry } from '../../database/models/exchange/exchangeRegistry';
import { MerchantRegistry, MerchantRegistryModel } from '../../database/models/merchant/merchantRegistry';
import { models } from '../../database';

export default class CashoutProviderService {
    public async get(query: { country?: string; lat?: string; lng?: string; distance?: string }) {
        let rawMerchants: MerchantRegistryModel[] | null = null;
        let merchants: MerchantRegistry[] | null = null;

        if (!query || (!query.country && !query.lat && !query.lng)) {
            rawMerchants = await models.merchantRegistry.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']]
            });
            const exchanges = await models.exchangeRegistry.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']]
            });

            return {
                merchants: rawMerchants.map(merchant => merchant.toJSON()),
                exchanges: exchanges.map(exchange => exchange.toJSON())
            };
        }

        let exchangesWhere: WhereOptions<ExchangeRegistry> = {
            global: true
        };

        if (query.country) {
            exchangesWhere = {
                [Op.or]: [literal(`'${query.country}' = ANY(countries)`), { global: true }]
            };

            rawMerchants = await models.merchantRegistry.findAll({
                where: {
                    country: query.country
                }
            });
            if (!query.lat && !query.lng) {
                merchants = rawMerchants.map(merchant => merchant.toJSON());
            }
        }

        const exchanges = await models.exchangeRegistry.findAll({
            where: exchangesWhere,
            order: ['global']
        });

        if (query.lat && query.lng) {
            const userLocation = point([parseFloat(query.lng), parseFloat(query.lat)]);

            if (!rawMerchants) {
                rawMerchants = await models.merchantRegistry.findAll();
            }

            merchants = rawMerchants
                .map(merchant => {
                    const merchantLocation = point([merchant.gps.longitude, merchant.gps.latitude]);
                    return {
                        ...merchant.toJSON(),
                        distance: distance(userLocation, merchantLocation)
                    };
                })
                .filter(merchant => merchant.distance < parseFloat(query.distance || '100'))
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
            exchanges
        };
    }
}
