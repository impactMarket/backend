import communityController from '@controllers/community';
import communityValidators from '@validators/community';
import { Router } from 'express';
import multer from 'multer';

import { cacheWithRedis } from '../../database';
import { adminAuthentication, authenticateToken } from '../middlewares';

export default (app: Router): void => {
    const controller = new communityController.CommunityController();

    const route = Router();
    const storage = multer.memoryStorage();
    const upload = multer({ storage });

    app.use('/community', route);

    // admin endpoints

    route.delete('/:id', adminAuthentication, controller.delete);
    route.post(
        '/accept',
        communityValidators.accept,
        communityController.accept
    );
    route.get('/pending', communityController.pending);

    // end admin endpoints

    /**
     * @deprecated
     */
    route.get(
        '/ubiparams/:publicId',
        cacheWithRedis('10 minutes'),
        communityController.getResquestChangeUbiParams
    );
    /**
     * @swagger
     *
     * /community/publicid/publicId:
     *   deprecated: true
     */
    route.get(
        '/publicid/:publicId',
        cacheWithRedis('10 minutes'),
        communityController.getByPublicId
    );
    /**
     * @deprecated use /list
     */
    route.get(
        '/list/light/:order?',
        cacheWithRedis('10 minutes'),
        communityController.listLight
    );
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

    route.get(
        '/:id/historical-ssi',
        cacheWithRedis('1 day'),
        communityController.getHistoricalSSI
    );

    // new

    route.get(
        '/address/:address',
        cacheWithRedis('10 minutes'),
        controller.findByContractAddress
    );

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
        '/picture/:isPromoter?',
        upload.single('imageFile'),
        authenticateToken,
        controller.pictureAdd
    );

    /**
     * @swagger
     *
     * /community/list:
     *   get:
     *     tags:
     *       - "community"
     *     summary: List communities
     *     parameters:
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *           enum: [nearest, out_of_funds, newest, bigger]
     *         required: false
     *         description: communities list order (bigger by default)
     *       - in: query
     *         name: filter
     *         schema:
     *           type: string
     *           enum: [featured]
     *         required: false
     *         description: communities filters (no filter by default)
     *       - in: query
     *         name: extended
     *         schema:
     *           type: boolean
     *         required: false
     *         description: include community metrics and contract parameters
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for community pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for community pagination
     *       - in: query
     *         name: lat
     *         schema:
     *           type: number
     *         required: false
     *         description: latitude used for nearest location
     *       - in: query
     *         name: lng
     *         schema:
     *           type: number
     *         required: false
     *         description: longitude used for nearest location
     *     responses:
     *       "200":
     *         description: OK
     */
    route.get('/list/:query?', cacheWithRedis('10 minutes'), controller.list);

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

    route.get(
        '/:id/ubi',
        cacheWithRedis('10 minutes'),
        controller.findRequestChangeUbiParams
    );

    /**
     * @swagger
     *
     * /community/{id}/past-ssi:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Historical SSI
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
    route.get(
        '/:id/past-ssi',
        cacheWithRedis('10 minutes'),
        controller.getPastSSI
    );

    /**
     * @swagger
     *
     * /community/{id}/dashboard:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community dashboard details
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
    route.get(
        '/:id/dashboard',
        cacheWithRedis('1 hour'),
        controller.getDashboard
    );

    /**
     * @swagger
     *
     * /community/{id}/demographics:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community demographics
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
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UbiCommunityDemographics'
     */
    route.get(
        '/:id/demographics',
        cacheWithRedis('1 day'),
        controller.getDemographics
    );

    /**
     * @swagger
     *
     * /community/{id}/claim-location:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community claim locations
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
    route.get(
        '/:id/claim-location',
        cacheWithRedis('1 day'),
        controller.getClaimLocation
    );

    /**
     * @swagger
     *
     * /community/{id}/managers:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community managers
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
    route.get('/:id/managers', controller.getManagers);

    /**
     * @swagger
     *
     * /community/{id}/promoter:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community promoter
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
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UbiPromoter'
     */
    route.get('/:id/promoter', controller.getPromoter);

    /**
     * @swagger
     *
     * /community/{id}/suspect:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get suspicious community activity
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
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UbiCommunitySuspect'
     */
    route.get('/:id/suspect', controller.getSuspect);

    /**
     * @swagger
     *
     * /community/{id}/contract:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community contract UBI parameters
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
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UbiCommunityContract'
     */
    route.get('/:id/contract', controller.getContract);

    /**
     * @swagger
     *
     * /community/{id}/state:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community state
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
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UbiCommunityState'
     */
    route.get('/:id/state', controller.getState);

    /**
     * @swagger
     *
     * /community/{id}/metrics:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get community metrics
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
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UbiCommunityDailyMetrics'
     */
    route.get('/:id/metrics', controller.getMetrics);

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
    route.get('/:id', cacheWithRedis('10 minutes'), controller.findById);

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
};
