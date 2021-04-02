import { celebrate, Joi } from 'celebrate';

const report = celebrate({
    body: Joi.object({
        communityId: Joi.string().optional(),
        message: Joi.string().required().allow(''), // TODO: temporary, fixed in mobile-app@1.0.7
    }),
});

const authenticate = celebrate({
    body: Joi.object({
        address: Joi.string().required(),
        language: Joi.string().required(),
        currency: Joi.string().required(),
        pushNotificationToken: Joi.string().required().allow(''),
        phone: Joi.string().optional(), // TODO: make it required once 1.0.7 is the minimal mobile version!
    }),
});

const hello = celebrate({
    body: Joi.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        token: Joi.string().allow(''),
        phone: Joi.string().optional(), // TODO: change to required once 1.0.7 is the minimal mobile version!
    }),
});

const updateUsername = celebrate({
    body: Joi.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        username: Joi.string().required().allow(''),
    }),
});

const updateCurrency = celebrate({
    body: Joi.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        currency: Joi.string().required(),
    }),
});

const updatePushNotificationsToken = celebrate({
    body: Joi.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        token: Joi.string().required(),
    }),
});

const updateLanguage = celebrate({
    body: Joi.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        language: Joi.string().required(),
    }),
});

const updateGender = celebrate({
    body: Joi.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        gender: Joi.string().required().allow(''),
    }),
});

const updateAge = celebrate({
    body: Joi.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        age: Joi.number().required().allow(null),
    }),
});

const updateChildren = celebrate({
    body: Joi.object({
        address: Joi.string().optional(), // TODO: remove it once 1.0.7 is the minimal mobile version!
        children: Joi.number().required().allow(null),
    }),
});

const device = celebrate({
    body: Joi.object({
        phone: Joi.string().required(),
        identifier: Joi.string().required(),
        device: Joi.string().required(),
        network: Joi.string().required().allow(''),
    }),
});

export default {
    report,
    authenticate,
    hello,
    updateUsername,
    updateCurrency,
    updatePushNotificationsToken,
    updateLanguage,
    updateGender,
    updateAge,
    updateChildren,
    device,
};
