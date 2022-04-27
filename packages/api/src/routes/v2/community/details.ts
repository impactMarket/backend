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
