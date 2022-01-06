import { Router } from 'express';

import { config } from 'impactmarket-core';

const route = Router();

export default (app: Router): void => {
    app.use('/mobile', route);

    /**
     * @deprecated use /app-version
     */
    route.get('/version', (req, res) => {
        res.send({
            latest: config.mobileVersion.latest,
            minimal: config.mobileVersion.minimal,
            timestamp: new Date().getTime(),
        });
    });
};
