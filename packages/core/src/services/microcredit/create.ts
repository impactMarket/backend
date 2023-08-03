import * as prismicH from '@prismicio/helpers';
import { AppUserModel } from '../../database/models/app/appUser';
import { BaseError, prismic as basePrimisc, locales } from '../../utils';
import { MailDataRequired } from '@sendgrid/mail';
import {
    MicroCreditApplication,
    MicroCreditApplicationCreation,
    MicroCreditApplicationStatus
} from '../../interfaces/microCredit/applications';
import { MicroCreditContentStorage } from '../../services/storage';
import { NotificationType } from '../../interfaces/app/appNotification';
import { NullishPropertiesOf } from 'sequelize/types/utils';
import { Op, Optional, Transaction } from 'sequelize';
import { config } from '../../..';
import { models } from '../../database';
import { sendEmail } from '../../services/email';
import { sendNotification } from '../../utils/pushNotification';

const { client: prismic } = basePrimisc;

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
        selectedLoanManagerId: number | undefined,
        submitted: boolean
    ): Promise<MicroCreditApplication> => {
        try {
            const status = submitted ? MicroCreditApplicationStatus.PENDING : MicroCreditApplicationStatus.DRAFT;
            let defaults: Optional<
                MicroCreditApplicationCreation,
                NullishPropertiesOf<MicroCreditApplicationCreation>
            > = { userId, status };
            // add fields only if they are not undefined
            // since it fails to have undefined as default
            if (form) {
                defaults = { ...defaults, form };
            }
            if (selectedLoanManagerId) {
                defaults = { ...defaults, selectedLoanManagerId };
            }
            if (prismicId) {
                defaults = { ...defaults, prismicId };
            }
            const [userForm, created] = await models.microCreditApplications.findOrCreate({
                where: {
                    userId,
                    prismicId
                },
                defaults
            });

            if (status === MicroCreditApplicationStatus.PENDING) {
                // notify loan manager!
                models.appUser
                    .findOne({
                        where: {
                            id: userForm.selectedLoanManagerId
                        }
                    })
                    .then(user => user && sendNotification([user], NotificationType.NEW_LOAN_SUBMITTED, true, true));
                // below we will send email to user with form
                // get user email and language to get text for template and send email
                const urlToApplicationForm = `https://app.impactmarket.com/microcredit/form/${userForm.id}`;
                const user = await models.appUser.findOne({
                    attributes: ['email', 'language', 'walletPNT', 'appPNT'],
                    where: {
                        id: userForm.userId
                    }
                });
                if (!user) {
                    throw new BaseError('USER_NOT_FOUND', 'User not found');
                }

                // get text for email template on user language defaulting to english
                const locale = locales.find(({ shortCode }) => user?.language.toLowerCase() === shortCode.toLowerCase())
                    ?.code;
                const response = await prismic.getAllByType('push_notifications_data', {
                    lang: locale || 'en-US'
                });
                let submittedFormEmailNotificationSubject: string | undefined;
                let submittedFormEmailNotificationTitle: string | undefined;
                let submittedFormEmailNotificationSubtitle: string | undefined;
                let submittedFormEmailNotificationViewApplication: string | undefined;
                let submittedFormEmailNotificationViewNextSteps: string | undefined;
                if (response.length > 0) {
                    const data = response[0].data;
                    submittedFormEmailNotificationSubject = data['submitted-form-email-notification-subject'];
                    submittedFormEmailNotificationTitle = data['submitted-form-email-notification-title'];
                    submittedFormEmailNotificationSubtitle = data['submitted-form-email-notification-subtitle'];
                    submittedFormEmailNotificationViewApplication =
                        data['submitted-form-email-notification-view-application'];
                    submittedFormEmailNotificationViewNextSteps =
                        prismicH.asHTML(data['submitted-form-email-notification-next-steps']) || '';
                }
                if (
                    !submittedFormEmailNotificationSubject ||
                    !submittedFormEmailNotificationTitle ||
                    !submittedFormEmailNotificationSubtitle ||
                    !submittedFormEmailNotificationViewApplication ||
                    !submittedFormEmailNotificationViewNextSteps
                ) {
                    const response = await prismic.getAllByType('push_notifications_data', {
                        lang: 'en-US'
                    });
                    const data = response[0].data;
                    submittedFormEmailNotificationSubject = data['submitted-form-email-notification-subject'];
                    submittedFormEmailNotificationTitle = data['submitted-form-email-notification-title'];
                    submittedFormEmailNotificationSubtitle = data['submitted-form-email-notification-subtitle'];
                    submittedFormEmailNotificationViewApplication =
                        data['submitted-form-email-notification-view-application'];
                    submittedFormEmailNotificationViewNextSteps =
                        prismicH.asHTML(data['submitted-form-email-notification-next-steps']) || '';
                }

                // build the email structure and send
                const dynamicTemplateData = {
                    submittedFormEmailNotificationTitle,
                    submittedFormEmailNotificationSubtitle,
                    urlToApplicationForm,
                    submittedFormEmailNotificationViewApplication,
                    submittedFormEmailNotificationViewNextSteps,
                    submittedFormEmailNotificationSubject
                };
                const personalizations = [
                    {
                        to: [{ email: user.email }],
                        dynamicTemplateData
                    }
                ];
                const sendgridData: MailDataRequired = {
                    from: {
                        name: 'impactMarket',
                        email: 'hello@impactmarket.com'
                    },
                    personalizations,
                    templateId: 'd-b257690897ff41028d7ad8cabe88f8cb'
                };
                sendEmail(sendgridData);
                sendNotification([user.toJSON()], NotificationType.LOAN_APPLICATION_SUBMITTED, true, true, {
                    url: urlToApplicationForm
                });
            }

            if (created) {
                return userForm;
            }

            // update form
            const newForm = { ...userForm.form, ...form };

            const data = await userForm.update({
                form: newForm,
                selectedLoanManagerId,
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
