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
    /**
     * @swagger
     *
     * /community/publicid/publicId:
     *   deprecated: true
     */
    route.get('/publicid/:publicId', communityController.getByPublicId);
    route.get('/id/:id', communityController.findById);
    route.get('/contract/:address', communityController.getByContractAddress);
    /**
     * @swagger
     *
     * /community/hssi/publicId:
     *   deprecated: true
     */
    route.get(
        '/hssi/:publicId',
        communityController.getHistoricalSSIByPublicId
    );
    route.get('/historical-ssi/:id', communityController.getHistoricalSSI);
    /**
     * @swagger
     *
     * /community/beneficiaries/find/{beneficiaryQuery}/{active}:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Find a beneficiary in manager's community
     *     parameters:
     *       - in: path
     *         name: beneficiaryQuery
     *         schema:
     *           type: string
     *         required: true
     *         description: Address or (part of) name
     *       - in: path
     *         name: active
     *         schema:
     *           type: boolean
     *         required: false
     *         description: Active, inactive or irrelevante (not defined)
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/beneficiaries/find/:beneficiaryQuery/:active?',
        authenticateToken,
        communityController.searchBeneficiary
    );

    /**
     * @swagger
     *
     * /community/beneficiaries/search/{active}/beneficiaryQuery:
     *   deprecated: true
     */
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
