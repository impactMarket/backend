import { point, multiPolygon, polygon } from '@turf/helpers';
import pointsWithinPolygon from '@turf/points-within-polygon';
import distance from '@turf/distance';
import { Op } from 'sequelize';

import config from '../../../config';
import { models } from '../../../database';
import { BeneficiaryAttributes } from '../../../interfaces/ubi/beneficiary';
import { BaseError } from '../../../utils/baseError';
import countryNeighbors from '../../../utils/countryNeighbors.json';
import countriesGeoJSON from '../../../utils/geoCountries.json';
import iso3Countries from '../../../utils/iso3Countries.json';

export default class ClaimLocationService {
    public async add(
        communityId: string | number,
        gps: {
            latitude: number;
            longitude: number;
        },
        address: string
    ): Promise<void> {
        try {
            const countries = (countriesGeoJSON as any).features;
            const community = await models.community.findOne({
                attributes: ['country'],
                where: { id: communityId },
            });
            const contries = [community!.country];
            contries.push(...countryNeighbors[community!.country].neighbours);

            const points = point([gps.longitude, gps.latitude]);
            let valid = false;
            for (let i = 0; i < contries.length; i++) {
                const countryCode = iso3Countries[contries[i]];
                const coordinates = countries.find(
                    (el) => el.properties.ISO_A3 === countryCode
                );
                const countryCoordinate: [any] =
                    coordinates.geometry.coordinates;
                let searchWithin: any;
                if (coordinates.geometry.type === 'Polygon') {
                    searchWithin = polygon(countryCoordinate);
                } else if (coordinates.geometry.type === 'MultiPolygon') {
                    searchWithin = multiPolygon(countryCoordinate);
                }
                const ptsWithin = pointsWithinPolygon(points, searchWithin);
                if (ptsWithin.features.length) {
                    valid = true;
                    break;
                }
            }

            if (!valid) {
                // check if its close to the community country
                const countryCode = iso3Countries[community!.country];
                const country = countries.find(
                    (el) => el.properties.ISO_A3 === countryCode
                );

                const closeLocation = this.getDistance(points, country.geometry);

                if (!closeLocation) {
                    throw new BaseError(
                        'INVALID_LOCATION',
                        'Claim location outside community country'
                    );
                }
            }

            const beneficiary: BeneficiaryAttributes | null =
                await models.beneficiary.findOne({
                    attributes: [],
                    include: [
                        {
                            attributes: ['id', 'publicId'],
                            model: models.community,
                            as: 'community',
                        },
                    ],
                    where: { address },
                });

            if (!beneficiary || !beneficiary.community) {
                throw new BaseError('NOT_BENEFICIARY', 'Not a beneficiary');
            }

            if (
                beneficiary.community.id === communityId ||
                beneficiary.community.publicId === communityId
            ) {
                await models.ubiClaimLocation.create({
                    communityId: beneficiary.community.id,
                    gps,
                });
            } else {
                throw new BaseError(
                    'NOT_ALLOWED',
                    'Beneficiary does not belong to this community'
                );
            }
        } catch (error) {
            throw error;
        }
    }

    public async getByCommunity(communityId: number) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
        threeMonthsAgo.setHours(0, 0, 0, 0);

        const res = await models.ubiClaimLocation.findAll({
            attributes: ['gps'],
            where: {
                createdAt: { [Op.gte]: threeMonthsAgo },
                communityId,
            },
        });
        return res.map((r) => r.gps);
    }

    public async getAll(): Promise<
        {
            latitude: number;
            longitude: number;
        }[]
    > {
        const fiveMonthsAgo = new Date();
        fiveMonthsAgo.setDate(
            fiveMonthsAgo.getDate() - config.claimLocationTimeframe
        );
        return models.ubiClaimLocation.findAll({
            attributes: ['gps'],
            where: {
                createdAt: {
                    [Op.gte]: fiveMonthsAgo,
                },
            },
            raw: true,
        }) as any;
    }

    private getDistance(location: any, geometry: any) {
        let close = false;

        if (geometry.type === 'Polygon') {
            const element = geometry.coordinates[0];
            element.forEach(el => {
                const newPoint = point(el);
                const dist = distance(location, newPoint);
                // less than 50 kilometers
                if (dist < 50) {
                    close = true;
                    return;
                }
            });
        } else if (geometry.type === 'MultiPolygon') {
            const coordinates = geometry.coordinates;
            for (let index = 0; index < coordinates.length; index++) {
                const element = coordinates[index][0];
                element.forEach(el => {
                    const newPoint = point(el);
                    const dist = distance(location, newPoint);
                    // less than 50 kilometers
                    if (dist < 50) {
                        close = true;
                        return;
                    }
                });

                if (close) break;
            }
        }

        return close;
    }
}
