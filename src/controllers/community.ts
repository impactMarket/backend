import { Request, Response, NextFunction } from 'express';

const create = async (req: Request, res: Response) => {
    const { name, description } = req.body;
    console.log('req.body', req.body, req.file);

    res.status(201).send('ok');
}

export default {
    create
}