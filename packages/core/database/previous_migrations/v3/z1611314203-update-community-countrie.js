'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
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

        // Argentina -> AR
        // Brasil -> BR
        // Ghana -> GH
        // Nigeria -> NG
        // Philippines -> PH
        // Honduras -> HN
        // Venezuela -> VE
        // Cabo Verde -> CV
        // Portugal -> PT
        const countries = new Map();
        countries.set('Argentina', 'AR');
        countries.set('Brasil', 'BR');
        countries.set('Ghana', 'GH');
        countries.set('Nigeria', 'NG');
        countries.set('Philippines', 'PH');
        countries.set('Honduras', 'HN');
        countries.set('Venezuela', 'VE');
        countries.set('Cabo Verde', 'CV');
        countries.set('Portugal', 'PT');

        const communities = await Community.findAll({
            attributes: ['publicId', 'country'],
        });

        for (let c = 0; c < communities.length; c++) {
            const e = communities[c];
            await Community.update(
                { country: countries.get(e.country) },
                { where: { publicId: e.publicId } }
            );
        }
    },

    down(queryInterface, Sequelize) {},
};
