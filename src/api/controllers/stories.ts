import { controllerLogAndFail } from '@utils/api';
import { Request, Response } from 'express';
import StoriesService from '@services/stories';

const add = (req: Request, res: Response) => {
    StoriesService.add(req.body)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const getByOrder = (req: Request, res: Response) => {
    StoriesService.getByOrder(req.params.order, req.query)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

const love = (req: Request, res: Response) => {
    StoriesService.love(req.body.contentId)
        .then((r) => res.send(r))
        .catch((e) => controllerLogAndFail(e, 400, res));
};

export default { add, getByOrder, love };
