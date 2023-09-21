import { Op, QueryTypes, WhereOptions } from 'sequelize';

import { AppCICOProviderModel, CICOProviderRegistry } from '../../database/models/cico/providers';
import { models, sequelize } from '../../database';

enum CICOProviderType {
    EXCHANGE = 0,
    MERCHANT = 1,
    INDIVIDUAL = 2
}

export default class CICOProviderService {
    public async get(query: { country?: string; lat?: number; lng?: number; distance?: number }) {
        // when no query is provided
        if (!query.country && !query.lat && !query.lng && !query.distance) {
            console.log('default query');
            const { rows: merchantsRows, count: merchantsCount } = await models.appCICOProvider.findAndCountAll({
                where: {
                    type: CICOProviderType.MERCHANT
                },
                limit: 5,
                order: [['updatedAt', 'DESC']]
            });
            const { rows: individualsRows, count: individualsCount } = await models.appCICOProvider.findAndCountAll({
                where: {
                    type: CICOProviderType.INDIVIDUAL
                },
                limit: 5,
                order: [['updatedAt', 'DESC']]
            });
            const { rows: exchangesRows, count: exchangesCount } = await models.appCICOProvider.findAndCountAll({
                where: {
                    type: CICOProviderType.EXCHANGE,
                    countries: {
                        [Op.contains]: ['11']
                    }
                },
                limit: 5,
                order: [['updatedAt', 'DESC']]
            });

            return {
                merchants: {
                    rows: merchantsRows.map(m => m.toJSON()),
                    count: merchantsCount
                },
                individuals: {
                    rows: individualsRows.map(i => i.toJSON()),
                    count: individualsCount
                },
                exchanges: {
                    rows: exchangesRows.map(e => e.toJSON()),
                    count: exchangesCount
                }
            };
        }

        let merchantsRows: CICOProviderRegistry[] = [];
        let merchantsCount: number = 0;
        let individualsRows: AppCICOProviderModel[] = [];
        let individualsCount: number = 0;

        let exchangesWhere: WhereOptions<AppCICOProviderModel> = {
            type: CICOProviderType.EXCHANGE,
            countries: {
                [Op.contains]: ['11']
            }
        };

        // when country is provided
        if (query.country) {
            exchangesWhere = {
                type: CICOProviderType.EXCHANGE,
                countries: {
                    [Op.or]: [{ [Op.contains]: [query.country] }, { [Op.contains]: ['11'] }]
                }
            };

            if (!query.lat && !query.lng) {
                const merchantsResponse = await models.appCICOProvider.findAndCountAll({
                    where: {
                        type: CICOProviderType.MERCHANT,
                        countries: {
                            [Op.contains]: [query.country]
                        }
                    }
                });
                merchantsRows = merchantsResponse.rows.map(m => m.toJSON());
                merchantsCount = merchantsResponse.count;
            }

            const individualsResponse = await models.appCICOProvider.findAndCountAll({
                where: {
                    type: CICOProviderType.INDIVIDUAL,
                    countries: {
                        [Op.contains]: [query.country]
                    }
                },
                order: [['updatedAt', 'DESC']]
            });
            individualsRows = individualsResponse.rows;
            individualsCount = individualsResponse.count;
        }

        const { rows: exchangesRows, count: exchangesCount } = await models.appCICOProvider.findAndCountAll({
            where: exchangesWhere,
            order: ['countries']
        });

        // when lat and lng are provided
        if (query.lat && query.lng) {
            // it needs to be this way, so we can filter by distance
            // if we didn't need that distance filter, we could use sequelize regular query
            const rawResponse = await sequelize.query(
                `
                SELECT
                    a.distance,
                    app_cico_provider.*
                FROM
                    (SELECT id, (
                        6371 *
                        acos(cos(radians(${query.lat})) *
                        cos(radians(cast(details->'gps'->>'latitude' as float))) *
                        cos(radians(${query.lng}) -
                            radians(cast(details->'gps'->>'longitude' as float))) +
                        sin(radians(${query.lat})) *
                        sin(radians(cast(details->'gps'->>'latitude' as float))))
                    ) AS "distance" from app_cico_provider) as a,
                    app_cico_provider
                WHERE a."distance" < ${query.distance || 100}
                    and a.id = app_cico_provider.id
                    and type = ${CICOProviderType.MERCHANT}`.replaceAll(/\n {2,}/g, ' '),
                { type: QueryTypes.SELECT }
            );
            merchantsRows = rawResponse as unknown[] as CICOProviderRegistry[];
            merchantsCount = rawResponse.length;
        }

        return {
            exchanges: {
                rows: exchangesRows.map(e => e.toJSON()),
                count: exchangesCount
            },
            merchants: {
                rows: merchantsRows,
                count: merchantsCount
            },
            individuals: {
                rows: individualsRows.map(i => i.toJSON()),
                count: individualsCount
            }
        };
    }
}
