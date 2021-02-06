import { Logger } from '@utils/logger';
import { Response } from 'express';

export const controllerLogAndFail = (e: any, status: number, res: Response) => {
    Logger.error(e);
    res.status(status).send(e);
};
