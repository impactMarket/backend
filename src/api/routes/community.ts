import communityController from '@controllers/community';
import communityValidators from '@validators/community';
import { Router } from 'express';

import { adminAuthentication, authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const route = Router();

    app.use('/community', route);

    route.get(
        '/ubiparams/:publicId',
        communityController.getResquestChangeUbiParams
    );
    route.get('/publicid/:publicId', communityController.getByPublicId);
    route.get('/contract/:address', communityController.getByContractAddress);
    route.get('/hssi/:publicId', communityController.getHistoricalSSI);
    route.get(
        '/beneficiaries/search/:active/:beneficiaryQuery',
        authenticateToken,
        communityController.searchBeneficiary
    );
    route.get(
        '/managers/search/:managerQuery',
        authenticateToken,
        communityController.searchManager
    );
    route.get(
        '/beneficiaries/list/:active/:offset/:limit',
        authenticateToken,
        communityController.listBeneficiaries
    );
    route.get(
        '/managers/list/:offset/:limit',
        authenticateToken,
        communityController.listManagers
    );
    /**
     * @deprecated Deprecated in mobile-app@1.0.2
     */
    route.get('/managers', authenticateToken, communityController.managers);
    /**
     * @deprecated Deprecated in mobile-app@1.0.2
     */
    route.get(
        '/managers/details',
        authenticateToken,
        communityController.managersDetails
    );
    /**
     * @swagger
     *
     * /list/light/{order}:
     *   get:
     *     tags:
     *       - "community"
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: order
     *         in: path
     *         type: string
     */
    route.get('/list/light/:order?', communityController.list);
    route.get('/list/full/:order?', communityController.listFull);
    route.post(
        '/add',
        authenticateToken,
        communityValidators.add,
        communityController.add
    );
    route.post(
        '/edit',
        authenticateToken,
        communityValidators.edit,
        communityController.edit
    );
    // TODO: add verification (not urgent, as it highly depends on the contract transaction)
    route.post(
        '/accept',
        communityValidators.accept,
        communityController.accept
    );
    route.post(
        '/remove',
        adminAuthentication,
        communityValidators.remove,
        communityController.remove
    );
    route.get('/pending', communityController.pending);
};
