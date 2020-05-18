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
        '/beneficiaryin/:beneficiaryAddress',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.findComunityToBeneficicary(req.params.beneficiaryAddress));
        });

    route.get(
        '/managerin/:managerAddress',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.findComunityToManager(req.params.managerAddress));
        });

    route.get(
        '/community/beneficiaries/:communityContractAddress',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.getBeneficiariesInCommunity(req.params.communityContractAddress));
        });

    route.get(
        '/community/managers/:communityContractAddress',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.getCommunityManagersInCommunity(req.params.communityContractAddress));
        });

    route.get(
        '/community/backers/:communityContractAddress',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.getBackersInCommunity(req.params.communityContractAddress));
        });

    route.get(
        '/community/vars/:communityContractAddress',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.getCommunityVars(req.params.communityContractAddress));
        });

    route.get(
        '/community/raised/:communityContractAddress',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.getCommunityRaisedAmount(req.params.communityContractAddress));
        });

    route.get(
        '/community/claimed/:communityContractAddress',
        async (req: Request, res: Response) => {
            return res.send(await TransactionsService.getCommunityClaimedAmount(req.params.communityContractAddress));
        });
};