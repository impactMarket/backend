import { BeneficiaryAttributes } from '@models/ubi/beneficiary';
import { BaseError } from '@utils/baseError';
import config from '../../config';
import { Op } from 'sequelize';

import { models } from '../../database';

export default class ClaimLocationService {
    public static async add(
        communityId: string | number,
        gps: {
            latitude: number;
            longitude: number;
        },
        address: string
    ): Promise<void> {
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
    }

    public static async getByCommunity(communityId: number) {
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

    public static async getAll(): Promise<
        {
            latitude: number;
            longitude: number;
        }[]
    > {
        const fiveMonthsAgo = new Date();
        fiveMonthsAgo.setDate(fiveMonthsAgo.getDate() - config.timeframe);
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
}
