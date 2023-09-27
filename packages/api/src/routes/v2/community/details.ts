import { Router } from 'express';
import multer from 'multer';

import { CommunityController } from '../../../controllers/v2/community/details';
import { authenticateToken, optionalAuthentication, verifySignature } from '../../../middlewares';
import { cache } from '../../../middlewares/cache-redis';
import { cacheIntervals } from '../../../utils/api';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8000000 // 8MB
    }
});

export default (route: Router): void => {
    const controller = new CommunityController();

    /**
     * @swagger
     *
     * /communities/count:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Count grouped communities
     *     parameters:
     *       - in: query
     *         name: groupBy
     *         schema:
     *           type: string
     *           enum: [country, review, reviewByCountry]
     *         required: true
     *         description: count communities by a grouped value
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [pending, valid, removed]
     *         required: false
     *         description: community status
     *       - in: query
     *         name: ambassadorAddress
     *         schema:
     *           type: string
     *         required: false
     *         description: filter communities by ambassadors
     *       - in: query
     *         name: excludeCountry
     *         schema:
     *           type: string
     *         required: false
     *         description: countries to ignore, separated by comma (PT;FR)
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   unknown:
     *                     type: string
     *                     description: this variable name changes depending on the request. If the groupBy is "country" then this variable is named "country" and the value is the country.
     *                   count:
     *                     type: string
     */
    route.get('/count/:query?', controller.count);

    /**
     * @swagger
     *
     * /communities/{id}/managers:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Get community managers
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: community id
     *       - in: query
     *         name: state
     *         schema:
     *           type: string
     *           enum: [0, 1]
     *         required: false
     *         description: manager state (0 - active, 1 - removed)
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for community pagination (default 0)
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for community pagination (default 5)
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         required: false
     *         description: search by address or firstName
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *         required: false
     *         description: order key and order direction separated by colon (since:desc)
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/getManagersResponse'
     */
    route.get('/:id/managers/:query?', optionalAuthentication, controller.getManagers);

    /**
     * @swagger
     *
     * /communities/{id}/contract:
     *   get:
     *     tags:
     *       - "communities"
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
     * /communities/{id}/ambassador:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Get community ambassador
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
    route.get('/:id/ambassador', optionalAuthentication, controller.getAmbassador);

    /**
     * @swagger
     *
     * /communities/{id}/merchant:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Get community merchant
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
    route.get('/:id/merchant', controller.getMerchant);

    /**
     * @swagger
     *
     * /communities/{id}/beneficiaries:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Find or list beneficiaries
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: community id
     *       - in: query
     *         name: state
     *         schema:
     *           type: string
     *           enum: [0, 1, 2]
     *         required: false
     *         description: beneficiary state (0 - active, 1 - removed, 2 - locked)
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *         required: false
     *         description: offset used for community pagination (default 0)
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: limit used for community pagination (default 5)
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         required: false
     *         description: search by address or firstName
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *         required: false
     *         description: order key and order direction separated by colon (claimed:desc)
     *       - in: query
     *         name: lastActivity_lt
     *         required: false
     *         descripition: timestamp to filter the inactive beneficiaries
     *     security:
     *     - BearerToken: []
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/IListBeneficiary'
     */
    route.get(
        '/:id/beneficiaries/:query?',
        authenticateToken,
        cache(cacheIntervals.halfHour),
        controller.getBeneficiaries
    );

    /**
     * @swagger
     *
     * /communities/{id}/claims-location:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Get community claims location
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
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   latitude:
     *                     type: integer
     *                   longitude:
     *                     type: integer
     */
    route.get('/:id/claims-location', cache(cacheIntervals.oneDay), controller.getClaimLocation);

    /**
     * @swagger
     *
     * /communities/media/{mime}:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Make a request for a presigned URL
     *     parameters:
     *       - in: path
     *         name: mime
     *         schema:
     *           type: string
     *         required: true
     *         description: media mimetype
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     */
    route.get('/media/:mime', authenticateToken, controller.getPresignedUrlMedia);

    /**
     * @swagger
     *
     * /communities/{id}/promoter:
     *   get:
     *     tags:
     *       - "communities"
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
     * /communities/beneficiaries:
     *   post:
     *     tags:
     *       - "communities"
     *     summary: Add beneficiaries
     *     requestBody:
     *      required: true
     *      content:
     *        multipart/form-data:
     *          schema:
     *            type: object
     *            properties:
     *              file:
     *                type: string
     *                format: binary
     *                required: true
     *     responses:
     *       "200":
     *         description: OK
     *     security:
     *     - BearerToken: []
     *     - SignatureMessage: []
     *     - Signature: []
     */
    route.post(
        '/beneficiaries',
        upload.single('file'),
        authenticateToken,
        verifySignature,
        controller.addBeneficiaries
    );

    /**
     * @swagger
     *
     * /communities/{id}/campaign:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Get community campaign
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
     *               $ref: '#/components/schemas/UbiCommunityCampaign'
     */
    route.get('/:id/campaign', cache(cacheIntervals.oneHour), controller.getCampaign);

    /**
     * @swagger
     *
     * /communities/{id-or-address}:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Get community by id or contract address
     *     parameters:
     *       - in: path
     *         name: id-or-address
     *         schema:
     *           type: string
     *         required: true
     *         description: community id or contract address
     *       - in: query
     *         name: state
     *         schema:
     *           type: string
     *           enum: [base, ubi]
     *         required: false
     *         description: community state
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UbiCommunity'
     */
    route.get('/:idOrAddress/:query?', optionalAuthentication, controller.findBy);
};
