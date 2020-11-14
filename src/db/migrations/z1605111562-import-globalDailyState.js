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
        const CommunityDailyMetrics = await queryInterface.sequelize.define('communitydailymetrics', {
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
            ssiDayAlone: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            ssi: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            ubiRate: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            estimatedDuration: {
                type: Sequelize.FLOAT,
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
            tableName: 'communitydailymetrics',
            sequelize: queryInterface.sequelize, // this bit is important
        });
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

        const onlyPublicValidCommunities = (await Community.findAll({
            attributes: ['publicId'],
            where: {
                status: 'valid',
                visibility: 'public'
            },
        })).map((c) => c.publicId);

        const yesterdayDateOnly = new Date(new Date().getTime() - 86400000);
        yesterdayDateOnly.setHours(0, 0, 0, 0);
        const allCommunityDailyState = await CommunityDailyState.findAll({
            attributes: [
                [Sequelize.fn('sum', Sequelize.col('claimed')), 'totalClaimed'],
                [Sequelize.fn('sum', Sequelize.col('claims')), 'totalClaims'],
                [Sequelize.fn('sum', Sequelize.col('beneficiaries')), 'totalBeneficiaries'],
                [Sequelize.fn('sum', Sequelize.col('raised')), 'totalRaised'],
                'date'
            ],
            where: {
                date: {
                    [Sequelize.Op.lte]: yesterdayDateOnly,
                },
                communityId: { [Sequelize.Op.in]: onlyPublicValidCommunities },
            },
            group: ['date'],
            order: [['date', 'ASC']],
            raw: true
        });
        const allCommunityDailyMetrics = await CommunityDailyMetrics.findAll({
            attributes: [
                [Sequelize.fn('avg', Sequelize.col('ssi')), 'avgSsi']
            ],
            where: {
                communityId: { [Sequelize.Op.in]: onlyPublicValidCommunities },
            },
            group: ['date'],
            order: [['date', 'ASC']],
            raw: true
        });

        const globaldailystateToInsert = [];
        const total = allCommunityDailyMetrics.length;

        let totalRaised = '0';
        let totalDistributed = '0';
        let totalBackers = 0;
        let totalBeneficiaries = 0;
        let totalVolume = '0';
        let totalTransactions = 0;

        for (let index = 0; index < 2; index++) {
            const state = allCommunityDailyState[index];

            totalRaised = new BigNumber(totalRaised).plus(state.totalRaised).toString();
            totalDistributed = new BigNumber(totalDistributed).plus(state.totalClaimed).toString();
            // totalBackers = totalBackers + parseInt(state.totalBackers); // TODO: fix calculation
            totalBeneficiaries = totalBeneficiaries + parseInt(state.totalBeneficiaries);
            totalVolume = '0';
            totalTransactions = 0;

            globaldailystateToInsert.push({
                date: state.date,
                meanSSI: 0,
                claimed: state.totalClaimed,
                claims: state.totalClaims,
                beneficiaries: state.totalBeneficiaries,
                raised: state.totalRaised,
                backers: 0, // TODO: fix calculation
                volume: 0,
                transactions: 0,
                reach: 0,
                totalRaised,
                totalDistributed,
                totalBackers: 0, // TODO: fix calculation
                totalBeneficiaries,
                totalVolume,
                totalTransactions,
                totalReach: 0,
                givingRate: 0,
                ubiRate: 0,
                fundingRate: 0,
                spendingRate: 0,
                avgComulativeUbi: '0',
                avgUbiDuration: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            })
        }

        for (let index = 0; index < total; index++) {
            const metrics = allCommunityDailyMetrics[index];
            const state = allCommunityDailyState[index + 2];

            totalRaised = new BigNumber(totalRaised).plus(state.totalRaised).toString();
            totalDistributed = new BigNumber(totalDistributed).plus(state.totalClaimed).toString();
            const todaysBackers = (await Inflow.findAll({
                attributes: [
                    [Sequelize.fn('count', Sequelize.fn('distinct', Sequelize.col('from'))), 't'],
                ],
                where: {
                    txAt: {
                        [Sequelize.Op.lte]: state.date,
                        [Sequelize.Op.gte]: new Date(new Date(state.date).getTime() - 2592000000), // 30 * 24 * 60 * 60 * 1000
                    }
                },
                raw: true
            }))[0].t;
            totalBackers = parseInt((await Inflow.findAll({
                attributes: [
                    [Sequelize.fn('count', Sequelize.fn('distinct', Sequelize.col('from'))), 't'],
                ],
                where: {
                    txAt: {
                        [Sequelize.Op.lte]: state.date,
                    }
                },
                raw: true
            }))[0].t);
            totalBeneficiaries = totalBeneficiaries + parseInt(state.totalBeneficiaries);
            totalVolume = '0';
            totalTransactions = 0;

            globaldailystateToInsert.push({
                date: state.date,
                meanSSI: Math.round(parseFloat(metrics.avgSsi) * 100) / 100,
                claimed: state.totalClaimed,
                claims: state.totalClaims,
                beneficiaries: state.totalBeneficiaries,
                raised: state.totalRaised,
                backers: parseInt(todaysBackers), // TODO: fix calculation
                volume: 0,
                transactions: 0,
                reach: 0,
                totalRaised,
                totalDistributed,
                totalBackers, // TODO: fix calculation
                totalBeneficiaries,
                totalVolume,
                totalTransactions,
                totalReach: 0,
                givingRate: 0,
                ubiRate: 0,
                fundingRate: 0,
                spendingRate: 0,
                avgComulativeUbi: '0',
                avgUbiDuration: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            })
        }

        return queryInterface.bulkInsert('globaldailystate', globaldailystateToInsert);
    },

    down(queryInterface, Sequelize) {
    },
};
