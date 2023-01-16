import { Router, Request, Response } from 'express';

export default (app: Router): void => {
    const route = Router();
    app.use('/exchange-rates', route);

    /**
     * @deprecated use /exchange-rate
     */
    route.get('/', (req: Request, res: Response) => {
        res.sendStatus(200);
    });
};
