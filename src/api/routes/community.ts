import { Router } from 'express';
import communityController from '@controllers/community';
import communityValidators from '@validators/community';
import { authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const route = Router();

    app.use('/community', route);

    /**
     * @deprecated Deprecated in mobile-app@0.1.7
     */
    route.get(
        '/address/:contractAddress',
        communityController.findByContractAddress
    );
    /**
     * @deprecated Deprecated in mobile-app@0.1.7
     */
    route.get(
        '/id/:publicId',
        communityController.findByPublicId
    );

    route.get(
        '/publicid/:publicId',
        communityController.getByPublicId
    );
    route.get(
        '/contract/:address',
        communityController.getByContractAddress
    );
    route.get(
        '/hssi/:publicId',
        communityController.getHistoricalSSI
    );
    route.get(
        '/beneficiaries/search/:active/:beneficiaryQuery',
        authenticateToken,
        communityController.searchBeneficiary
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
     * @deprecated Deprecated in mobile-app@0.1.7
     */
    route.get(
        '/all/:status',
        communityController.getAll
    );
    /**
     * @deprecated Deprecated in mobile-app@0.1.8
     */
    route.get(
        '/managers',
        authenticateToken,
        communityController.managers
    );
    /**
     * @deprecated Deprecated in mobile-app@0.1.8
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
    /**
     * @deprecated Deprecated in mobile version 0.1.4
     */
    route.get('/list', communityController.list);
    route.get('/list/full/:order?', communityController.listFull);
    route.post(
        '/add',
        authenticateToken,
        communityValidators.add,
        communityController.add
    );
    /**
     * @deprecated Deprecated in mobile version 0.1.8
     */
    route.post(
        '/create',
        authenticateToken,
        communityValidators.create,
        communityController.create
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
    route.get(
        '/pending',
        communityController.pending
    );
};
