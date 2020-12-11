import { Request, Response, NextFunction } from 'express';
import CommunityService from '../services/community';

const create = async (req: Request, res: Response) => {
    const { name, description } = req.body;
    console.log('req.body', req.body, req.file);

    res.status(201).send('ok');
}

const list = (req: Request, res: Response) => {
    CommunityService.list().then((r) => res.send(r)).catch((e) => res.status(500).send(e));
}

export default {
    create,
    list
}