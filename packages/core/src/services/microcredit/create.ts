import * as prismicH from '@prismicio/helpers';
import { AppUser } from '../../interfaces/app/appUser';
import { AppUserModel } from '../../database/models/app/appUser';
import { BaseError, prismic as basePrimisc, locales } from '../../utils';
import { MailDataRequired } from '@sendgrid/mail';
import {
    MicroCreditApplication,
    MicroCreditApplicationCreation,
    MicroCreditApplicationStatus
} from '../../interfaces/microCredit/applications';
import { MicroCreditContentStorage } from '../../services/storage';
import { NotificationParamsPath, NotificationType } from '../../interfaces/app/appNotification';
import { NullishPropertiesOf } from 'sequelize/types/utils';
import { Op, Optional, Transaction, WhereOptions } from 'sequelize';
import { cleanMicroCreditApplicationsCache, cleanMicroreditBorrowerCache } from '../../utils/cache';
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
        applicationId: number,
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
            applicationId,
            userId
        }));

        for (const doc of microCreditDocs) {
            const { filepath, category } = doc;

            if (category === 1) {
                models.microCreditApplications.update(
                    {
                        signedOn: new Date()
                    },
                    {
                        where: {
                            id: applicationId
                        }
                    }
                );
                if (user.email) {
                    const path = Buffer.from(
                        JSON.stringify({
                            bucket: config.aws.bucket.microCredit,
                            key: filepath
                        })
                    ).toString('base64');
                    // send email to user
                    sendEmail({
                        to: user.email,
                        from: 'no-reply@impactmarket.com',
                        subject: `${
                            config.jsonRpcUrl.indexOf('alfajores') === -1 ? '' : '[TESTNET] '
                        }Your loan contract signed`,
                        text: `You can access your contract at ${config.imageHandlerUrl}/${path}`
                    });
                }
            }
        }

        await models.microCreditDocs.bulkCreate(microCreditDocs, {
            fields: ['userId', 'applicationId', 'category', 'filepath'],
            updateOnDuplicate: ['applicationId', 'category']
        });

        return microCreditDocs;
    }

    public async updateApplication(applicationId: number[], status: number[], transaction?: Transaction): Promise<void>;
    public async updateApplication(walletAddress: string[], status: number[], transaction?: Transaction): Promise<void>;
    public async updateApplication(arg: (number | string)[], status: number[], transaction?: Transaction) {
        const updateApplicationStatus = async (applicationId: number, newStatus: number) => {
            if (newStatus > MicroCreditApplicationStatus.CANCELED) {
                throw new BaseError('INVALID_STATUS', 'Invalid status');
            }
            const where: WhereOptions<MicroCreditApplication> = {
                id: applicationId
            };
            if (newStatus === MicroCreditApplicationStatus.CANCELED) {
                where.status = MicroCreditApplicationStatus.APPROVED;
            } else {
                where.status = {
                    [Op.notIn]: [MicroCreditApplicationStatus.APPROVED, MicroCreditApplicationStatus.CANCELED]
                };
            }
            await models.microCreditApplications.update(
                {
                    status: newStatus,
                    decisionOn: new Date()
                },
                {
                    where,
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
                    attributes: ['id', 'email', 'walletPNT', 'appPNT', 'language']
                }
            ]
        });

        // it's not undefined!
        const users = usersToNotify
            .map(application => application.user)
            .filter(user => user !== undefined) as AppUserModel[];

        // we are assuming that all applications have the same status
        let notificationType: NotificationType = NotificationType.LOAN_APPLICATION_INTERVIEW;
        switch (status[0]) {
            case MicroCreditApplicationStatus.APPROVED:
                notificationType = NotificationType.LOAN_APPLICATION_APPROVED;
                break;
            case MicroCreditApplicationStatus.REJECTED:
                notificationType = NotificationType.LOAN_APPLICATION_REJECTED;
                break;
            case MicroCreditApplicationStatus.REQUEST_CHANGES:
                notificationType = NotificationType.LOAN_APPLICATION_REQUEST_CHANGES;
                break;
        }

        users.forEach((user, i) => {
            this._notifyApplicationChangeStatusByEmail(user, applicationIds[i], notificationType);
        });
        await sendNotification(
            users,
            notificationType,
            true,
            true,
            applicationIds.map(a => ({ path: `${NotificationParamsPath.LOAN_APPLICATION}${a}` })),
            transaction
        );
    }

    public async updateRepaymentRate(applicationId_: number[], repaymentRate_: number[]): Promise<void> {
        for (let x = 0; x < applicationId_.length; x++) {
            const applicationId = applicationId_[x];
            const repaymentRate = repaymentRate_[x];

            const application = await models.microCreditApplications.findOne({
                where: {
                    id: applicationId
                }
            });
            const borrowerUserId = application!.userId;

            await models.microCreditBorrowers.upsert(
                {
                    userId: borrowerUserId,
                    applicationId,
                    repaymentRate
                },
                {
                    conflictFields: ['userId', 'applicationId']
                }
            );
        }
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
                            id: selectedLoanManagerId!
                        }
                    })
                    .then(
                        user =>
                            user && sendNotification([user], NotificationType.LOAN_APPLICATION_RECEIVED, false, true)
                    );
                // below we will send email to user with form
                // get user email and language to get text for template and send email
                const user = await models.appUser.findOne({
                    attributes: ['email', 'language', 'walletPNT', 'appPNT'],
                    where: {
                        id: userForm.userId
                    }
                });
                if (!user) {
                    throw new BaseError('USER_NOT_FOUND', 'User not found');
                }

                this._notifyApplicationChangeStatusByEmail(
                    user,
                    userForm.id,
                    NotificationType.LOAN_APPLICATION_SUBMITTED
                );
                sendNotification([user.toJSON()], NotificationType.LOAN_APPLICATION_SUBMITTED, true, true, {
                    path: `${NotificationParamsPath.LOAN_APPLICATION}${userForm.id}`
                });
            }

            if (created) {
                return userForm;
            }

            // update form
            const newForm = { ...userForm.form, ...form };

            // prevent the application from returning to DRAFT if it is in another status
            const updateStatus =
                status === MicroCreditApplicationStatus.DRAFT && userForm.status !== MicroCreditApplicationStatus.DRAFT
                    ? {}
                    : { status };

            const data = await userForm.update({
                form: newForm,
                selectedLoanManagerId,
                ...updateStatus
            });
            cleanMicroCreditApplicationsCache(selectedLoanManagerId);

            return data;
        } catch (error) {
            throw new BaseError('SAVE_FORM_ERROR', error.message);
        }
    };

    public addNote = async (managerId: number, userId: number, note: string) => {
        const newNote = await models.microCreditNote.create({
            managerId,
            userId,
            note
        });

        if (!newNote) {
            throw new BaseError('ADD_NOTE_ERROR', 'Error adding note');
        }

        // clear borrower cache
        models.appUser
            .findOne({
                attributes: ['address'],
                where: { id: userId }
            })
            .then(user => user && cleanMicroreditBorrowerCache(user.address));

        return newNote;
    };

    private async _notifyApplicationChangeStatusByEmail(
        user: AppUser,
        formId: number,
        notificationType: NotificationType
    ) {
        let baseKey = 'submitted';
        let emailType = MicroCreditApplicationStatus.PENDING;
        let urlPath = NotificationParamsPath.LOAN_APPLICATION;
        switch (notificationType) {
            // case NotificationType.LOAN_APPLICATION_SUBMITTED:
            case NotificationType.LOAN_APPLICATION_REQUEST_CHANGES:
                baseKey = 'requested-changes';
                emailType = MicroCreditApplicationStatus.REQUEST_CHANGES;
                break;
            case NotificationType.LOAN_APPLICATION_APPROVED:
                baseKey = 'approved';
                emailType = MicroCreditApplicationStatus.APPROVED;
                urlPath = NotificationParamsPath.LOAN_APPROVED;
                break;
            case NotificationType.LOAN_APPLICATION_INTERVIEW:
                baseKey = 'interview';
                emailType = MicroCreditApplicationStatus.INTERVIEW;
                urlPath = NotificationParamsPath.LOAN_APPROVED;
                break;
            case NotificationType.LOAN_APPLICATION_REJECTED:
                baseKey = 'rejected';
                emailType = MicroCreditApplicationStatus.REJECTED;
                break;
        }
        let buttonURL = `https://app.impactmarket.com/${urlPath}${formId}`;
        if (urlPath === NotificationParamsPath.LOAN_APPROVED) {
            buttonURL = `https://app.impactmarket.com/${urlPath}`;
        }
        // get text for email template on user language defaulting to english
        const locale = locales.find(({ shortCode }) => user.language.toLowerCase() === shortCode.toLowerCase())?.code;
        const response = await prismic.getAllByType('push_notifications_data', {
            lang: locale || 'en-US'
        });
        let subject: string | undefined;
        let title: string | undefined;
        let subtitle: string | undefined;
        let buttonText: string | undefined;
        let body: string | undefined;
        if (response.length > 0) {
            const data = response[0].data;
            subject = data[`${baseKey}-form-email-notification-subject`];
            title = data[`${baseKey}-form-email-notification-title`];
            subtitle = data[`${baseKey}-form-email-notification-subtitle`];
            buttonText = data[`${baseKey}-form-email-notification-button-text`];
            body = data[`${baseKey}-form-email-notification-body`]
                ? prismicH.asHTML(data[`${baseKey}-form-email-notification-body`]) || undefined
                : undefined;
        }
        if (!subject || !title || !subtitle || !buttonText || !body) {
            const response = await prismic.getAllByType('push_notifications_data', {
                lang: 'en-US'
            });
            const data = response[0].data;
            subject = data[`${baseKey}-form-email-notification-subject`];
            title = data[`${baseKey}-form-email-notification-title`];
            subtitle = data[`${baseKey}-form-email-notification-subtitle`];
            buttonText = data[`${baseKey}-form-email-notification-button-text`];
            body = data[`${baseKey}-form-email-notification-body`]
                ? prismicH.asHTML(data[`${baseKey}-form-email-notification-body`]) || undefined
                : undefined;
        }

        if (notificationType === NotificationType.LOAN_APPLICATION_APPROVED) {
            const formData = await models.microCreditApplications.findOne({
                attributes: ['amount'],
                where: {
                    id: formId
                }
            });
            subtitle = subtitle!
                .replace('{{amount}}', formData!.amount?.toString() || '0')
                .replace('{{currency}}', 'cUSD');
        }

        // build the email structure and send
        const dynamicTemplateData = {
            title,
            subtitle,
            buttonURL,
            buttonText,
            body,
            subject,
            emailType
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
                email: 'no-reply@impactmarket.com'
            },
            personalizations,
            templateId: 'd-b257690897ff41028d7ad8cabe88f8cb'
        };
        sendEmail(sendgridData);
    }
}
