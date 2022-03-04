import { utils } from 'ethers';
import { Op } from 'sequelize';

import { models } from '../../../database';
import { AppUser } from '../../../interfaces/app/appUser';
import { getCommunityManagers } from '../../../subgraph/queries/community';

export class CommunityDetailsService {
    /**
     * @swagger
     *  components:
     *    schemas:
     *      getManagersResponse:
     *        type: object
     *        properties:
     *          address:
     *            type: string
     *            description: Manager address
     *          username:
     *            type: string
     *            nullable: true
     *            description: Manager username or null
     *          isDeleted:
     *            type: boolean
     *            description: True if manager deleted account
     *          state:
     *            type: integer
     *            description: Manager state (see subgraph schema for more details)
     *          added:
     *            type: integer
     *            description: Number of beneficiaries added by manager
     *          removed:
     *            type: integer
     *            description: Number of beneficiaries removed by manager
     *          since:
     *            type: integer
     *            description: Unix timestamp of when the manager was added
     */
    public async getManagers(
        communityId: number,
        active: boolean | undefined
    ): Promise<
        {
            address: string;
            username: string | null;
            isDeleted: boolean;
            state: number;
            added: number;
            removed: number;
            since: number;
        }[]
    > {
        const community = (await models.community.findOne({
            where: { id: communityId },
        }))!;

        if (community.status === 'pending') {
            const user = await models.appUser.findOne({
                attributes: ['address', 'username'],
                where: {
                    address: community.requestByAddress,
                },
            });
            return [
                {
                    address: user!.address,
                    username: user!.username,
                    isDeleted: false,
                    state: 0,
                    added: 0,
                    removed: 0,
                    since: 0,
                },
            ];
        } else {
            // contract address is only null while pending
            let managers = await getCommunityManagers(
                community.contractAddress!
            );
            managers = managers.map((m) => ({
                ...m,
                address: utils.getAddress(m.address),
            }));
            if (active !== undefined) {
                managers = managers.filter((m) => m.state === (active ? 0 : 1));
            }

            const result = await models.appUser.findAll({
                attributes: ['address', 'username'],
                where: {
                    address: { [Op.in]: managers.map((m) => m.address) },
                },
            });

            const users = result
                .map((u) => u.toJSON() as AppUser)
                .reduce((r, e) => {
                    r[e.address] = e;
                    return r;
                }, {});

            return managers.map((m) => ({
                ...m,
                ...users[m.address],
                isDeleted: !users[m.address],
            }));
        }
    }
}
