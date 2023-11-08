import { BaseError, Logger } from '../../utils';
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
                throw new BaseError('INVALID_ADDRESSES', invalidAddresses.toString());
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
            Logger.log(error);
            throw new BaseError(
                error.name || 'SAVING_CIRCLE_CREATION_ERROR',
                error.message || 'An error occurred while creating the saving circle'
            );
        }
    }

    public async invite(userId: number, groupId: number, decision: 'accepted' | 'declined') {
        try {
            const group = await models.savingCircleMember.update({
                decisionOn: new Date(),
                accept: decision === 'accepted'
            }, {
                where: {
                    groupId,
                    userId,
                    decisionOn: { [Op.is]: undefined }
                },
                returning: true
            });

            if (!group[0]) {
                throw new BaseError('DECISION_ALREADY_MADE', 'The decision was already made');
            }

            if (decision === 'declined') {
                // notify that the group creation was refused
                const users = await models.appUser.findAll({
                    attributes: ['id', 'walletPNT'],
                    include: [{
                        attributes: [],
                        model: models.savingCircleMember,
                        as: 'savingCircleMember',
                        where: {
                            groupId
                        }
                    }]
                });
                await sendNotification(users, NotificationType.SAVING_GROUP_CREATION_REFUSED, false, true, undefined);
            }

            return group[1];
        } catch (error) {
            Logger.log(error);
            throw new BaseError(
                error.name || 'SAVING_CIRCLE_INVITE_ERROR',
                error.message || 'An error occurred while updating the saving circle invite');
        }
    }
}
