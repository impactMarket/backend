import { MicroCreditContentStorage } from '../../services/storage';
import { models } from '../../database';
import { sendNotification } from '../../utils/pushNotification';
import { NotificationType } from '../../interfaces/app/appNotification';
import { AppUserModel } from '../../database/models/app/appUser';

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
        const microCreditDocs = docs.map(doc => ({
            ...doc,
            userId
        }));

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
}
