import { Op, fn, col } from 'sequelize';
import { Beneficiary } from '../db/models/beneficiary';
import database from '../loaders/database';
import { Logger } from '../loaders/logger';
import { IManagerDetailsBeneficiary } from '../types/endpoints';


const db = database();
export default class BeneficiaryService {

    public static async add(
        address: string,
        communityId: string,
        tx: string,
        txAt: Date,
    ): Promise<boolean> {
        // if user does not exist, add to pending list
        // otherwise update
        const user = await db.models.beneficiary.findOne({ where: { address, active: false } });
        if (user === null) {
            const beneficiaryData = {
                address,
                communityId,
                tx,
                txAt,
            };
            try {
                await db.models.beneficiary.create(beneficiaryData);
            } catch (e) {
                if (e.name !== 'SequelizeUniqueConstraintError') {
                    Logger.error('Error inserting new Beneficiary. Data = ' + JSON.stringify(beneficiaryData));
                    Logger.error(e);
                }
            }
        } else {
            await db.models.beneficiary.update({ active: true }, { where: { address } });
        }
        return true;
    }

    public static async listActiveInCommunity(
        communityId: string,
    ): Promise<Beneficiary[]> {
        return await db.models.beneficiary.findAll({
            where: {
                communityId,
                active: true
            },
            order: [['txAt', 'DESC']]
        });
    }

    public static async countInCommunity(
        communityId: string,
    ): Promise<{ active: number, inactive: number }> {
        const active: { total: number } = (await db.models.beneficiary.findAll({
            attributes: [
                [fn('count', col('address')), 'total']
            ],
            where: {
                communityId,
                active: true
            }
        }))[0] as any;
        const inactive: { total: number } = (await db.models.beneficiary.findAll({
            attributes: [
                [fn('count', col('address')), 'total']
            ],
            where: {
                communityId,
                active: false
            }
        }))[0] as any;
        return {
            active: active.total,
            inactive: inactive.total
        }
    }

    public static async listAllInCommunity(
        communityId: string,
    ): Promise<{ active: IManagerDetailsBeneficiary[], inactive: IManagerDetailsBeneficiary[] }> {
        // TODO: this needs to be improved with eager loading (I mean, a lot!)
        const active: IManagerDetailsBeneficiary[] = [];
        const inactive: IManagerDetailsBeneficiary[] = [];

        const bAddresses: string[] = []
        const actives = await db.models.beneficiary.findAll({
            where: {
                communityId,
                active: true
            },
            order: [['txAt', 'DESC']]
        });
        const inactives = await db.models.beneficiary.findAll({
            where: {
                communityId,
                active: false
            },
            order: [['txAt', 'DESC']]
        });
        bAddresses.concat(actives.map((a) => a.address)).concat(inactives.map((a) => a.address));
        const names = await db.models.user.findAll({
            attributes: ['address', 'username'],
            where: {
                address: {
                    [Op.in]: bAddresses
                },
            },
        });
        const claimed: {address:string, claimed: string}[] = (await db.models.claim.findAll({
            attributes: [
                'address',
                [fn('sum', col('amount')), 'claimed']
            ],
            where: {
                address: {
                    [Op.in]: bAddresses
                },
            },
            group: ['address']
        })) as any;

        // for active
        for (let index = 0; index < actives.length; index++) {
            const e = actives[index];
            const u = names.find((n) => n.address === e.address);
            const c = claimed.find((n) => n.address === e.address);
            active.push({
                address: e.address,
                username: u ? u.username : null,
                timestamp: e.txAt.getTime(),
                claimed: c ? c.claimed : '0'
            });
        }

        // for inactive
        for (let index = 0; index < inactives.length; index++) {
            const e = inactives[index];
            const u = names.find((n) => n.address === e.address);
            const c = claimed.find((n) => n.address === e.address);
            inactive.push({
                address: e.address,
                username: u ? u.username : null,
                timestamp: e.txAt.getTime(),
                claimed: c ? c.claimed : '0'
            });
        }

        return {
            active,
            inactive
        }
    }

    public static async get(
        address: string,
    ): Promise<Beneficiary | null> {
        return await db.models.beneficiary.findOne({ where: { address } });
    }

    public static async getAllAddresses(): Promise<string[]> {
        return (await db.models.beneficiary.findAll({ attributes: ['address'] })).map((b) => b.address);
    }

    public static async remove(
        address: string,
    ): Promise<void> {
        await db.models.beneficiary.update({ active: false }, { where: { address } });
    }

    public static async getActiveBeneficiariesLast30Days(): Promise<Map<string, number>> {
        const todayMidnightTime = new Date();
        todayMidnightTime.setHours(0, 0, 0, 0);
        // a month ago, from todayMidnightTime
        const aMonthAgo = new Date(todayMidnightTime.getTime() - 2592000000); // 30 * 24 * 60 * 60 * 1000
        const result = await db.models.beneficiary.findAll({
            attributes: [
                [fn('count', col('address')), 'total'],
                'communityId',
            ],
            where: {
                lastClaimAt: {
                    [Op.lt]: todayMidnightTime,
                    [Op.gte]: aMonthAgo,
                }
            },
            group: 'communityId',
        });
        return new Map(result.map((c: any) => [c.communityId, c.total]));
    }

}