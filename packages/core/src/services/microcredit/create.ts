import { MicroCreditContentStorage } from '../../services/storage';
import { models } from '../../database';
import { sendNotification } from '../../utils/pushNotification';
import { NotificationType } from '../../interfaces/app/appNotification';
import { AppUserModel } from '../../database/models/app/appUser';
import { MicroCreditFormModel } from '../../database/models/microCredit/form';
import { BaseError } from '../../utils';
import { MicroCreditFormStatus } from '../../interfaces/microCredit/form';
import { sendEmail } from '../../services/email';
import { config } from '../../..';

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

            if (category === 1) {
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

    public async updateApplication(updates: { applicationId: number; status: number }[]) {
        const updateApplicationStatus = async (applicationId: number, status: number) => {
            await models.microCreditApplications.update(
                {
                    status,
                    decisionOn: new Date()
                },
                {
                    where: {
                        id: applicationId
                    }
                }
            );
        };

        for (const update of updates) {
            const { applicationId, status } = update;
            await updateApplicationStatus(applicationId, status);
        }

        // notify user about decision
        // get users to notify
        const usersToNotify = await models.microCreditApplications.findAll({
            where: {
                id: updates.map(update => update.applicationId)
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

        await sendNotification(users, NotificationType.LOAN_STATUS_CHANGED);
    }

    public saveForm = async (userId: number, form: object, prismicId: string, submitted: boolean): Promise<MicroCreditFormModel> => {
        try {
            const status = submitted ? MicroCreditFormStatus.SUBMITTED : MicroCreditFormStatus.PENDING;
            const userForm = await models.microCreditForm.findOrCreate({
                where: {
                    userId,
                    prismicId,
                },
                defaults: {
                    form,
                    userId,
                    prismicId,
                    status,
                }
            });

            // update form
            const newForm = { ...userForm[0].form, ...form };

            // TODO: if submitted, check if all required fields was filled (prismic)

            const data = await userForm[0].update({
                form: newForm,
                status,
            });

            return data;
        } catch (error) {
            throw new BaseError('SAVE_FORM_ERROR', error.message);
        }
    };
}
