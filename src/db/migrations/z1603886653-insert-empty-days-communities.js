'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const Community = await queryInterface.sequelize.define('community', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            publicId: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                unique: true,
                allowNull: false,
            },
            requestByAddress: {
                type: Sequelize.STRING(44),
                unique: true,
                allowNull: false,
            },
            contractAddress: {
                type: Sequelize.STRING(44),
            },
            name: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            description: {
                type: Sequelize.STRING(1024),
                allowNull: false
            },
            descriptionEn: {
                type: Sequelize.STRING(1024),
                allowNull: true
            },
            language: {
                type: Sequelize.STRING(8),
                defaultValue: 'en',
                allowNull: false
            },
            currency: {
                type: Sequelize.STRING(4),
                defaultValue: 'USD',
                allowNull: false
            },
            city: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            country: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            gps: {
                type: Sequelize.JSON,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            visibility: {
                type: Sequelize.ENUM('public', 'private'),
                allowNull: false
            },
            coverImage: {
                type: Sequelize.STRING(128),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('pending', 'valid', 'removed'),
                allowNull: false
            },
            txCreationObj: {
                type: Sequelize.JSON
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
            tableName: 'community',
            sequelize: queryInterface.sequelize, // this bit is important
        });
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
            date: {
                type: Sequelize.DATE,
                allowNull: false
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
            tableName: 'communitydailystate',
            sequelize: queryInterface.sequelize, // this bit is important
        });
        const communities = await Community.findAll();
        const allCommunitiesState = [];
        const allCommunitiesDailyState = [];

        for (let index = 0; index < communities.length; index++) {
            const community = communities[index];
            allCommunitiesState.push({
                communityId: community.publicId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            let beginingDay = community.createdAt;
            beginingDay.setHours(0, 0, 0, 0);
            //
            beginingDay = new Date(beginingDay.getTime() + 60 * 60 * 1000);
            //
            const fiveDaysFromNow = (new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000)).setHours(0, 0, 0, 0);
            while (beginingDay <= fiveDaysFromNow) {
                allCommunitiesDailyState.push({
                    communityId: community.publicId,
                    date: beginingDay,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                beginingDay = new Date(beginingDay.getTime() + 24 * 60 * 60 * 1000);
            }
        }

        return Promise.all([
            queryInterface.bulkInsert('communitystate', allCommunitiesState),
            queryInterface.bulkInsert('communitydailystate', allCommunitiesDailyState),
        ]);
    },
    down: (queryInterface) => {
    }
};