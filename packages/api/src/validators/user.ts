import { celebrate, Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';

const create = celebrate({
    body: defaultSchema.object({
        address: Joi.string().required(),
        phone: Joi.string().optional(),
        language: Joi.string().optional(),
        currency: Joi.string().optional(),
        pushNotificationToken: Joi.alternatives(Joi.string(), null).optional(),
        walletPNT: Joi.alternatives(Joi.string(), null).optional(),
        appPNT: Joi.alternatives(Joi.string(), null).optional(),
        firstName: Joi.string().optional(),
        lastName: Joi.string().optional(),
        gender: Joi.string().optional(),
        age: Joi.number().optional(),
        children: Joi.number().optional(),
        avatarMediaPath: Joi.string().optional(),
        bio: Joi.string().optional(),
        email: Joi.alternatives(
            Joi.string().email({ tlds: { allow: false } }),
            null
        ).optional(),
        overwrite: Joi.boolean().optional(),
        recover: Joi.boolean().optional(),
        clientId: Joi.string().optional(),
        country: Joi.string().optional(),
    }),
});

const update = celebrate({
    body: defaultSchema.object({
        phone: Joi.alternatives(Joi.string(), null).optional(),
        language: Joi.alternatives(Joi.string(), null).optional(),
        currency: Joi.alternatives(Joi.string(), null).optional(),
        pushNotificationToken: Joi.alternatives(Joi.string(), null).optional(),
        walletPNT: Joi.alternatives(Joi.string(), null).optional(),
        appPNT: Joi.alternatives(Joi.string(), null).optional(),
        firstName: Joi.alternatives(Joi.string(), null).optional(),
        lastName: Joi.alternatives(Joi.string(), null).optional(),
        gender: Joi.string().optional(),
        age: Joi.alternatives(Joi.number(), null).optional(),
        children: Joi.alternatives(Joi.number(), null).optional(),
        avatarMediaPath: Joi.alternatives(Joi.string(), null).optional(),
        bio: Joi.alternatives(Joi.string(), null).optional(),
        email: Joi.alternatives(
            Joi.string().email({ tlds: { allow: false } }),
            null
        ).optional(),
        country: Joi.string().optional(),
    }),
});

const report = celebrate({
    body: defaultSchema.object({
        communityId: Joi.any().required(),
        message: Joi.string().required(),
        category: Joi.string().required(),
    }),
});

const readNotifications = celebrate({
    body: defaultSchema.object({
        notifications: Joi.array().items(Joi.number()).required(),
    }),
});

const sendPushNotifications = celebrate({
    body: defaultSchema.object({
        country: Joi.string().optional(),
        communities: Joi.array().items(Joi.number().required()).optional(),
        title: Joi.string().required(),
        body: Joi.string().required(),
        data: Joi.object().optional(),
    }),
});

export default {
    create,
    update,
    report,
    readNotifications,
    sendPushNotifications,
};
