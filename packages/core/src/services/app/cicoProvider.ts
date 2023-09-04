import { Op, WhereOptions } from 'sequelize';

import { AppCICOProviderModel, CICOProviderRegistry } from '../../database/models/cico/providers';
import { models, sequelize } from '../../database';

export default class CICOProviderService {
    public async get(query: { country?: string; lat?: string; lng?: string; distance?: string }) {
        let rawMerchants: AppCICOProviderModel[] | null = null;
        let rawIndividuals: AppCICOProviderModel[] | null = null;
        let merchants: CICOProviderRegistry[] | null = null;

        // when no query is provided
        if (!query || (!query.country && !query.lat && !query.lng)) {
            rawMerchants = await models.appCICOProvider.findAll({
                where: {
                    type: 1
                },
                limit: 5,
                order: [['createdAt', 'DESC']]
            });
            rawIndividuals = await models.appCICOProvider.findAll({
                where: {
                    type: 2
                },
                limit: 5,
                order: [['createdAt', 'DESC']]
            });
            const exchanges = await models.appCICOProvider.findAll({
                where: {
                    type: 0,
                    countries: {
                        [Op.contains]: ['all']
                    }
                },
                limit: 5,
                order: [['createdAt', 'DESC']]
            });

            return {
                merchants: rawMerchants.map(m => m.toJSON()),
                individuals: rawIndividuals.map(i => i.toJSON()),
                exchanges: exchanges.map(e => e.toJSON())
            };
        }

        let exchangesWhere: WhereOptions<AppCICOProviderModel> = {
            countries: {
                [Op.contains]: ['all']
            }
        };

        // when country is provided
        if (query.country) {
            exchangesWhere = {
                countries: {
                    [Op.contains]: [query.country, 'all']
                }
            };

            rawMerchants = await models.appCICOProvider.findAll({
                where: {
                    countries: {
                        [Op.contains]: [query.country]
                    }
                }
            });
            if (!query.lat && !query.lng) {
                merchants = rawMerchants.map(merchant => merchant.toJSON());
            }
        }

        const exchanges = await models.appCICOProvider.findAll({
            where: exchangesWhere,
            order: ['countries']
        });

        // when lat and lng are provided
        if (query.lat && query.lng) {
            if (!rawMerchants) {
                rawMerchants = await models.appCICOProvider.findAll({
                    attributes: [
                        [
                            sequelize.literal(
                                '3959 * acos(cos(radians(' +
                                    parseFloat(query.lat) +
                                    ")) * cos(radians(details->'gps'->>'latitude')) * cos(radians(" +
                                    parseFloat(query.lng) +
                                    ") - radians(details->'gps'->>'longitude')) + sin(radians(" +
                                    parseFloat(query.lat) +
                                    ")) * sin(radians(details->'gps'->>'latitude')))"
                            ),
                            'distance'
                        ],
                        'id',
                        'name',
                        'description',
                        'countries',
                        'isCashin',
                        'isCashout',
                        'details'
                    ],
                    having: sequelize.literal('distance < 20'),
                    order: sequelize.literal('distance ASC'),
                    where: {
                        type: 1
                    }
                });
            }

            merchants = rawMerchants.map(merchant => merchant.toJSON());
        }

        rawIndividuals = await models.appCICOProvider.findAll({
            where: {
                type: 2
            },
            order: [['createdAt', 'DESC']]
        });

        return {
            exchanges,
            merchants,
            individuals: rawIndividuals.map(i => i.toJSON())
        };
    }
}
