'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        const CommunityState = await queryInterface.sequelize.define('communitystate', {
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
                type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
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
                type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                defaultValue: 0,
                allowNull: false,
            },
            backers: {
                type: Sequelize.INTEGER, // max 2,147,483,647
                defaultValue: 0,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            }
        }, {
            tableName: 'communitystate',
            sequelize: queryInterface.sequelize, // this bit is important
        });
        let records;
        let lastTx;
        // select "communityId", sum(amount) total
        // from inflow
        // group by "communityId"
        records = (await queryInterface.sequelize.query(`select "communityId", sum(amount) total
        from inflow
        group by "communityId"`, { raw: true }))[0];

        
        for (let index = 0; index < records.length; index++) {
            await CommunityState.update({ raised: records[index].total }, { where: { communityId: records[index].communityId } });
        }

        // select "communityId", sum(amount) total
        // from claim
        // group by "communityId"
        records = (await queryInterface.sequelize.query(`select "communityId", count(amount) c, sum(amount) total
        from claim
        group by "communityId"`, { raw: true }))[0];

        
        for (let index = 0; index < records.length; index++) {
            await CommunityState.update({ claimed: records[index].total,  claims: records[index].c }, { where: { communityId: records[index].communityId } });
        }

        // select "communityId", count(address) total
        // from beneficiary
        // where active = true
        // group by "communityId"
        records = (await queryInterface.sequelize.query(`select "communityId", count(address) total
        from beneficiary
        where active = true
        group by "communityId"`, { raw: true }))[0];

        
        for (let index = 0; index < records.length; index++) {
            lastTx = await CommunityState.update({ beneficiaries: records[index].total }, { where: { communityId: records[index].communityId } });
        }
        return lastTx;
    },

    down(queryInterface, Sequelize) {
    }
}  