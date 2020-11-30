import { Router, Request, Response } from 'express';

import { Community } from '../db/models/community';
import { Transactions } from '../db/models/transactions';
import CommunityService from '../services/community';
import TransactionsService from '../services/transactions';
import { ICommunityInfo } from '../types';
// import middlewares from '../middlewares';
const route = Router();

export default (app: Router): void => {
    app.use('/transactions', route);

    route.get('/', async (req: Request, res: Response) => {
        return res.send(await TransactionsService.getAll());
    });

    route.get('/:account', async (req: Request, res: Response) => {
        return res.send(await TransactionsService.get(req.params.account));
    });

    route.get(
        '/beneficiaryin/:beneficiaryAddress',
        async (req: Request, res: Response) => {
            const community = await TransactionsService.findComunityToBeneficicary(
                req.params.beneficiaryAddress
            );
            if (community !== undefined) {
                const communityInfo = await CommunityService.findByContractAddress(
                    community.contractAddress
                );
                return res.send(communityInfo);
            }
            return res.send(community);
        }
    );

    route.get(
        '/managerin/:managerAddress',
        async (req: Request, res: Response) => {
            let community: Transactions | Community | null;
            let communityInfo: ICommunityInfo | null = null;
            community = await TransactionsService.findComunityToManager(
                req.params.managerAddress
            );
            if (community === null) {
                // look for pending community to this user
                community = await CommunityService.findByFirstManager(
                    req.params.managerAddress
                );
                if (community !== null) {
                    communityInfo = await CommunityService.findByPublicId(
                        community.publicId
                    );
                }
            } else {
                communityInfo = await CommunityService.findByContractAddress(
                    community.contractAddress
                );
            }
            return res.send(communityInfo);
        }
    );
};
