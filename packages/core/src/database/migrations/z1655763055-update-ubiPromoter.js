'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        await queryInterface.addColumn('ubi_promoter', 'logoMediaPath', {
            type: Sequelize.STRING(44),
            allowNull: true,
        });

        const UbiPromoter = await queryInterface.sequelize.define(
            'ubi_promoter',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                category: {
                    type: Sequelize.ENUM('organization', 'company', 'individual'),
                    allowNull: false,
                },
                name: {
                    type: Sequelize.STRING(64),
                    allowNull: false,
                },
                description: {
                    type: Sequelize.STRING(512),
                    allowNull: false,
                },
                logoMediaId: {
                    type: Sequelize.INTEGER,
                    // onDelete: 'SET NULL', // default
                    allowNull: false,
                },
                logoMediaPath: {
                    type: Sequelize.STRING(44),
                    // onDelete: 'SET NULL', // default
                    allowNull: true,
                },
            },
            {
                tableName: 'ubi_promoter',
                sequelize: queryInterface.sequelize, 
                timestamps: false,
            }
        );

        const AppMediaContent = await queryInterface.sequelize.define(
            'app_media_content',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                url: {
                    type: Sequelize.STRING(128),
                    allowNull: false,
                },
                width: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                height: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
            },
            {
                tableName: 'app_media_content',
                sequelize: queryInterface.sequelize, // this bit is important
                timestamps: false,
            }
        );

        const promoters = await UbiPromoter.findAll();

        for (let index = 0; index < promoters.length; index++) {
            const element = promoters[index];
            
            const appMediaContent = await AppMediaContent.findOne({
                attributes: ['id', 'url'],
                where: {
                    id: element.logoMediaId
                }
            });
            const media = appMediaContent.url.split('/');
            await UbiPromoter.update(
                { logoMediaPath: `${media[3]}/${media[4]}`},
                { where: { id: element.id } }
            );
        }

        await queryInterface.changeColumn('ubi_promoter', 'logoMediaPath', {
            type: Sequelize.STRING(44),
            allowNull: false,
        });
        await queryInterface.removeColumn('ubi_promoter', 'logoMediaId');
    },

    down(queryInterface, Sequelize) {},
};
