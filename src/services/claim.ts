import { String } from 'aws-sdk/clients/acm';
import { col, fn, Op } from 'sequelize';
import { Claim } from '../db/models/claim';
import Logger from '../loaders/logger';


export default class ClaimService {

    public static async add(
        address: string,
        communityId: string,
        amount: string,
        tx: string,
        txAt: Date,
    ): Promise<void> {
        try {
            await Claim.create({
                address,
                communityId,
                amount,
                tx,
                txAt,
            });
        } catch (e) {
            Logger.info(e);
        }
    }

    /**
     * Get total monthly (last 30 days, starting yesterday) claimed.
     * 
     * **NOTE**: claimed amounts will always be bigger than zero though,
     * a community might not be listed if no claim has ever happened!
     * 
     * @returns string
     */
    public static async getMonthlyClaimed(): Promise<string> {
        const yesterday = new Date(new Date().getTime() - 86400000);
        yesterday.setHours(0, 0, 0, 0);
        // 30 days ago, from yesterday
        const aMonthAgo = new Date(yesterday.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const claimed = (await Claim.findAll({
            attributes: [[fn('sum', col('amount')), 'claimed']],
            where: {
                txAt: {
                    [Op.lte]: yesterday,
                    [Op.gte]: aMonthAgo,
                }
            },
        }))[0];
        // there will always be claimed.lenght > 0 (were only zero at the begining)
        return (claimed as any).claimed;
    }

    public static async uniqueBeneficiariesAndClaimedLast7Days(): Promise<{
        beneficiaries: number;
        claimed: string;
    }> {
        const yesterday = new Date(new Date().getTime() - 86400000);
        yesterday.setHours(0, 0, 0, 0);
        // seven days ago, from yesterday
        const sevenDaysAgo = new Date(yesterday.getTime() - 604800000); // 7 * 24 * 60 * 60 * 1000
        const result = (await Claim.findAll({
            attributes: [
                [fn('count', fn('distinct', col('address'))), 'beneficiaries'],
                [fn('sum', col('amount')), 'claimed']
            ],
            where: {
                txAt: {
                    [Op.lte]: yesterday,
                    [Op.gte]: sevenDaysAgo,
                }
            },
        }))[0];
        return {
            beneficiaries: (result as any).beneficiaries,
            claimed: (result as any).claimed,
        }
    }
}