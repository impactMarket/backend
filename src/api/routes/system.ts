import systemValidators from '@validators/system';
import { Router } from 'express';

import { models } from '../../database';

export default (app: Router): void => {
    const subscribersModel = models.subscribers;
    app.get('/clock', (req, res) => res.json(new Date().getTime()));

    app.post('/subscribe', systemValidators.subscribe, (req, res) => {
        const { email } = req.body;
        subscribersModel
            .create({
                email,
            })
            .then(() => res.sendStatus(200))
            .catch(() => res.sendStatus(400));
    });
};
