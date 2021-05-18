import communityController from '@controllers/community';
import communityValidators from '@validators/community';
import { Router } from 'express';
import multer from 'multer';

import { adminAuthentication, authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const controller = new communityController.CommunityController();

    const route = Router();
    const storage = multer.memoryStorage();
    const upload = multer({ storage });

    app.use('/community', route);

    /**
     * @deprecated
     */
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
    /**
     * @deprecated use /list
     */
    route.get('/list/light/:order?', communityController.listLight);
    /**
     * @deprecated use /list
     */
    route.get('/list/full/:order?', communityController.listFull);
    /**
     * @deprecated
     */
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
    /**
     * @deprecated
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
    /**
     * @deprecated Deprecated in mobile-app@1.1.0
     */
    route.get(
        '/managers/search/:managerQuery',
        authenticateToken,
        communityController.searchManager
    );
    /**
     * @deprecated
     */
    route.get(
        '/beneficiaries/list/:active/:offset/:limit',
        authenticateToken,
        communityController.listBeneficiaries
    );
    /**
     * @deprecated Deprecated in mobile-app@1.1.0
     */
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
     * @deprecated
     */
    route.post(
        '/add',
        authenticateToken,
        communityValidators.add,
        communityController.add
    );
    /**
     * @deprecated
     */
    route.post(
        '/edit',
        authenticateToken,
        communityValidators.edit,
        communityController.edit
    );
    // TODO: add verification (not urgent, as it highly depends on the contract transaction)
    // route.post(
    //     '/accept',
    //     communityValidators.accept,
    //     communityController.accept
    // );
    route.post(
        '/remove',
        adminAuthentication,
        communityValidators.remove,
        communityController.remove
    );
    // route.get('/pending', communityController.pending);

    route.get('/:id/historical-ssi', communityController.getHistoricalSSI);

    // new

    route.get('/address/:address', controller.findByContractAddress);
    /**
     * @swagger
     *
     * /community/beneficiaries/{query}:
     *   get:
     *     summary: Find or list beneficiaries in manager's community
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.get(
        '/beneficiaries/:query?',
        authenticateToken,
        controller.beneficiaries
    );

    /**
     * @swagger
     *
     * /community/create:
     *   post:
     *     tags:
     *       - "community"
     *     summary: Create community
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post(
        '/create',
        authenticateToken,
        communityValidators.create,
        communityController.create
    );

    route.get('/list/:query?', controller.list);
    /**
     * @swagger
     *
     * /community/picture:
     *   post:
     *     tags:
     *       - "community"
     *     summary: Add a community picture
     *     requestBody:
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               imageFile:
     *                 type: string
     *                 format: binary
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post(
        '/picture/:isOrganization?',
        upload.single('imageFile'),
        authenticateToken,
        controller.pictureAdd
    );

    /**
     * @swagger
     *
     * /community/create:
     *   post:
     *     tags:
     *       - "community"
     *     summary: Add a new community
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.post(
        '/create',
        authenticateToken,
        communityValidators.create,
        communityController.create
    );

    route.get('/:id/ubi', controller.findRequestChangeUbiParams);

    /**
     * @swagger
     *
     * /community/{id}/past-ssi:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Historical SSI
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/:id/past-ssi', controller.getPastSSI);

    /**
     * @swagger
     *
     * /community/{id}/dashboard:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community dashboard details
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/:id/dashboard', controller.getDashboard);

    /**
     * @swagger
     *
     * /community/{id}/claim-location:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community claim locations
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/:id/claim-location', controller.getClaimLocation);

    /**
     * @swagger
     *
     * /community/{id}/managers:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community managers
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/:id/managers', controller.getManagers);

    /**
     * @swagger
     *
     * /community/{id}:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Find a beneficiary in manager's community
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: community id
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/:id', controller.findById);

    /**
     * @swagger
     *
     * /community:
     *   put:
     *     tags:
     *       - "community"
     *     summary: Edit existing community
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - api_auth:
     *       - "write:modify":
     */
    route.put(
        '/',
        authenticateToken,
        communityValidators.edit,
        controller.edit
    );

    // admin endpoints

    route.delete('/:id', adminAuthentication, controller.delete);
    route.post(
        '/accept',
        communityValidators.accept,
        communityController.accept
    );
    route.get('/pending', communityController.pending);
};
