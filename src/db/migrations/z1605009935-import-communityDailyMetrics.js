'use strict';

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
        const SSI = await queryInterface.sequelize.define('ssi', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            communityPublicId: {
                type: Sequelize.UUID,
                references: {
                    model: 'community', // name of Target model
                    key: 'publicId', // key in Target model that we're referencing
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
                allowNull: false
            },
            date: {
                type: Sequelize.DATE,
                allowNull: false
            },
            ssi: {
                type: Sequelize.FLOAT,
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
            tableName: 'ssi',
            sequelize: queryInterface.sequelize, // this bit is important
        });

        const allCommunities = await Community.findAll();
        const ssiToInsert = [];

        for (let c = 0; c < allCommunities.length; c++) {
            const allSSI = await SSI.findAll({ where: { communityPublicId: allCommunities[c].publicId } });

            for (let index = 0; index < allSSI.length; index++) {
                const ssi = allSSI[index];
                const recentSSIs = allSSI.slice(Math.max(index - 5, 0), index + 1);
                const sumSSI = recentSSIs.reduce((acc, mssi) => acc + mssi.ssi, 0);
                // do not fix date here, since ssi was run at paris time
                // and the api and db were at utc time, so it was the right day
                // const fixDate = new Date(ssi.date.getTime() - 86400000);
                if (recentSSIs.length !== 0) {
                    ssiToInsert.push({
                        communityId: ssi.communityPublicId,
                        ssiDayAlone: ssi.ssi,
                        ssi: Math.round(parseFloat((sumSSI / recentSSIs.length).toFixed(2)) * 100) / 100,
                        ubiRate: 0,
                        estimatedDuration: 0,
                        date: ssi.date,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }
        }
        return queryInterface.bulkInsert('communitydailymetrics', ssiToInsert);
    },

    down(queryInterface, Sequelize) {
    },
};
