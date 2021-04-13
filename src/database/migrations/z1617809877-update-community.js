'use strict';

const AWS = require('aws-sdk');
const sizeOf = require('image-size');

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        await queryInterface.addColumn('community', 'coverMediaId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'app_media_content',
                key: 'id',
            },
            // onDelete: 'SET NULL', // default
            allowNull: true, // temporary, will change to false below
        });

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
                cover: {
                    type: Sequelize.INTEGER,
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
        const AppMediaContent = await queryInterface.sequelize.define(
            'community',
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
                timestamps: false,
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        const communities = await Community.findAll({
            attributes: ['publicId', 'coverImage'],
        });

        const S3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });

        for (let c = 0; c < communities.length; c++) {
            try {
                const e = communities[c];

                const params = {
                    Bucket: process.env.AWS_BUCKET_COMMUNITY,
                    Key: e.coverImage.split(process.env.CLOUDFRONT_URL)[1],
                };
                const rg = await S3.getObject(params).promise();

                const dimensions = sizeOf(rg.Body);

                const media = await AppMediaContent.create({
                    url: e.coverImage,
                    width: dimensions.width,
                    height: dimensions.height,
                });

                await Community.update(
                    { coverMediaId: media.id },
                    { where: { id: e.id } }
                );
                console.log('success for ' + e.id);
            } catch (e) {
                console.log('failed for ', communities[c].publicId, e);
            }
        }
        await queryInterface.changeColumn('community', 'coverMediaId', {
            allowNull: false,
        });
    },

    down(queryInterface, Sequelize) {},
};
