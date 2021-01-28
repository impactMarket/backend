'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        const CommunityDailyState = await queryInterface.sequelize.define('communitydailystate', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            communityId: {
                type: Sequelize.UUID,
                references: {
                    model: 'community', // name of Target model
                    key: 'publicId', // key in Target model that we're referencing
                },
                onDelete: 'RESTRICT',
                allowNull: false
            },
            claimed: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: Sequelize.DECIMAL(27), // max 999,999,999 - plus 18 decimals
                defaultValue: 0,
                allowNull: false,
            },
            claims: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            beneficiaries: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            raised: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: Sequelize.DECIMAL(27), // max 999,999,999 - plus 18 decimals
                defaultValue: 0,
                allowNull: false,
            },
            backers: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }, {
            tableName: 'communitydailystate',
            sequelize: queryInterface.sequelize, // this bit is important
        });
        let records;
        let lastTx;
        // select "communityId", sum(amount) total, date("txAt") d
        // from inflow
        // group by "communityId", date("txAt")
        records = (await queryInterface.sequelize.query(`select "communityId", sum(amount) total, date("txAt") d
        from inflow
        group by "communityId", date("txAt")`, { raw: true }))[0];

        
        for (let index = 0; index < records.length; index++) {
            await CommunityDailyState.update({ raised: records[index].total }, { where: { communityId: records[index].communityId, date: records[index].d } });
        }

        // select "communityId", sum(amount) total, count(amount) c, date("txAt") d
        // from claim
        // group by "communityId", date("txAt")
        records = (await queryInterface.sequelize.query(`select "communityId", sum(amount) total, count(amount) c, date("txAt") d
        from inflow
        group by "communityId", date("txAt")`, { raw: true }))[0];

        
        for (let index = 0; index < records.length; index++) {
            await CommunityDailyState.update({ claimed: records[index].total, claims: records[index].c }, { where: { communityId: records[index].communityId, date: records[index].d } });
        }

        // select "communityId", count(address) total, date("txAt") d
        // from beneficiary
        // group by "communityId", date("txAt")
        records = (await queryInterface.sequelize.query(`select "communityId", count(address) total, date("txAt") d
        from beneficiary
        group by "communityId", date("txAt")`, { raw: true }))[0];

        
        for (let index = 0; index < records.length; index++) {
            lastTx = await CommunityDailyState.update({ beneficiaries: records[index].total }, { where: { communityId: records[index].communityId, date: records[index].d } });
        }
        return lastTx;
    },

    down(queryInterface, Sequelize) {
    }
}  