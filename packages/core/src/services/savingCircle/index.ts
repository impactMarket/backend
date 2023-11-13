import { BaseError } from '../../utils';
import { NotificationType } from '../../interfaces/app/appNotification';
import { Op } from 'sequelize';
import { SavingCircleMemberModel } from '../../database/models/savingCircle/savingCircleMember';
import { getAddress } from '@ethersproject/address';
import { models, sequelize } from '../../database';
import { sendNotification } from '../../utils/pushNotification';

export default class SavingCircleService {
    public async create(
        user: {
            address: string;
            userId: number;
        },
        group: {
            name: string;
            country: string;
            amount: number;
            frequency: number;
            firstDepositOn: number;
            members: string[];
        }
    ): Promise<{
        name: string;
        country: string;
        amount: number;
        frequency: number;
        firstDepositOn: Date;
        status: number;
        members: SavingCircleMemberModel[];
    }> {
        const t = await sequelize.transaction();

        try {
            const { name, country, amount, frequency, firstDepositOn, members } = group;

            // check if all members already have an account
            const addresses = members.map(getAddress);
            const users = await models.appUser.findAll({
                attributes: ['id', 'address', 'walletPNT'],
                where: { address: { [Op.in]: [...addresses, user.address] } },
                raw: true
            });

            const invalidAddresses: string[] = addresses.filter(
                address => !users.some(user => user.address === address)
            );

            if (invalidAddresses.length) {
                throw new BaseError('InvalidAddresses', invalidAddresses.toString());
            }

            const userIds = users.map(user => user.id);
            const groupCreated = await models.savingCircle.create(
                {
                    name,
                    country,
                    amount,
                    frequency,
                    firstDepositOn: new Date(firstDepositOn),
                    requestedBy: user.userId,
                    status: 0
                },
                { transaction: t }
            );

            const memberAdded = await models.savingCircleMember.bulkCreate(
                userIds.map(id => ({
                    userId: id,
                    groupId: groupCreated.id
                })),
                { transaction: t }
            );

            await sendNotification(users, NotificationType.SAVING_GROUP_INVITE, false, true, undefined, t);

            await t.commit();

            return {
                ...groupCreated.toJSON(),
                members: memberAdded
            };
        } catch (error) {
            await t.rollback();
            console.log(error);
            throw new BaseError(
                error.name || 'SavingCircleCreationError',
                error.message || 'An error occurred while creating the saving circle'
            );
        }
    }
}
