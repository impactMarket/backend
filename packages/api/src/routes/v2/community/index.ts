import { Router } from 'express';

import details from './details';

import { CommunityController } from '../../../controllers/v2/community/index';

export default (app: Router): void => {
    const controller = new CommunityController();

    const route = Router();

    app.use('/community', route);

    details(route);

    /**
     * @swagger
     *
     * /community:
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
     *         name: name
     *         schema:
     *           type: string
     *         required: false
     *         description: communities name to search
     *       - in: query
     *         name: country
     *         schema:
     *           type: string
     *         required: false
     *         description: communities country (identifier, like PT for Portugal) to search, separated by ; (PT;FR)
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
     route.get('/:query?', controller.list);
};
