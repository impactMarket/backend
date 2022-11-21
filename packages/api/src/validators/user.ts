import { celebrate, Joi } from 'celebrate';

import { defaultSchema } from './defaultSchema';
// v2

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

//

const reportv1 = celebrate({
    body: defaultSchema.object({
        communityId: Joi.any().required(),
        message: Joi.string().required().allow(''), // TODO: temporary, fixed in mobile-app@1.0.7
    }),
});

const auth = celebrate({
    body: defaultSchema.object({
        address: Joi.string().required(),
        phone: Joi.string().optional(),
        language: Joi.string().optional(),
        currency: Joi.string().optional(),
        pushNotificationToken: Joi.string().optional().allow(''),
        username: Joi.string().optional(),
        gender: Joi.string().optional(),
        year: Joi.number().optional(),
        children: Joi.number().optional(),
        avatarMediaId: Joi.number().optional(),
        overwrite: Joi.boolean().optional(),
        recover: Joi.boolean().optional(),
    }),
});

const welcome = celebrate({
    body: defaultSchema.object({
        address: Joi.string().optional(), // TODO: deprecated in mobile@1.1.5
        token: Joi.string().allow(''), // TODO: deprecated in mobile@1.1.5
        phone: Joi.string().optional(), // TODO: deprecated in mobile@1.1.5
        pushNotificationToken: Joi.string().optional(), // TODO: required in mobile@1.1.5
    }),
});

const updateUsername = celebrate({
    body: defaultSchema.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        username: Joi.string().required().allow(''),
    }),
});

const updateCurrency = celebrate({
    body: defaultSchema.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        currency: Joi.string().required(),
    }),
});

const updatePushNotificationsToken = celebrate({
    body: defaultSchema.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        token: Joi.string().required(),
    }),
});

const updateLanguage = celebrate({
    body: defaultSchema.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        language: Joi.string().required(),
    }),
});

const updateGender = celebrate({
    body: defaultSchema.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        gender: Joi.string().required().allow(''),
    }),
});

const updateAge = celebrate({
    body: defaultSchema.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        age: Joi.number().required().allow(null),
    }),
});

const updateChildren = celebrate({
    body: defaultSchema.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        children: Joi.number().required().allow(null),
    }),
});

const device = celebrate({
    body: defaultSchema.object({
        phone: Joi.string().required(),
        identifier: Joi.string().required(),
        device: Joi.string().required(),
        network: Joi.string().required().allow(''),
    }),
});

const edit = celebrate({
    body: defaultSchema.object({
        language: Joi.string().optional(),
        currency: Joi.string().optional(),
        username: Joi.string().optional(),
        gender: Joi.string().optional(),
        year: Joi.number().optional(),
        children: Joi.number().optional(),
        avatarMediaId: Joi.number().optional(),
        pushNotificationToken: Joi.string().optional().allow(''),
        email: Joi.string()
            .email({ tlds: { allow: false } })
            .optional(),
    }),
});

const subscribeNewsletter = celebrate({
    body: defaultSchema.object({
        subscribe: Joi.boolean().required(),
    }),
});

const saveSurvey = celebrate({
    body: Joi.array().items(
        defaultSchema.object({
            surveyId: Joi.number().required(),
            answer: Joi.string().required(),
            question: Joi.number().required(),
        })
    ),
});

export default {
    create,
    update,
    report,
    reportv1,
    auth,
    welcome,
    updateUsername,
    updateCurrency,
    updatePushNotificationsToken,
    updateLanguage,
    updateGender,
    updateAge,
    updateChildren,
    device,
    edit,
    subscribeNewsletter,
    saveSurvey,
    readNotifications,
    sendPushNotifications,
};
