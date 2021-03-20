import { celebrate, Joi } from 'celebrate';

const report = celebrate({
    body: Joi.object({
        communityId: Joi.string().optional(),
        message: Joi.string().required(),
    }),
});

const authenticate = celebrate({
    body: Joi.object({
        address: Joi.string().required(),
        language: Joi.string().required(),
        currency: Joi.string().optional().allow(''),
        pushNotificationToken: Joi.string().required().allow(''),
    }),
});

const hello = celebrate({
    body: Joi.object({
        address: Joi.string().required(),
        token: Joi.string().allow(''),
    }),
});

const updateUsername = celebrate({
    body: Joi.object({
        address: Joi.string().required(),
        username: Joi.string().required().allow(''),
    }),
});

const updateCurrency = celebrate({
    body: Joi.object({
        address: Joi.string().required(),
        currency: Joi.string().required(),
    }),
});

const updatePushNotificationsToken = celebrate({
    body: Joi.object({
        address: Joi.string().required(),
        token: Joi.string().required(),
    }),
});

const updateLanguage = celebrate({
    body: Joi.object({
        address: Joi.string().required(),
        language: Joi.string().required(),
    }),
});

const updateGender = celebrate({
    body: Joi.object({
        address: Joi.string().required(),
        gender: Joi.string().required().allow(''),
    }),
});

const updateAge = celebrate({
    body: Joi.object({
        address: Joi.string().required(),
        age: Joi.number().required().allow(null),
    }),
});

const updateChildren = celebrate({
    body: Joi.object({
        address: Joi.string().required(),
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
