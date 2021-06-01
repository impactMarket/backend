import { Router } from 'express';

import config from '../../config';
import { cacheWithRedis } from '../../database';

const route = Router();

export default (app: Router): void => {
    app.use('/mobile', route);

    route.get('/version', cacheWithRedis('6 hours'), (req, res) => {
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
