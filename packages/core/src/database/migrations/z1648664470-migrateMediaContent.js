'use strict';

const AWS = require('aws-sdk');

module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
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

        const appMediaContent = await AppMediaContent.findAll({
            attributes: ['id', 'url'],
        });

        console.log(appMediaContent.length);

        const oldS3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });

        const newS3 = new AWS.S3({
            accessKeyId: process.env.NEW_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.NEW_AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });

        const batch = 200;
        for (let i = 0; ; i = i + batch) {
            const mediaContents = appMediaContent.slice(i, i + batch);
            const promises = mediaContents.map(async (media) => {
                // return new Promise(async (resolve, reject) => {
                    try {
                        const key = media.url.split(process.env.CLOUDFRONT_URL + '/')[1];
                        const category = key.split('/')[0];
    
                        let bucket;
                        switch (category) {
                            case 'cover':
                                bucket = process.env.AWS_BUCKET_COMMUNITY;
                                break;
                            case 'story':
                                bucket = process.env.AWS_BUCKET_STORY;
                                break;
                            case 'avatar':
                                bucket = process.env.AWS_BUCKET_PROFILE;
                                break;
                            default:
                                break;
                        }
                        if (!bucket) return;
                        const params = {
                            Bucket: bucket,
                            Key: key,
                        };
                        const rg = await oldS3.getObject(params).promise();
    
                        // sharp the file
                        const imgBuffer = rg.Body;
    
                        const paramsp = {
                            Bucket: process.env.NEW_AWS_BUCKET,
                            Key: key,
                            Body: imgBuffer,
                            ACL: 'public-read',
                        };
                        const rp = await newS3.upload(paramsp).promise();
                        console.log('success for ' + media.id);
    
                        return AppMediaContent.update(
                            { url: process.env.NEW_CLOUDFRONT_URL + '/' + rp.Key },
                            { where: { id: media.id } }
                        );
                    } catch (e) {
                        console.log('failed for ', media.id);
                    }
            });
            await Promise.all(promises);
            if (i + batch > appMediaContent.length) {
                break;
            }
        }
    },

    down(queryInterface, Sequelize) {},
};
