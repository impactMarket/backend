import { Router } from 'express';

import { CommunityController } from '../../../controllers/v2/community/details';
import { authenticateToken } from '../../../middlewares';
import { optionalAuthentication } from '../../../middlewares';

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
     *         name: action
     *         schema:
     *           type: string
     *           enum: [search, list]
     *         required: false
     *         description: search or list beneficiaries in a community (list by default)
     *       - in: query
     *         name: active
     *         schema:
     *           type: boolean
     *         required: false
     *         description: filter search/list by active/inactive/both (both by default)
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
     * /community/beneficiaries/activity/{address}:
     *   get:
     *     tags:
     *       - "community"
     *     summary: Get beneficiary activity
     *     parameters:
     *       - in: path
     *         name: address
     *         schema:
     *           type: string
     *         required: true
     *         description: beneficiary address
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: [all, claim, transaction, registry]
     *         required: false
     *         description: activity type (all by default)
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
     *         description: limit used for community pagination (default 10)
     *     security:
     *     - api_auth:
     *       - "write:modify":
     *     responses:
     *       "200":
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/BeneficiaryActivities'
     */
     route.get(
          '/beneficiaries/activity/:address/:query?',
          authenticateToken,
          controller.getBeneficiaryActivity
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
