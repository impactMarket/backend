import communityController from '@controllers/community';
import communityValidators from '@validators/community';
import { Router } from 'express';
import multer from 'multer';

import { adminAuthentication, authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const route = Router();
    const storage = multer.memoryStorage();
    const upload = multer({ storage });

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
    /**
     * @deprecated use /list
     */
    route.get('/list/light/:order?', communityController.listLight);
    /**
     * @deprecated use /list
     */
    route.get('/list/full/:order?', communityController.listFull);
    route.get('/list/:query?', communityController.list);
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
        communityController.pictureAdd
    );
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
    /**
     * @deprecated Deprecated in mobile-app@1.1.0
     */
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
     * @swagger
     *
     * /community/add:
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
        '/add',
        authenticateToken,
        communityValidators.add,
        communityController.add
    );
    /**
     * @swagger
     *
     * /community/edit:
     *   post:
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

    /**
     * @swagger
     *
     * /community/{id}/historical-ssi:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Historical SSI
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/:id/historical-ssi', communityController.getHistoricalSSI);
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
    route.get('/:id/dashboard', communityController.getDashboard);
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
    route.get('/:id/claim-location', communityController.getClaimLocation);
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
    route.get('/:id/managers', communityController.getManagers);
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
    route.get('/:id', communityController.findById);
};
