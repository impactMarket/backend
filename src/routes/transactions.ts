import { Router, Request, Response } from 'express';
import TransactionsService from '../services/transactions';
// import middlewares from '../middlewares';
const route = Router();

export default (app: Router) => {
    app.use('/transactions', route);

    route.get(
        '/',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.getAll());
        });

    route.get(
        '/:account',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.get(req.params.account));
        });

    route.get(
        '/beneficiariesof/:communityContractAddress',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.getCommunityBeneficicaries(req.params.communityContractAddress));
        });

    route.get(
        '/beneficiaryin/:beneficiaryAddress',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.findComunityToBeneficicary(req.params.beneficiaryAddress));
        });

    route.get(
        '/managerin/:managerAddress',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.findComunityToManager(req.params.managerAddress));
        });
};