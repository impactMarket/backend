'use strict';

const BigNumber = require('bignumber.js');

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        const Inflow = await queryInterface.sequelize.define(
            'inflow',
            {
                id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                },
                from: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                },
                communityId: {
                    type: Sequelize.UUID,
                    references: {
                        model: 'community', // name of Target model
                        key: 'publicId', // key in Target model that we're referencing
                    },
                    onDelete: 'RESTRICT',
                    allowNull: false,
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
                    type: Sequelize.DATE,
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
            },
            {
                tableName: 'inflow',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );
        const Claim = await queryInterface.sequelize.define(
            'claim',
            {
                id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                },
                address: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                },
                communityId: {
                    type: Sequelize.UUID,
                    references: {
                        model: 'community', // name of Target model
                        key: 'publicId', // key in Target model that we're referencing
                    },
                    onDelete: 'RESTRICT',
                    allowNull: false,
                },
                amount: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(24), // max 999,999 - plus 18 decimals
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
                    type: Sequelize.DATE,
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
            },
            {
                tableName: 'claim',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );
        const GlobalDailyState = await queryInterface.sequelize.define(
            'globaldailystate',
            {
                date: {
                    type: Sequelize.DATEONLY,
                    primaryKey: true,
                    unique: true,
                    allowNull: false,
                },
                avgMedianSSI: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                claimed: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                claims: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                beneficiaries: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                raised: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                backers: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                volume: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(29), // max 99,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                transactions: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                reach: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                totalRaised: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(30), // max 999,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                totalDistributed: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(30), // max 999,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                totalBackers: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                totalBeneficiaries: {
                    type: Sequelize.INTEGER, // max 2,147,483,647
                    allowNull: false,
                },
                givingRate: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                ubiRate: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                fundingRate: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                spendingRate: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                avgComulativeUbi: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(24), // max 999,999 - plus 18 decimals
                    allowNull: false,
                },
                avgUbiDuration: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                totalVolume: {
                    // https://github.com/sequelize/sequelize/blob/2874c54915b2594225e939809ca9f8200b94f454/lib/dialects/postgres/data-types.js#L102
                    type: Sequelize.DECIMAL(32), // max 99,999,999,999,999 - plus 18 decimals
                    allowNull: false,
                },
                totalTransactions: {
                    type: Sequelize.BIGINT, // max 9,223,372,036,854,775,807
                    allowNull: false,
                },
                totalReach: {
                    type: Sequelize.BIGINT, // max 9,223,372,036,854,775,807
                    allowNull: false,
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
            },
            {
                tableName: 'globaldailystate',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );
        const Community = await queryInterface.sequelize.define(
            'community',
            {
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
                    allowNull: false,
                },
                description: {
                    type: Sequelize.STRING(1024),
                    allowNull: false,
                },
                descriptionEn: {
                    type: Sequelize.STRING(1024),
                    allowNull: true,
                },
                language: {
                    type: Sequelize.STRING(8),
                    defaultValue: 'en',
                    allowNull: false,
                },
                currency: {
                    type: Sequelize.STRING(4),
                    defaultValue: 'USD',
                    allowNull: false,
                },
                city: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                country: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                gps: {
                    type: Sequelize.JSON,
                    allowNull: false,
                },
                email: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                visibility: {
                    type: Sequelize.ENUM('public', 'private'),
                    allowNull: false,
                },
                coverImage: {
                    type: Sequelize.STRING(128),
                    allowNull: false,
                },
                status: {
                    type: Sequelize.ENUM('pending', 'valid', 'removed'),
                    allowNull: false,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            },
            {
                tableName: 'community',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );
        const Beneficiary = await queryInterface.sequelize.define(
            'beneficiary',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                address: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                },
                communityId: {
                    type: Sequelize.UUID,
                    references: {
                        model: 'community', // name of Target model
                        key: 'publicId', // key in Target model that we're referencing
                    },
                    onDelete: 'RESTRICT',
                    allowNull: false,
                },
                active: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
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
                claims: {
                    type: Sequelize.INTEGER,
                    defaultValue: 0,
                    allowNull: false,
                },
                lastClaimAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                penultimateClaimAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            },
            {
                tableName: 'beneficiary',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        const onlyPublicValidCommunities = (
            await Community.findAll({
                attributes: ['publicId'],
                where: {
                    status: 'valid',
                    visibility: 'public',
                },
            })
        ).map((c) => c.publicId);

        // select sum(amount) a, date("txAt") d from inflow group by date("txAt")
        const allInflow = await Inflow.findAll({
            attributes: [
                [Sequelize.fn('sum', Sequelize.col('amount')), 'a'],
                [Sequelize.fn('date', Sequelize.col('txAt')), 'd'],
            ],
            where: {
                communityId: { [Sequelize.Op.in]: onlyPublicValidCommunities },
            },
            group: [Sequelize.fn('date', Sequelize.col('txAt'))],
            raw: true,
        });
        for (let index = 0; index < allInflow.length; index++) {
            const e = allInflow[index];
            await GlobalDailyState.update(
                { raised: e.a },
                { where: { date: e.d } }
            );
        }

        // select sum(amount) a, count(amount) c, date("txAt") d from claim group by date("txAt")
        const allClaim = await Claim.findAll({
            attributes: [
                [Sequelize.fn('sum', Sequelize.col('amount')), 'a'],
                [Sequelize.fn('count', Sequelize.col('amount')), 'c'],
                [Sequelize.fn('date', Sequelize.col('txAt')), 'd'],
            ],
            where: {
                communityId: { [Sequelize.Op.in]: onlyPublicValidCommunities },
            },
            group: [Sequelize.fn('date', Sequelize.col('txAt'))],
            raw: true,
        });
        for (let index = 0; index < allClaim.length; index++) {
            const e = allClaim[index];
            await GlobalDailyState.update(
                { claimed: e.a, claims: e.c },
                { where: { date: e.d } }
            );
        }

        // select count(address) c, date("txAt") d from beneficiary group by date("txAt")
        const allBeneficiary = await Beneficiary.findAll({
            attributes: [
                [Sequelize.fn('count', Sequelize.col('address')), 'a'],
                [Sequelize.fn('date', Sequelize.col('txAt')), 'd'],
            ],
            where: {
                communityId: { [Sequelize.Op.in]: onlyPublicValidCommunities },
                active: true,
            },
            group: [Sequelize.fn('date', Sequelize.col('txAt'))],
            raw: true,
        });
        for (let index = 0; index < allBeneficiary.length; index++) {
            const e = allBeneficiary[index];
            await GlobalDailyState.update(
                { beneficiaries: e.a },
                { where: { date: e.d } }
            );
        }

        // select claimed, claims, raised, date from globaldailystate order by date asc
        const allGlobalDailyState = await GlobalDailyState.findAll({
            attributes: ['claimed', 'raised', 'beneficiaries', 'date'],
            order: [['date', 'ASC']],
            raw: true,
        });
        let totalRaised = '0';
        let totalDistributed = '0';
        let totalBeneficiaries = 0;
        for (let index = 0; index < allGlobalDailyState.length; index++) {
            const e = allGlobalDailyState[index];
            totalRaised = new BigNumber(totalRaised).plus(e.raised).toString();
            totalDistributed = new BigNumber(totalDistributed)
                .plus(e.claimed)
                .toString();
            totalBeneficiaries += e.beneficiaries;
            await GlobalDailyState.update(
                { totalRaised, totalDistributed, totalBeneficiaries },
                { where: { date: e.date } }
            );
        }
    },

    down(queryInterface, Sequelize) {},
};
