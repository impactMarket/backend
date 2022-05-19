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
     *         name: filterByActive
     *         schema:
     *           type: boolean
     *         required: false
     *         description: filter by active/inactive/both (if filterByActive = undefined return both)
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
     * /community/beneficiaries:
     *   get:
     *     tags:
     *       - "community"
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
     *         name: suspect
     *         schema:
     *           type: boolean
     *         required: false
     *         description: filter by suspect users
     *       - in: query
     *         name: inactivity
     *         schema:
     *           type: boolean
     *         required: false
     *         description: filter by inactivity users
     *       - in: query
     *         name: unidentified
     *         schema:
     *           type: boolean
     *         required: false
     *         description: filter by unidentified users
     *       - in: query
     *         name: loginInactivity
     *         schema:
     *           type: boolean
     *         required: false
     *         description: filter by login inactivity
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         required: false
     *         description: search by address or username
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
};
