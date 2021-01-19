import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { Logger } from '@logger/logger';
import config from '../../config';
import AWS from 'aws-sdk';
import fleekStorage from '@fleekhq/fleek-storage-js';
import CommunityService from '@services/community';
import sharp from 'sharp';


export default (app: Router): void => {
    const route = Router();
    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });
    console.log('1');
    new AWS.Config({
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        region: config.aws.region,
        //
        apiVersion: "2006-03-01",
    });
    console.log('2');

    app.use('/storage', route);

    route.post(
        '/upload',
        (req, res) => {
            try {
                console.log('reading');
                upload.single('imageFile')(req, res, async (err) => {
                    console.log('starting');
                    if (err) {
                        Logger.error('Error during /upload ', err);
                        res.sendStatus(403);
                    }
                    const imgBuffer = await sharp((req.file as any).buffer)
                        .resize({ width: 800 })
                        .jpeg({
                            chromaSubsampling: '4:4:4'
                        })
                        .toBuffer();
                    console.log('formatted');
                    const { communityId } = req.body;
                    const fileExtension = path.extname(req.file.originalname);
                    const today = new Date();
                    const s3FilePrefix = `${today.getFullYear()}${(today.getMonth() + 1)}/`;
                    const s3Filename = `${Date.now().toString()}${fileExtension}`;
                    const s3FilePath = `${s3FilePrefix}${s3Filename}`;
                    try {
                        const params: AWS.S3.PutObjectRequest = {
                            Bucket: config.aws.picturesBucket,
                            Key: s3FilePath,
                            Body: imgBuffer,
                            ACL: 'public-read'
                        };
                        //
                        const upload = new AWS.S3.ManagedUpload({ params });
                        const uploadResult = await upload.promise();
                        console.log(uploadResult)
                        // update community picture
                        CommunityService.updateCoverImage(communityId, uploadResult.Location);
                    } catch (e) {
                        Logger.error('Error during worker upload_image_queue(to aws) ' + e);
                        res.sendStatus(403);
                    }
                    try {
                        // also upload to fleek storage
                        const res = await fleekStorage.upload({
                            apiKey: config.fleekStorage.accessKeyId,
                            apiSecret: config.fleekStorage.secretAccessKey,
                            key: s3FilePath,
                            data: imgBuffer,
                        });
                        console.log(res)
                    } catch (e) {
                        Logger.error('Error during worker upload_image_queue(to fleek) ' + e);
                        res.sendStatus(403);
                    }
                    res.sendStatus(200);
                });
            } catch (e) {
                Logger.error('Error during /upload ', e);
                res.sendStatus(403);
            }
        }
    );
};
