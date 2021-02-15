import { controllerLogAndFail } from '@utils/api';
import { Request, Response } from 'express';
import StoriesService from '@services/stories';
import { RequestWithUser } from '@ipcttypes/core';

const storiesService = new StoriesService();

const add = (req: Request, res: Response) => {
    storiesService
        .add(req.body)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const has = (req: RequestWithUser, res: Response) => {
    if (req.user === undefined) {
        controllerLogAndFail('User not identified!', 400, res);
        return;
    }
    storiesService
        .has(req.user.address)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const getByOrder = (req: Request, res: Response) => {
    storiesService
        .getByOrder(req.params.order, req.query)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const love = (req: Request, res: Response) => {
    storiesService
        .love(req.body.contentId)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

export default { add, has, getByOrder, love };
