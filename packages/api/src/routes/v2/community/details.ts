import { database } from '@impactmarket/core';
import { Router } from 'express';

import { CommunityController } from '../../../controllers/v2/community/details';
import {
    authenticateToken,
    optionalAuthentication,
} from '../../../middlewares';

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
     *       - in: query
     *         name: state
     *         schema:
     *           type: string
     *           enum: [active, removed]
     *         required: false
     *         description: manager state
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
     *         description: search by address or username
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
    route.get('/:id/managers/:query?', controller.getManagers);

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
    route.get('/:id/ambassador', controller.getAmbassador);

    /**
     * @swagger
     *
     * /communities/beneficiaries:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: Find or list beneficiaries in manager's community
     *     parameters:
     *       - in: query
     *         name: state
     *         schema:
     *           type: string
     *           enum: [active, removed]
     *         required: false
     *         description: beneficiary state
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
     *         description: search by address or username
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *         required: false
     *         description: order key and order direction separated by colon (claimed:desc)
     *     security:
     *     - api_auth:
     *       - "write:modify":
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/IListBeneficiary'
     */
    route.get(
        '/beneficiaries/:query?',
        authenticateToken,
        controller.getBeneficiaries
    );

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
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UbiCommunity'
     */
    route.get('/:idOrAddress', optionalAuthentication, controller.findBy);

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
     route.get(
        '/:id/claims-location',
        database.cacheWithRedis('1 day', database.cacheOnlySuccess),
        controller.getClaimLocation
    );

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
     *     - api_auth:
     *       - "write:modify":
     */
     route.get(
        '/media/:mime',
        authenticateToken,
        controller.getPresignedUrlMedia
    );
};
