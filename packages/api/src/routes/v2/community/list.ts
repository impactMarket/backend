import { Router } from 'express';

import { CommunityController } from '../../../controllers/v2/community/list';
import timeout from 'connect-timeout';
import { config } from '@impactmarket/core';

export default (route: Router): void => {
    const controller = new CommunityController();

    /**
     * @swagger
     *
     * /communities:
     *   get:
     *     tags:
     *       - "communities"
     *     summary: List communities
     *     parameters:
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *           enum: [nearest, out_of_funds, newest, updated, bigger]
     *         required: false
     *         description: communities list order (bigger by default)
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         required: false
     *         description: search by name or requestByAddress
     *       - in: query
     *         name: country
     *         schema:
     *           type: string
     *         required: false
     *         description: communities country (identifier, like PT for Portugal) to search, separated by comma (PT;FR)
     *       - in: query
     *         name: excludeCountry
     *         schema:
     *           type: string
     *         required: false
     *         description: countries to ignore, separated by comma (PT;FR)
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [pending, valid, removed]
     *         required: false
     *         description: community review
     *       - in: query
     *         name: review
     *         schema:
     *           type: string
     *           enum: [claimed, declined, pending, accepted]
     *         required: false
     *         description: community review
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
     *       - in: query
     *         name: ambassadorAddress
     *         schema:
     *           type: string
     *         required: false
     *         description: filter communities by ambassadors
     *       - in: query
     *         name: fields
     *         schema:
     *           type: string
     *         required: false
     *         description: especify fields to return
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
     */
    route.get('/:query?', timeout(config.communityResponseTimeout), controller.list);
};
