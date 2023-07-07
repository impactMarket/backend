import { Op } from 'sequelize';
import { ethers } from 'ethers';
import { multiPolygon, point } from '@turf/helpers';
import pointsWithinPolygon from '@turf/points-within-polygon';

import { BaseError } from '../../utils/baseError';
import { getBeneficiariesByAddress } from '../../subgraph/queries/beneficiary';
import { models } from '../../database';
import config from '../../config';
import countriesGeoJSON from '../../utils/geoCountries.json';
import countryNeighbors from '../../utils/countryNeighbors.json';
import iso3Countries from '../../utils/iso3Countries.json';

export default class ClaimLocationService {
    public static async add(
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
                where: { id: communityId }
            });
            const contries = [community!.country];
            contries.push(...countryNeighbors[community!.country].neighbours);

            let valid = false;
            for (let i = 0; i < contries.length; i++) {
                const countryCode = iso3Countries[contries[i]];
                const coordinates = countries.find(el => el.properties.ISO_A3 === countryCode);
                const points = point([gps.longitude, gps.latitude]);
                const countryCoordinate: [any] = coordinates.geometry.coordinates;
                const searchWithin = multiPolygon(countryCoordinate);

                const ptsWithin = pointsWithinPolygon(points, searchWithin);
                if (ptsWithin.features.length) {
                    valid = true;
                    break;
                }
            }

            if (!valid) {
                throw new BaseError('INVALID_LOCATION', 'Claim location outside community country');
            }

            const beneficiary = await getBeneficiariesByAddress([address]);

            if (!beneficiary || !beneficiary.length) {
                throw new BaseError('NOT_BENEFICIARY', 'Not a beneficiary');
            }

            const beneficiaryCommunity = await models.community.findOne({
                attributes: ['id'],
                where: {
                    contractAddress: ethers.utils.getAddress(beneficiary[0].community.id)
                }
            });

            if (beneficiaryCommunity?.id === communityId) {
                await models.ubiClaimLocation.create({
                    communityId: beneficiaryCommunity.id,
                    gps
                });
            } else {
                throw new BaseError('NOT_ALLOWED', 'Beneficiary does not belong to this community');
            }
        } catch (error) {
            throw error;
        }
    }

    public static async getByCommunity(communityId: number) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
        threeMonthsAgo.setHours(0, 0, 0, 0);

        const res = await models.ubiClaimLocation.findAll({
            attributes: ['gps'],
            where: {
                createdAt: { [Op.gte]: threeMonthsAgo },
                communityId
            }
        });
        return res.map(r => r.gps);
    }

    public static async getAll(): Promise<
        {
            latitude: number;
            longitude: number;
        }[]
    > {
        const fiveMonthsAgo = new Date();
        fiveMonthsAgo.setDate(fiveMonthsAgo.getDate() - config.claimLocationTimeframe);
        return models.ubiClaimLocation.findAll({
            attributes: ['gps'],
            where: {
                createdAt: {
                    [Op.gte]: fiveMonthsAgo
                }
            },
            raw: true
        }) as any;
    }
}
