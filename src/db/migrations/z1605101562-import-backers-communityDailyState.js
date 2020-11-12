'use strict';

const BigNumber = require("bignumber.js");

module.exports = {
    up: async (queryInterface, Sequelize) => {
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
        const Inflow = await queryInterface.sequelize.define('inflow', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            from: {
                type: Sequelize.STRING(44),
                allowNull: false
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
            amount: {
                // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                type: Sequelize.DECIMAL(29), // max 9,999,999,999 - plus 18 decimals
                allowNull: false,
            },
            tx: {
                type: Sequelize.STRING(68),
                unique: true,
                allowNull: false,
            },
            txAt: {
                type: Sequelize.DATE,
                allowNull: false,
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
            tableName: 'inflow',
            sequelize: queryInterface.sequelize, // this bit is important
        });

        let firstDay = new Date(1598140800000); // 2020-08-23
        firstDay.setHours(0, 0, 0, 0);
        let lastDay = new Date(1600862400000); // 2020-09-23
        lastDay.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let lastTx;
        while (lastDay < today) {
            const activeBackers = await Inflow.findAll({
                attributes: [
                    [Sequelize.fn('count', Sequelize.fn('distinct', Sequelize.col('from'))), 't'],
                    'communityId'
                ],
                where: {
                    txAt: {
                        [Sequelize.Op.lte]: lastDay,
                        [Sequelize.Op.gte]: firstDay,
                    }
                },
                group: ['communityId'],
                raw: true
            });
            // TODO: update community table
            if (activeBackers.length > 0) {
                for (let index = 0; index < activeBackers.length; index++) {
                    const element = activeBackers[index];
                    lastTx = await CommunityDailyState.update({ backers: element.t }, { where: { communityId: element.communityId } });
                }
            }
            // increment one day
            firstDay = new Date(firstDay.getTime() + 86400000);
            lastDay = new Date(lastDay.getTime() + 86400000);
        }
        return lastTx;
    },

    down(queryInterface, Sequelize) {
    },
};
