import { AppUserModel } from '../../database/models/app/appUser';
import { BaseError } from '../../utils';
import { MicroCreditApplication, MicroCreditApplicationStatus } from '../../interfaces/microCredit/applications';
import { MicroCreditContentStorage } from '../../services/storage';
import { NotificationType } from '../../interfaces/app/appNotification';
import { Op, Transaction } from 'sequelize';
import { config } from '../../..';
import { models } from '../../database';
import { sendEmail } from '../../services/email';
import { sendNotification } from '../../utils/pushNotification';

export default class MicroCreditCreate {
    private microCreditContentStorage = new MicroCreditContentStorage();

    public async getPresignedUrlMedia(mime: string) {
        return this.microCreditContentStorage.getPresignedUrlPutObject(mime);
    }

    // register docs to microCreditDocs table
    public async postDocs(
        userId: number,
        docs: [
            {
                filepath: string;
                category: number;
            }
        ]
    ) {
        const user = await models.appUser.findOne({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new BaseError('USER_NOT_FOUND', 'User not found');
        }
        const microCreditDocs = docs.map(doc => ({
            ...doc,
            userId
        }));

        for (const doc of microCreditDocs) {
            const { filepath, category } = doc;

            if (category === 1 && user.email) {
                const path = Buffer.from(
                    JSON.stringify({
                        bucket: config.aws.bucket.microCredit,
                        key: filepath
                    })
                ).toString('base64');
                // send email to user
                sendEmail({
                    to: user.email,
                    from: 'hello@impactmarket.com',
                    subject: `${
                        config.jsonRpcUrl.indexOf('alfajores') === -1 ? '' : '[TESTNET] '
                    }Your loan contract signed`,
                    text: `You can access your contract at ${config.imageHandlerUrl}/${path}`
                });
            }
        }

        await models.microCreditDocs.bulkCreate(microCreditDocs);

        return microCreditDocs;
    }

    public async updateApplication(applicationId: number[], status: number[], transaction?: Transaction): Promise<void>;
    public async updateApplication(walletAddress: string[], status: number[], transaction?: Transaction): Promise<void>;
    public async updateApplication(arg: (number | string)[], status: number[], transaction?: Transaction) {
        const updateApplicationStatus = async (applicationId: number, status: number) => {
            await models.microCreditApplications.update(
                {
                    status,
                    decisionOn: new Date()
                },
                {
                    where: {
                        id: applicationId
                    },
                    transaction
                }
            );
        };

        if (arg.length !== status.length) {
            throw new BaseError('INVALID_ARGUMENT', 'Invalid argument');
        }

        let applicationIds: number[] = [];

        if (typeof arg[0] === 'number') {
            applicationIds = arg as number[];
        } else {
            const users = await models.appUser.findAll({
                where: {
                    address: { [Op.in]: arg as string[] }
                },
                include: [
                    {
                        model: models.microCreditApplications,
                        as: 'microCreditApplications',
                        attributes: ['id']
                    }
                ]
            });

            applicationIds = users
                .map(user => user.microCreditApplications)
                .filter(applications => applications !== undefined)
                .map(applications => applications!.map(application => application.id))
                .flat();
        }

        for (let x = 0; x < applicationIds.length; x++) {
            const applicationId = applicationIds[x];
            const statusId = status[x];

            await updateApplicationStatus(applicationId, statusId);
        }

        // notify user about decision
        // get users to notify
        const usersToNotify = await models.microCreditApplications.findAll({
            where: {
                id: { [Op.in]: applicationIds }
            },
            include: [
                {
                    model: models.appUser,
                    as: 'user',
                    attributes: ['id', 'walletPNT', 'appPNT', 'language']
                }
            ]
        });

        // it's not undefined!
        const users = usersToNotify
            .map(application => application.user)
            .filter(user => user !== undefined) as AppUserModel[];

        await sendNotification(users, NotificationType.LOAN_STATUS_CHANGED, true, true, undefined, transaction);
    }

    public saveForm = async (
        userId: number,
        form: object,
        prismicId: string,
        submitted: boolean
    ): Promise<MicroCreditApplication> => {
        try {
            const status = submitted ? MicroCreditApplicationStatus.PENDING : MicroCreditApplicationStatus.DRAFT;
            const [userForm, created] = await models.microCreditApplications.findOrCreate({
                where: {
                    userId,
                    prismicId
                },
                defaults: {
                    form,
                    userId,
                    prismicId,
                    status
                }
            });

            if (status === MicroCreditApplicationStatus.PENDING) {
                // TODO: notify loan manager!
                // TODO: send email to user with form
            }

            if (created) {
                return userForm;
            }

            // update form
            const newForm = { ...userForm.form, ...form };

            const data = await userForm.update({
                form: newForm,
                status
            });

            return data;
        } catch (error) {
            throw new BaseError('SAVE_FORM_ERROR', error.message);
        }
    };

    public addNote = (managerId: number, userId: number, note: string) => {
        return models.microCreditNote.create({
            managerId,
            userId,
            note
        });
    };
}
