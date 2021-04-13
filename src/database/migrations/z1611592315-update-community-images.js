'use strict';

const AWS = require('aws-sdk');
const sharp = require('sharp');

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

        const communities = await Community.findAll({
            attributes: ['publicId', 'coverImage'],
            where: {
                status: 'valid',
            },
        });

        console.log(communities.length);

        const oldS3 = new AWS.S3({
            accessKeyId: process.env.OLD_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.OLD_AWS_SECRET_ACCESS_KEY,
            region: 'eu-west-3',
        });

        const newS3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: 'eu-west-1',
        });

        const bucketName = process.env.AWS_BUCKET_IMAGES_COMMUNITY;

        for (let c = 0; c < communities.length; c++) {
            try {
                const e = communities[c];
                const params = {
                    Bucket: 'impactmarket.prod',
                    Key: e.coverImage.split(
                        'https://s3.eu-west-3.amazonaws.com/impactmarket.prod/'
                    )[1],
                };
                const rg = await oldS3.getObject(params).promise();

                // sharp the file
                const imgBuffer = await sharp(rg.Body)
                    .resize({ width: 800 })
                    .jpeg({
                        quality: 60,
                        chromaSubsampling: '4:4:4',
                    })
                    .toBuffer();

                // content file
                const today = new Date();
                const filePrefix = `${today.getFullYear()}${
                    today.getMonth() + 1
                }/`;
                const filename = `${Date.now().toString()}.jpeg`;
                const filePath = `${filePrefix}${filename}`;

                const paramsp = {
                    Bucket: bucketName,
                    Key: filePath,
                    Body: imgBuffer,
                    ACL: 'public-read',
                };
                const rp = await newS3.upload(paramsp).promise();

                await Community.update(
                    { coverImage: process.env.CLOUDFRONT_URL + '/' + rp.Key },
                    { where: { publicId: e.publicId } }
                );
                console.log('success for ' + e.publicId);
            } catch (e) {
                console.log('failed for ', communities[c].publicId, e);
            }
        }
    },

    down(queryInterface, Sequelize) {},
};
