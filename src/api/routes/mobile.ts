import { Router } from 'express';

import config from '../../config';

const route = Router();

export default (app: Router): void => {
    app.use('/mobile', route);

    route.get('/version', (req, res) => {
        res.send({
            latest: config.mobileVersion.latest,
            minimal: config.mobileVersion.minimal,
            timestamp: new Date().getTime(),
        });
    });

    route.post('/error', (req, res) => {
        res.sendStatus(200);
    });
};
