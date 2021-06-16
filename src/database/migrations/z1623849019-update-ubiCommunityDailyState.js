'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        const previous = new Date();
        const current = new Date();
        previous.setDate(previous.getDate() - 31);
        current.setDate(current.getDate() - 1);
        for (let index = 1; index < 31; index++) {
            const query = `select c.id as id, count(distinct "from") backers from inflow i, community c where i."communityId" = c."publicId" and date("txAt") >= '${
                previous.toISOString().split('T')[0]
            }' and  date("txAt") <= '${
                current.toISOString().split('T')[0]
            }' group by c.id`;
            const monthlyBackersInCommunity =
                await queryInterface.sequelize.query(query, {
                    raw: true,
                    type: Sequelize.QueryTypes.SELECT,
                });
            for (const community in monthlyBackersInCommunity) {
                const element = monthlyBackersInCommunity[community];
                await queryInterface.sequelize.query(
                    `update ubi_community_daily_state set "monthlyBackers"=${parseInt(
                        element.backers,
                        10
                    )} where "communityId" = '${parseInt(element.id, 10)}'`
                );
            }
            previous.setDate(previous.getDate() - 1);
            current.setDate(current.getDate() - 1);
        }
    },

    down(queryInterface, Sequelize) {},
};
