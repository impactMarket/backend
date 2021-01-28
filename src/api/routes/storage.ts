import fleekStorage from '@fleekhq/fleek-storage-js';
import { Logger } from '@logger/logger';
import CommunityService from '@services/community';
import { uploadContentToS3 } from '@services/storage';
import AWS from 'aws-sdk';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';

import config from '../../config';

export default (app: Router): void => {
    const route = Router();
    const storage = multer.memoryStorage();
    const upload = multer({ storage });
    new AWS.Config({
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        region: config.aws.region,
        //
        apiVersion: '2006-03-01',
    });

    app.use('/storage', route);

    route.post('/upload', (req, res) => {
        try {
            upload.single('imageFile')(req, res, async (err) => {
                if (err) {
                    Logger.error('Error during /storage/upload ', err);
                    res.sendStatus(403);
                }

                // sharp the file
                const imgBuffer = await sharp(req.file.buffer)
                    .resize({ width: 800 })
                    .jpeg({
                        quality:
                            req.file.size > 3500000
                                ? 40
                                : req.file.size > 1500000
                                ? 60
                                : 80,
                        chromaSubsampling: '4:4:4',
                    })
                    .toBuffer();

                // content file
                const { communityId } = req.body;
                const today = new Date();
                const filePrefix = `${today.getFullYear()}${
                    today.getMonth() + 1
                }/`;
                const filename = `${Date.now().toString()}.jpeg`;
                const filePath = `${filePrefix}${filename}`;

                // upload to aws
                try {
                    const uploadResult = await uploadContentToS3(
                        filePath,
                        imgBuffer
                    );
                    // update community picture
                    CommunityService.updateCoverImage(
                        communityId,
                        `${config.cloudfrontUrl}/${uploadResult.Key}`
                    );
                } catch (e) {
                    Logger.error(
                        'Error during worker upload_image_queue(to aws) ' + e
                    );
                    res.sendStatus(403);
                }

                // upload to fleekstorage
                try {
                    // also upload to fleek storage
                    await fleekStorage.upload({
                        apiKey: config.fleekStorage.accessKeyId,
                        apiSecret: config.fleekStorage.secretAccessKey,
                        key: filePath,
                        data: imgBuffer,
                    });
                } catch (e) {
                    Logger.error(
                        'Error during worker upload_image_queue(to fleek) ' + e
                    );
                    res.sendStatus(403);
                }

                // sucess
                res.sendStatus(200);
            });
        } catch (e) {
            Logger.error('Error during /upload ', e);
            res.sendStatus(403);
        }
    });
};
